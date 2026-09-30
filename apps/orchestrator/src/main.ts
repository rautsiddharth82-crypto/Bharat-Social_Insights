import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { initPostgres } from "./db/timescale.js";
import { initNeo4j } from "./db/neo4j.js";
import { initRedis } from "./db/redis.js";
import { startIngestionWorker, ingestionQueue } from "./queue/ingestionQueue.js";
import { registerRoutes } from "./api/router.js";
import { TelegramCollector } from "./collectors/telegram.js";
import { YouTubeCollector } from "./collectors/youtube.js";
import { RedditCollector } from "./collectors/reddit.js";
import { FacebookCollector } from "./collectors/facebook.js";
import { TwitterCollector } from "./collectors/twitter.js";
import { runGDSAnalytics } from "./services/gdsService.js";
import { runRetentionPolicyJob } from "./services/retentionService.js";

const fastify = Fastify({ logger: true });

const COLLECTION_INTERVAL_MS = 4 * 60 * 1000;

async function runCollectionCycle(
  collectors: Array<TelegramCollector | YouTubeCollector | RedditCollector | FacebookCollector | TwitterCollector>,
  cycleLabel: string
) {
  console.log(`[${cycleLabel}] Starting collection cycle at ${new Date().toISOString()}`);
  let totalIngested = 0;
  for (const collector of collectors) {
    try {
      const posts = await collector.fetch();
      for (const post of posts) {
        try {
          await ingestionQueue.add("ingest", post);
          totalIngested++;
        } catch (qErr) {
          console.error(`Queue add error for ${collector.platformName}:`, qErr);
        }
      }
    } catch (err) {
      console.error(`Collector error [${collector.platformName}]:`, err);
    }
  }
  console.log(`[${cycleLabel}] Collection cycle complete — ${totalIngested} posts queued for ingestion.`);
}

async function start() {
  try {
    // x-analyst-id is a custom header — without listing it here the browser
    // preflight fails once the frontend is served from another origin (Vercel).
    // CORS_ORIGIN accepts a comma-separated list so production + Vercel preview
    // URLs can both be allowed: "https://app.vercel.app,https://dev.app.vercel.app".
    const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
    const originList = corsOrigin.includes(",")
      ? corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
      : corsOrigin;
    await fastify.register(cors, {
      origin: originList as any,
      allowedHeaders: ["Content-Type", "Authorization", "x-analyst-id"],
      methods: ["GET", "POST", "OPTIONS"]
    });

    await initPostgres();
    initNeo4j();
    void initRedis();

    startIngestionWorker();

    const collectors = [
      new TelegramCollector(),
      new YouTubeCollector(),
      new RedditCollector(),
      new FacebookCollector(),
      new TwitterCollector()
    ];

    void runCollectionCycle(collectors, "STARTUP");

    setInterval(() => {
      void runCollectionCycle(collectors, `SCHEDULED ${new Date().toISOString()}`);
    }, COLLECTION_INTERVAL_MS);

    runGDSAnalytics();
    runRetentionPolicyJob(30);

    await registerRoutes(fastify);

    fastify.get("/health", async () => ({ status: "healthy", service: "orchestrator", nextCollectionMs: COLLECTION_INTERVAL_MS }));

    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`Orchestrator listening on port ${config.port} — collection cycle every ${COLLECTION_INTERVAL_MS / 60000} minutes.`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
