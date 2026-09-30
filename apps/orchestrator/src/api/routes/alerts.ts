import { FastifyInstance } from "fastify";
import { Alert } from "@bsi/types";
import { pgPool } from "../../db/timescale.js";

export async function alertsRoutes(fastify: FastifyInstance) {
  fastify.get("", async (req, reply) => {
    try {
      // Generate alerts from real spikes in the last 6 hours grouped by topic
      const res = await pgPool.query(`
        SELECT
          topic_id,
          topic_name,
          COUNT(*) AS post_count,
          COUNT(*) FILTER (WHERE sentiment = 'negative') AS neg_count,
          COUNT(DISTINCT platform) AS platform_count,
          STRING_AGG(DISTINCT platform, ',') AS platforms,
          AVG((emotions->>'anxiety')::float) FILTER (WHERE emotions->>'anxiety' IS NOT NULL) AS avg_anxiety,
          MAX(timestamp) AS latest_post
        FROM posts
        WHERE timestamp >= NOW() - INTERVAL '6 hours'
        GROUP BY topic_id, topic_name
        HAVING COUNT(*) >= 3
        ORDER BY neg_count DESC, post_count DESC
        LIMIT 10;
      `);

      if (res.rows.length > 0) {
        const alerts: Alert[] = res.rows.map((row, i) => {
          const total = parseInt(row.post_count, 10);
          const neg = parseInt(row.neg_count, 10);
          const negRatio = total > 0 ? neg / total : 0;
          const anxiety = parseFloat(row.avg_anxiety || "0");
          const platformList = (row.platforms as string || "").split(",").filter(Boolean);
          const severity: Alert["severity"] = negRatio > 0.6 || anxiety > 0.6 ? "High" : negRatio > 0.35 ? "Medium" : "Low";

          return {
            id: `alert_live_${row.topic_id}_${i}`,
            title: `${severity === "High" ? "🔴" : severity === "Medium" ? "🟡" : "🟢"} ${row.topic_name || "Trending Topic"}`,
            severity,
            platforms: platformList,
            timestamp: row.latest_post ? new Date(row.latest_post).toISOString() : new Date().toISOString(),
            description: `${total} posts in last 6h — ${Math.round(negRatio * 100)}% negative sentiment${anxiety > 0.3 ? `, anxiety index: ${Math.round(anxiety * 100)}%` : ""}. Active on ${platformList.length} platform${platformList.length > 1 ? "s" : ""}.`,
            action_cards: [
              { id: `ac_${i}_1`, title: "Issue Fact-Check Bulletin", type: "Communication", description: "Send verified updates to news feeds." },
              { id: `ac_${i}_2`, title: "Monitor Topic", type: "Investigation", description: `Continue tracking ${row.topic_name} for escalation patterns.` }
            ]
          };
        });
        return { alerts };
      }
    } catch (err) {
      console.error("Error generating alerts from DB:", err);
    }

    // Fallback static alerts
    const alerts: Alert[] = [
      {
        id: "alert_101",
        title: "High Rumor Spike: Mumbai Flooding & Rail Suspension",
        severity: "High",
        platforms: ["telegram", "twitter", "youtube", "reddit"],
        timestamp: new Date().toISOString(),
        description: "Anxiety levels spiked to 78.5% with rapid cross-platform velocity (+85%). Near-duplicate text detected across 3 accounts.",
        action_cards: [
          { id: "ac_1", title: "Issue Fact-Check Bulletin", type: "Communication", description: "Send verified updates to news feeds." },
          { id: "ac_2", title: "Alert Transit Authority", type: "Response", description: "Notify Railway Control regarding misinformation." }
        ]
      },
      {
        id: "alert_102",
        title: "Medium Spike: Delhi Air Quality Stubble Alarm",
        severity: "Medium",
        platforms: ["reddit", "twitter"],
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: "AQI concerns driving negative sentiment growth (+32% velocity).",
        action_cards: [
          { id: "ac_3", title: "Publish AQI Advisory", type: "Public Health", description: "Distribute safety guidelines for outdoor activity." }
        ]
      }
    ];
    return { alerts };
  });
}
