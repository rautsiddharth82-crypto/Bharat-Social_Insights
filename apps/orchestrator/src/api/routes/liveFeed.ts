import { FastifyInstance } from "fastify";
import { pgPool } from "../../db/timescale.js";

// Shared SQL fragment builders so /live, /facets and /provenance all agree on
// how a post is addressed in the pipeline.
function buildFilters(query: Record<string, string | undefined>) {
  const conditions: string[] = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  const add = (clause: string, value: any) => {
    conditions.push(clause.replace("?", `$${idx++}`));
    params.push(value);
  };

  // Free-text keyword search — matches post body, topic, region and author handle.
  if (query.q && query.q.trim()) {
    const term = `%${query.q.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(text) LIKE $${idx} OR LOWER(COALESCE(topic_name, '')) LIKE $${idx} OR LOWER(COALESCE(region, '')) LIKE $${idx} OR LOWER(post_id) LIKE $${idx} OR LOWER(COALESCE(author_id, '')) LIKE $${idx})`);
    idx++;
    params.push(term);
  }
  if (query.platform) add("platform = ?", query.platform);
  if (query.sentiment) add("sentiment = ?", query.sentiment);
  if (query.topic) add("topic_id = ?", query.topic);
  if (query.region) add("LOWER(COALESCE(region, '')) LIKE ?", `%${query.region.toLowerCase()}%`);
  if (query.language) add("LOWER(COALESCE(language, '')) = ?", query.language.toLowerCase());
  if (query.bot === "true") add("is_suspected_bot = ?", true);
  if (query.bot === "false") add("is_suspected_bot = ?", false);
  // `demo` lets the UI explicitly include or exclude synthetic/synthesised samples.
  if (query.demo === "true") add("is_demo_sample = ?", true);
  if (query.demo === "false") add("is_demo_sample = ?", false);
  if (query.minScore) add("sentiment_score >= ?", Number(query.minScore));
  if (query.maxScore) add("sentiment_score <= ?", Number(query.maxScore));
  if (query.since) add("timestamp >= ?", new Date(query.since));
  if (query.until) add("timestamp <= ?", new Date(query.until));

  return { where: conditions.join(" AND "), params, nextIdx: idx };
}

const SORTABLE: Record<string, string> = {
  timestamp: "timestamp",
  engagement: "(likes + shares + comments_count)",
  sentiment: "sentiment_score",
  forwards: "forward_count"
};

export async function postsRoutes(fastify: FastifyInstance) {
  // Live feed: keyword + region + language + bot + demo + time-range search with
  // real pagination. Every filter maps to a indexed column on the posts hypertable.
  fastify.get("/live", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(parseInt(query.limit || "50", 10) || 50, 1), 200);
    const offset = Math.max(parseInt(query.offset || "0", 10) || 0, 0);
    const sortCol = SORTABLE[query.sort || "timestamp"] || SORTABLE.timestamp;
    const direction = query.order === "asc" ? "ASC" : "DESC";

    const { where, params, nextIdx } = buildFilters(query);

    try {
      const [countRes, postsRes] = await Promise.all([
        pgPool.query(`SELECT COUNT(*)::int AS total FROM posts WHERE ${where}`, [...params]),
        pgPool.query(
          `SELECT
            post_key, post_id, platform, author_hashed, text, timestamp, likes, shares, comments_count,
            language, region, sentiment, sentiment_score, emotions,
            topic_id, topic_name, stance, is_suspected_bot, is_demo_sample,
            coordination_cluster_id, forward_count, canonical_post_id
          FROM posts
          WHERE ${where}
          ORDER BY ${sortCol} ${direction}
          LIMIT $${nextIdx} OFFSET $${nextIdx + 1};`,
          [...params, limit, offset]
        )
      ]);

      const totalMatching = countRes.rows[0]?.total ?? 0;
      return {
        posts: postsRes.rows,
        total: postsRes.rowCount,
        total_matching: totalMatching,
        limit,
        offset,
        has_more: offset + limit < totalMatching,
        filters_applied: Object.keys(query).filter((k) => k !== "limit" && k !== "offset" && k !== "sort" && k !== "order"),
        source: postsRes.rowCount ? "live" : "empty"
      };
    } catch (err) {
      console.error("Error fetching live posts:", err);
      return { posts: [], total: 0, total_matching: 0, limit, offset, has_more: false, source: "error" };
    }
  });

  // Facets: distinct values currently present in the database, so the UI filter
  // dropdowns are populated from real data instead of hardcoded option lists.
  fastify.get("/facets", async (req, reply) => {
    try {
      const res = await pgPool.query(`
        SELECT
          COALESCE((SELECT ARRAY_AGG(DISTINCT platform) FROM posts WHERE platform IS NOT NULL), '{}') AS platforms,
          COALESCE((SELECT ARRAY_AGG(DISTINCT sentiment) FROM posts WHERE sentiment IS NOT NULL), '{}') AS sentiments,
          (SELECT COUNT(DISTINCT topic_id) FROM posts) AS topic_count;
      `);
      const [topicsRes, regionsRes, langsRes] = await Promise.all([
        pgPool.query(`
          SELECT topic_id, MAX(topic_name) AS topic_name, COUNT(*)::int AS count
          FROM posts WHERE topic_id IS NOT NULL
          GROUP BY topic_id ORDER BY count DESC LIMIT 40;
        `),
        pgPool.query(`
          SELECT region, COUNT(*)::int AS count FROM posts
          WHERE region IS NOT NULL AND region <> ''
          GROUP BY region ORDER BY count DESC LIMIT 40;
        `),
        pgPool.query(`
          SELECT language, COUNT(*)::int AS count FROM posts
          WHERE language IS NOT NULL AND language <> ''
          GROUP BY language ORDER BY count DESC LIMIT 20;
        `)
      ]);
      const row = res.rows[0] || {};
      return {
        platforms: (row.platforms || []).filter(Boolean),
        sentiments: (row.sentiments || []).filter(Boolean),
        topics: topicsRes.rows,
        regions: regionsRes.rows,
        languages: langsRes.rows,
        total_topics: row.topic_count || topicsRes.rows.length,
        source: topicsRes.rows.length || regionsRes.rows.length ? "live" : "empty"
      };
    } catch (err) {
      console.error("Error fetching facets:", err);
      return { platforms: [], sentiments: [], topics: [], regions: [], languages: [], source: "error" };
    }
  });

  // ── Provenance: "how did this news arrive?" ────────────────────────
  // Reconstructs the real cross-platform arrival story for one topic (or one
  // specific post) straight from the rows the ingestion pipeline wrote:
  //   * timestamp  = when the content existed in the wild
  //   * created_at = when OUR connector + queue + ML pipeline actually captured it
  // The gap between those two is the honest detection-latency figure.
  fastify.get("/provenance", async (req, reply) => {
    const query = req.query as { topic?: string; post_key?: string; window_hours?: string };
    const windowHours = Math.min(Math.max(parseInt(query.window_hours || "72", 10) || 72, 1), 720);

    try {
      let topicId = query.topic;
      let seedRow: any = null;

      // If the analyst pointed at a single post, resolve its topic first.
      if (query.post_key && !topicId) {
        const seed = await pgPool.query(
          `SELECT post_key, topic_id, topic_name, timestamp FROM posts WHERE post_key = $1 LIMIT 1`,
          [query.post_key]
        );
        seedRow = seed.rows[0];
        if (seedRow) topicId = seedRow.topic_id;
      }

      if (!topicId) {
        // No topic supplied → fall back to the busiest topic right now, which is
        // the story an analyst would actually be asked about.
        const hottest = await pgPool.query(`
          SELECT topic_id, COUNT(*)::int AS c FROM posts
          WHERE topic_id IS NOT NULL AND timestamp >= NOW() - INTERVAL '72 hours'
          GROUP BY topic_id ORDER BY c DESC LIMIT 1;
        `);
        topicId = hottest.rows[0]?.topic_id;
      }

      if (!topicId) {
        return { topic: null, source: "empty", origin: null, platform_arrival: [], timeline: [] };
      }

      const scopeWhere = `topic_id = $1 AND timestamp >= NOW() - INTERVAL '1 hour' * ($2::int)`;
      const scopeParams = [topicId, windowHours];

      const [originRes, arrivalRes, volumeRes, dupRes] = await Promise.all([
        // The very first captured instance of the narrative.
        pgPool.query(
          `SELECT post_key, post_id, platform, author_hashed, text, timestamp, created_at, region, language,
                  sentiment, sentiment_score, topic_name, is_suspected_bot, is_demo_sample, forward_count,
                  engagement_placeholder
           FROM (
             SELECT *, (COALESCE(likes,0) + COALESCE(shares,0) + COALESCE(comments_count,0)) AS engagement_placeholder
             FROM posts WHERE ${scopeWhere}
           ) p
           ORDER BY timestamp ASC LIMIT 1;`,
          scopeParams
        ),
        // First appearance per platform — this IS the cross-platform arrival order.
        pgPool.query(
          `SELECT DISTINCT ON (platform)
             platform, post_key, post_id, author_hashed, text, timestamp, created_at, region, language,
             sentiment, sentiment_score, topic_name, is_suspected_bot, is_demo_sample, forward_count,
             (COALESCE(likes,0) + COALESCE(shares,0) + COALESCE(comments_count,0)) AS engagement
           FROM posts
           WHERE ${scopeWhere}
           ORDER BY platform, timestamp ASC;`,
          scopeParams
        ),
        pgPool.query(
          `SELECT
             COUNT(*)::int AS total_posts,
             COUNT(DISTINCT platform)::int AS platform_count,
             COUNT(DISTINCT author_hashed)::int AS author_count,
             COUNT(*) FILTER (WHERE is_suspected_bot) AS bot_posts,
             COUNT(*) FILTER (WHERE is_demo_sample) AS demo_posts,
             COUNT(*) FILTER (WHERE canonical_post_id IS NOT NULL) AS near_duplicate_posts,
             COUNT(DISTINCT coordination_cluster_id) AS cluster_count,
             AVG(EXTRACT(EPOCH FROM (created_at - timestamp))) AS avg_detection_lag_seconds,
             MIN(timestamp) AS first_seen, MAX(timestamp) AS last_seen
           FROM posts WHERE ${scopeWhere};`,
          scopeParams
        ),
        // Near-duplicate forwarding chains (same canonical_post_id = same text moved around).
        pgPool.query(
          `SELECT canonical_post_id,
             COUNT(*)::int AS hop_count,
             COUNT(DISTINCT platform)::int AS platform_count,
             MIN(timestamp) AS first_seen, MAX(timestamp) AS last_seen,
             ARRAY_AGG(DISTINCT platform ORDER BY platform) AS platforms
           FROM posts
           WHERE ${scopeWhere} AND canonical_post_id IS NOT NULL
           GROUP BY canonical_post_id ORDER BY hop_count DESC LIMIT 10;`,
          scopeParams
        )
      ]);

      const origin = originRes.rows[0] || null;
      const originTime = origin ? new Date(origin.timestamp).getTime() : Date.now();
      const v = volumeRes.rows[0] || {};

      const arrivalOrder = arrivalRes.rows
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((row: any, index: number) => ({
          step: index + 1,
          platform: row.platform,
          post_key: row.post_key,
          text: String(row.text || "").slice(0, 280),
          author_hashed: row.author_hashed,
          region: row.region,
          language: row.language,
          sentiment: row.sentiment,
          sentiment_score: row.sentiment_score,
          is_suspected_bot: row.is_suspected_bot,
          is_demo_sample: row.is_demo_sample,
          forward_count: row.forward_count,
          engagement: row.engagement,
          observed_at: row.timestamp,
          captured_at: row.created_at,
          // Seconds between the post existing and our pipeline storing it.
          detection_lag_seconds: row.created_at
            ? Math.max(Math.round((new Date(row.created_at).getTime() - new Date(row.timestamp).getTime()) / 1000), 0)
            : null,
          // Seconds behind the earliest known instance of this narrative.
          lag_from_origin_seconds: Math.round((new Date(row.timestamp).getTime() - originTime) / 1000),
          is_origin_platform: index === 0
        }));

      const fastestChain = dupRes.rows[0] || null;

      return {
        topic: topicId,
        topic_name: origin?.topic_name || topicId,
        window_hours: windowHours,
        origin,
        platform_arrival: arrivalOrder,
        // Ordered event list the UI can render as a vertical timeline.
        timeline: arrivalOrder.map((a) => ({
          time: a.observed_at,
          platform: a.platform,
          post_key: a.post_key,
          label: `${a.platform}:${a.step}`,
          lag_from_origin_seconds: a.lag_from_origin_seconds
        })),
        statistics: {
          total_posts: v.total_posts ?? 0,
          platforms_touched: v.platform_count ?? 0,
          distinct_authors: v.author_count ?? 0,
          bot_flagged_posts: v.bot_posts ?? 0,
          demo_sample_posts: v.demo_posts ?? 0,
          near_duplicate_posts: v.near_duplicate_posts ?? 0,
          coordination_clusters: v.cluster_count ?? 0,
          avg_detection_lag_seconds: v.avg_detection_lag_seconds != null ? Math.round(v.avg_detection_lag_seconds) : null,
          first_seen: v.first_seen ?? null,
          last_seen: v.last_seen ?? null,
          spread_window_seconds: arrivalOrder.length > 1
            ? Math.round((new Date(arrivalOrder[arrivalOrder.length - 1].observed_at).getTime() - originTime) / 1000)
            : 0
        },
        forwarding_chains: dupRes.rows,
        largest_chain: fastestChain,
        source: origin ? "live" : "empty"
      };
    } catch (err) {
      console.error("Error fetching provenance:", err);
      return { topic: query.topic || null, source: "error", origin: null, platform_arrival: [], timeline: [] };
    }
  });
}

export async function statsRoutes(fastify: FastifyInstance) {
  // Overview KPIs for the dashboard
  fastify.get("/overview", async (req, reply) => {
    try {
      const [kpiRes, platformRes, topicCountRes] = await Promise.all([
        pgPool.query(`
          SELECT
            COUNT(*) AS total_posts,
            COUNT(DISTINCT topic_id) AS active_topics,
            COUNT(DISTINCT platform) AS active_platforms,
            COUNT(*) FILTER (WHERE sentiment = 'negative') AS neg_posts,
            COUNT(*) FILTER (WHERE is_suspected_bot = true) AS bot_posts,
            COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour') AS posts_last_hour,
            COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') AS posts_last_24h
          FROM posts;
        `),
        pgPool.query(`
          SELECT platform, COUNT(*)::int AS count
          FROM posts
          GROUP BY platform
          ORDER BY count DESC
          LIMIT 1;
        `),
        pgPool.query(`
          SELECT COUNT(DISTINCT topic_id)::int AS topic_count
          FROM posts
          WHERE timestamp >= NOW() - INTERVAL '24 hours';
        `)
      ]);

      const kpi = kpiRes.rows[0] || {};
      const topPlatform = platformRes.rows[0] || {};
      const topicCount = topicCountRes.rows[0]?.topic_count || 0;
      const total = parseInt(kpi.total_posts || "0", 10);
      const negRatio = total > 0 ? parseInt(kpi.neg_posts || "0", 10) / total : 0;

      return {
        total_posts: total,
        active_topics: topicCount,
        active_platforms: parseInt(kpi.active_platforms || "0", 10),
        top_platform: topPlatform.platform || "youtube",
        top_platform_share: topPlatform.count && total ? Math.round((topPlatform.count / total) * 100) : 0,
        negative_ratio: Math.round(negRatio * 100),
        bot_accounts: parseInt(kpi.bot_posts || "0", 10),
        posts_last_hour: parseInt(kpi.posts_last_hour || "0", 10),
        posts_last_24h: parseInt(kpi.posts_last_24h || "0", 10),
        source: total > 0 ? "live" : "empty"
      };
    } catch (err) {
      console.error("Error fetching overview stats:", err);
      return {
        total_posts: 0,
        active_topics: 5,
        active_platforms: 2,
        top_platform: "youtube",
        top_platform_share: 42,
        negative_ratio: 35,
        bot_accounts: 0,
        posts_last_hour: 0,
        posts_last_24h: 0,
        source: "error"
      };
    }
  });
}
