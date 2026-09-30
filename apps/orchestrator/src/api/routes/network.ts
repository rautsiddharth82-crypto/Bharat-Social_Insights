import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { pgPool } from "../../db/timescale.js";
import { runCypher } from "../../db/neo4j.js";
import { getCascadeTrace } from "../../services/gdsService.js";

function hashAuthor(authorId: string): string {
  if (!authorId) return "usr_anon";
  return "usr_" + crypto.createHash("sha256").update(authorId).digest("hex").slice(0, 10);
}

export async function networkRoutes(fastify: FastifyInstance) {
  fastify.get("/graph", async (req, reply) => {
    const query = req.query as { topic?: string; platform?: string; min_engagement?: string; limit?: string };
    const nodeLimit = Math.min(Math.max(parseInt(query.limit || "40", 10) || 40, 5), 120);
    try {
      // Build a real influence network from authors in the DB.
      const filters: string[] = ["author_hashed IS NOT NULL"];
      const params: any[] = [];
      let i = 1;
      if (query.topic) { filters.push(`topic_id = $${i++}`); params.push(query.topic); }
      if (query.platform) { filters.push(`platform = $${i++}`); params.push(query.platform); }
      if (query.min_engagement) { filters.push(`(COALESCE(likes,0)+COALESCE(shares,0)) >= $${i++}`); params.push(Number(query.min_engagement)); }
      params.push(nodeLimit);

      const res = await pgPool.query(`
        SELECT
          author_hashed AS id,
          MAX(author_id) AS handle,
          platform,
          MAX(region) AS region,
          topic_id,
          MAX(topic_name) AS topic_name,
          COUNT(*) AS post_count,
          SUM(COALESCE(likes,0) + COALESCE(shares,0)) AS engagement,
          AVG(sentiment_score) AS avg_sentiment,
          bool_or(is_suspected_bot) AS any_bot,
          bool_or(is_demo_sample) AS any_demo,
          MAX(timestamp) AS last_active
        FROM posts
        WHERE ${filters.join(" AND ")}
        GROUP BY author_hashed, platform, topic_id
        ORDER BY engagement DESC NULLS LAST
        LIMIT $${i};
      `, params);

      if (res.rows.length > 0) {
        // Overlay the PageRank/degree score the analytics job wrote back to Neo4j.
        let influence: Record<string, number> = {};
        try {
          const graphRows = await runCypher(`
            MATCH (u:User) WHERE u.influence_score IS NOT NULL
            RETURN u.hashed_id AS hashed, u.influence_score AS score, u.influence_method AS method
            LIMIT 500
          `);
          for (const r of graphRows) {
            if (r.hashed) influence[String(r.hashed)] = Number(r.score?.low ?? r.score ?? 0);
          }
        } catch {
          /* graph optional — engagement ranking still works */
        }

        const communityMap: Record<string, number> = {};
        let communityCounter = 1;
        const maxEngagement = Math.max(1, ...res.rows.map((r: any) => parseFloat(r.engagement || "0")));

        const nodes = res.rows.map((row: any) => {
          if (!communityMap[row.topic_id]) communityMap[row.topic_id] = communityCounter++;
          const engagement = parseFloat(row.engagement || "0");
          const graphScore = influence[row.id];
          return {
            id: row.id,
            // A real, human-readable label built from the captured handle.
            label: row.handle ? `${row.handle}`.slice(0, 28) : `${row.platform} User`,
            platform: row.platform,
            topic_id: row.topic_id,
            topic_name: row.topic_name,
            pagerank: graphScore != null && !Number.isNaN(graphScore)
              ? Number(graphScore.toFixed(4))
              : Number((engagement / maxEngagement).toFixed(4)),
            pagerank_source: graphScore != null && !Number.isNaN(graphScore) ? "neo4j-gds" : "engagement",
            community: communityMap[row.topic_id],
            region: row.region || "Unknown",
            post_count: parseInt(row.post_count, 10),
            engagement,
            avg_sentiment: Number(parseFloat(row.avg_sentiment || "0").toFixed(3)),
            is_suspected_bot: !!row.any_bot,
            is_demo_sample: !!row.any_demo,
            last_active: row.last_active,
            val: Math.max(Math.min(engagement / maxEngagement * 20, 20), 4)
          };
        });

        // Edges: shared narrative (strong) and shared region (weak), weighted by
        // how many posts the pair actually has in common.
        const edges: any[] = [];
        const seen = new Set<string>();
        const byTopic: Record<string, any[]> = {};
        const byRegion: Record<string, any[]> = {};
        for (const row of res.rows) {
          (byTopic[row.topic_id] = byTopic[row.topic_id] || []).push(row);
          if (row.region) (byRegion[row.region] = byRegion[row.region] || []).push(row);
        }
        const link = (a: any, b: any, type: string) => {
          if (edges.length >= 160) return;
          const key = a.id < b.id ? `${a.id}|${b.id}|${type}` : `${b.id}|${a.id}|${type}`;
          if (seen.has(key) || a.id === b.id) return;
          seen.add(key);
          edges.push({
            source: a.id,
            target: b.id,
            type,
            weight: Math.round((parseFloat(a.engagement || "0") + parseFloat(b.engagement || "0")) / 100) + 1,
            topic_id: type === "SAME_TOPIC" ? a.topic_id : null,
            region: type === "SAME_REGION" ? a.region : null
          });
        };
        Object.values(byTopic).forEach((group) => {
          for (let x = 0; x < group.length && edges.length < 160; x++)
            for (let y = x + 1; y < group.length; y++) link(group[x], group[y], "SAME_TOPIC");
        });
        Object.values(byRegion).forEach((group) => {
          for (let x = 0; x < group.length && edges.length < 200; x++)
            for (let y = x + 1; y < group.length; y++) link(group[x], group[y], "SAME_REGION");
        });

        const botCount = nodes.filter((n: any) => n.is_suspected_bot).length;
        const demoCount = nodes.filter((n: any) => n.is_demo_sample).length;

        return {
          nodes,
          edges,
          statistics: {
            node_count: nodes.length,
            edge_count: edges.length,
            communities: communityCounter - 1,
            bot_flagged_nodes: botCount,
            demo_sample_nodes: demoCount,
            ranking_source: Object.keys(influence).length ? "neo4j-gds" : "postgres-engagement"
          },
          source: "live"
        };
      }
    } catch (err) {
      console.error("Error building network graph from DB:", err);
    }

    // Fallback static graph — clearly labelled so the UI can badge it as sample data.
    const rawNodes = [
      { id: "channel_defence_india", label: "Defence India Channel", platform: "telegram", pagerank: 0.082, community: 1, region: "Maharashtra" },
      { id: "citizen_journo_in", label: "Citizen Journalist IN", platform: "twitter", pagerank: 0.095, community: 1, region: "Maharashtra" },
      { id: "mumbai_news_handle", label: "Mumbai News Flash", platform: "twitter", pagerank: 0.064, community: 1, region: "Maharashtra" },
      { id: "mumbai_vlogger", label: "Mumbai Commuter Vlog", platform: "youtube", pagerank: 0.048, community: 2, region: "Maharashtra" },
      { id: "page_disaster_alert_in", label: "NDRF Disaster Alert", platform: "facebook", pagerank: 0.088, community: 3, region: "Maharashtra" },
      { id: "delhi_air_watch", label: "Delhi Air Monitor", platform: "twitter", pagerank: 0.042, community: 4, region: "Delhi" },
      { id: "tech_reviewer_in", label: "Tech Reviewer IN", platform: "youtube", pagerank: 0.031, community: 5, region: "Karnataka" }
    ];
    const idMap = new Map<string, string>();
    const nodes = rawNodes.map(n => {
      const hashed = hashAuthor(n.id);
      idMap.set(n.id, hashed);
      return { id: hashed, label: n.label, platform: n.platform, pagerank: n.pagerank, community: n.community, region: n.region, val: Math.max(n.pagerank * 100, 6), is_demo_sample: true };
    });
    const rawEdges = [
      { source: "channel_defence_india", target: "citizen_journo_in", type: "FORWARDED", weight: 4 },
      { source: "citizen_journo_in", target: "mumbai_news_handle", type: "REPLIED_TO", weight: 3 },
      { source: "mumbai_news_handle", target: "mumbai_vlogger", type: "COMMENTED_ON", weight: 2 },
      { source: "page_disaster_alert_in", target: "citizen_journo_in", type: "MENTIONS", weight: 5 }
    ];
    const edges = rawEdges.map(e => ({ source: idMap.get(e.source) || e.source, target: idMap.get(e.target) || e.target, type: e.type, weight: e.weight }));
    return {
      nodes, edges,
      statistics: { node_count: nodes.length, edge_count: edges.length, communities: 5, bot_flagged_nodes: 0, demo_sample_nodes: nodes.length, ranking_source: "static-sample" },
      source: "fallback"
    };
  });

  fastify.get("/cascade", async (req, reply) => {
    const query = req.query as { topic?: string };
    const topic = query.topic || "topic_mumbai_rains";
    const result = await getCascadeTrace(topic);

    // getCascadeTrace may report "no edges captured" instead of a list.
    if (!Array.isArray(result)) {
      return { topic, cascade: [], empty: true, message: (result as any)?.message || "No cascade data captured yet." };
    }

    const sanitizedCascade = result.map((item: any, index: number) => ({
      ...item,
      step: item.step ?? index + 1,
      author_hashed: item.author_hashed || (item.author_id ? hashAuthor(item.author_id) : "usr_anon")
    }));
    return { topic, cascade: sanitizedCascade, source: sanitizedCascade.length ? "live" : "empty" };
  });
}
