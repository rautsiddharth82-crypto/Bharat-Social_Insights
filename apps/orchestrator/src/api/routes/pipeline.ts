import { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { config } from "../../config.js";
import { pgPool } from "../../db/timescale.js";
import { runCypher, neo4jDriver } from "../../db/neo4j.js";
import { redisClient } from "../../db/redis.js";
import { mlClient } from "../../ml-client/mlClient.js";
import { statusTracker } from "../../collectors/statusTracker.js";

// A connection is only created for counting so a Redis outage can never take the
// orchestrator process down with it.
let countQueue: Queue | null = null;
function getCountQueue(): Queue {
  if (!countQueue) {
    countQueue = new Queue("post-ingestion", {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        username: config.redis.username
      }
    });
  }
  return countQueue;
}

// The ordered list of transformations a post goes through between a platform API
// and a row in TimescaleDB. The UI renders this as the "how news arrived" pipeline
// so an analyst can see exactly which stage produced which field.
const PIPELINE_STAGES = [
  {
    order: 1,
    key: "collect",
    name: "Connector Ingestion",
    description: "Polling / webhook capture from Telegram, YouTube, Reddit, Facebook, Twitter.",
    produces: ["post_id", "platform", "text", "likes", "shares", "timestamp"],
    field: "connector"
  },
  {
    order: 2,
    key: "queue",
    name: "BullMQ Ingestion Queue",
    description: "Redis-backed 'post-ingestion' queue decouples collectors from the heavy workers.",
    produces: ["queued", "active", "completed", "failed job counts"],
    field: "queue"
  },
  {
    order: 3,
    key: "clean",
    name: "Text Normalisation",
    description: "HTML entity stripping, URL/mention tokenising, emoji separation, noise removal.",
    produces: ["cleaned text"],
    field: "preprocessing"
  },
  {
    order: 4,
    key: "lang",
    name: "Language Identification",
    description: "Script-based Hindi / English / Hinglish detection with Devanagari transliteration handling.",
    produces: ["language"],
    field: "preprocessing"
  },
  {
    order: 5,
    key: "gazetteer",
    name: "Demographic Gazetteer",
    description: "Region, profession and interest inference from state gazetteer + occupation lexicon.",
    produces: ["region", "profession", "interests"],
    field: "preprocessing"
  },
  {
    order: 6,
    key: "bot",
    name: "Bot & Coordination Detection",
    description: "Near-duplicate timing analysis and coordination cluster assignment.",
    produces: ["is_suspected_bot", "coordination_cluster_id", "canonical_post_id"],
    field: "preprocessing"
  },
  {
    order: 7,
    key: "ml-sentiment",
    name: "ML Sentiment + Emotion",
    description: "MuRIL / DistilBERT sentiment classification with anxiety, anger, sarcasm, support emotion head.",
    produces: ["sentiment", "sentiment_score", "emotions"],
    field: "ml"
  },
  {
    order: 8,
    key: "ml-topics",
    name: "ML Topic Modelling",
    description: "Sentence-transformer embeddings clustered into narrative topics.",
    produces: ["topic_id", "topic_name"],
    field: "ml"
  },
  {
    order: 9,
    key: "ml-stance",
    name: "ML Stance Detection",
    description: "Zero-shot NLI stance of each post toward its detected topic.",
    produces: ["stance"],
    field: "ml"
  },
  {
    order: 10,
    key: "store",
    name: "TimescaleDB + Neo4j Write",
    description: "Hypertable insert (deduplicated on post_key + timestamp) and author/post graph projection.",
    produces: ["posts row", "(:User)-[:POSTED]->(:Post)"],
    field: "storage"
  },
  {
    order: 11,
    key: "privacy",
    name: "Privacy Preservation",
    description: "SHA-256 truncation of author identity to a 16-char pseudonym before storage.",
    produces: ["author_hashed"],
    field: "privacy"
  }
];

export async function pipelineRoutes(fastify: FastifyInstance) {
  fastify.get("", async (req, reply) => {
    // Every probe is independent and non-fatal: the endpoint must always answer
    // so the UI can show which part of the system is healthy vs degraded.
    const [dbRes, graphRes, redisRes, mlRes, queueRes, connectorRes] = await Promise.allSettled([
      (async () => {
        const r = await pgPool.query(`
          SELECT
            COUNT(*)::int AS total_posts,
            MAX(timestamp) AS latest_post,
            MAX(created_at) AS latest_capture,
            COUNT(DISTINCT topic_id)::int AS topics,
            COUNT(DISTINCT platform)::int AS platforms,
            COUNT(*) FILTER (WHERE is_demo_sample) AS demo_posts,
            COUNT(*) FILTER (WHERE NOT is_demo_sample) AS live_posts,
            COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '15 minutes') AS posts_15m
          FROM posts;
        `);
        return r.rows[0];
      })(),
      (async () => {
        if (!neo4jDriver) throw new Error("driver not initialised");
        const nodes = await runCypher(`MATCH (n) RETURN COUNT(n) AS c`);
        const rels = await runCypher(`MATCH ()-[r]->() RETURN COUNT(r) AS c`);
        const users = await runCypher(`MATCH (u:User) RETURN COUNT(u) AS c`);
        const posts = await runCypher(`MATCH (p:Post) RETURN COUNT(p) AS c`);
        const n = (rows: any[]) => Number(rows?.[0]?.c?.low ?? rows?.[0]?.c ?? 0);
        return { nodes: n(nodes), relationships: n(rels), users: n(users), posts: n(posts) };
      })(),
      (async () => {
        if (redisClient.status === "wait") await redisClient.connect().catch(() => undefined);
        const pong = await redisClient.ping();
        const info = await redisClient.info("memory");
        const usedMatch = /used_memory_human:([^\r\n]+)/.exec(info);
        const result: { pong: string | null; used_memory_human: string | null; status: string } = {
          pong,
          used_memory_human: usedMatch?.[1] || null,
          status: redisClient.status
        };
        return result;
      })(),
      mlClient.getHealth(),
      (async () => {
        const q = getCountQueue();
        const counts: any = await q.getJobCounts("waiting", "active", "completed", "failed", "delayed");
        let workerCount = 0;
        try {
          const replications = await redisClient.info("replication");
          workerCount = Number(/connected_slaves:(\d+)/.exec(replications)?.[1] || 0);
        } catch {
          /* ignored */
        }
        const result: { waiting: number; active: number; completed: number; failed: number; delayed: number; workerConnected: number } = {
          waiting: Number(counts?.waiting || 0),
          active: Number(counts?.active || 0),
          completed: Number(counts?.completed || 0),
          failed: Number(counts?.failed || 0),
          delayed: Number(counts?.delayed || 0),
          workerConnected: workerCount
        };
        return result;
      })(),
      statusTracker.getAllStatuses()
    ]);

    const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): { status: string; value: T } => ({
      status: r.status === "fulfilled" ? "ok" : "degraded",
      value: r.status === "fulfilled" ? r.value : fallback
    });

    const db = ok(dbRes, {} as any);
    const graph = ok(graphRes, { nodes: 0, relationships: 0, users: 0, posts: 0 });
    const redis = ok(redisRes, { pong: null, used_memory_human: null, status: "unreachable" });
    const ml = ok(mlRes, { status: "unreachable" });
    const queue = ok(queueRes, { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, workerConnected: 0 });
    const connectors = ok(connectorRes, [] as any[]);

    const mlStatus = (ml.value as any)?.status || "unknown";
    const dbValue: any = db.value;

    const componentHealth = {
      postgres: { state: db.status, detail: `${dbValue.total_posts ?? 0} posts stored` },
      neo4j: {
        state: graph.status === "ok" && graph.value.nodes > 0 ? "ok" : graph.status,
        detail: `${graph.value.nodes} nodes / ${graph.value.relationships} relationships`
      },
      redis: { state: redis.value.pong === "PONG" ? "ok" : "degraded", detail: `status: ${redis.value.status}` },
      ml_service: {
        state: mlStatus === "unreachable" ? "degraded" : "ok",
        detail: mlStatus === "unreachable"
          ? "inference falling back to rule-based heuristic — sentiment will look neutral"
          : `models: ${JSON.stringify((ml.value as any)?.models || (ml.value as any) || {})}`.slice(0, 160)
      },
      queue: {
        state: queue.status,
        detail: `${queue.value.waiting ?? 0} waiting / ${queue.value.active ?? 0} active / ${queue.value.failed ?? 0} failed`
      }
    };

    const overall =
      componentHealth.postgres.state !== "ok"
        ? "critical"
        : Object.values(componentHealth).some((c) => c.state !== "ok")
        ? "degraded"
        : "healthy";

    return {
      overall,
      component_health: componentHealth,
      pipeline_stages: PIPELINE_STAGES,
      database: dbValue,
      graph: graph.value,
      queue: queue.value,
      ml: ml.value,
      redis: { used_memory_human: redis.value.used_memory_human, status: redis.value.status },
      connectors: connectors.value,
      generated_at: new Date().toISOString(),
      source: db.status === "ok" ? "live" : "error"
    };
  });
}
