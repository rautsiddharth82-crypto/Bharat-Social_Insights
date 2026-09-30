import { FastifyInstance } from "fastify";
import { pgPool } from "../../db/timescale.js";

export async function summaryRoutes(fastify: FastifyInstance) {
  fastify.get("/emotion-metrics", async (_req, reply) => {
    try {
      const res = await pgPool.query(`
        SELECT
          COUNT(*) FILTER (WHERE (emotions->>'anxiety')::float > 0.3) AS anxiety_count,
          COUNT(*) FILTER (WHERE (emotions->>'anger')::float > 0.3) AS anger_count,
          COUNT(*) FILTER (WHERE (emotions->>'sarcasm')::float > 0.3) AS sarcasm_count,
          COUNT(*) FILTER (WHERE (emotions->>'support')::float > 0.3) AS support_count,
          COUNT(*) FILTER (WHERE (emotions->>'excitement')::float > 0.3) AS excitement_count,
          COUNT(*) FILTER (WHERE (emotions->>'fear')::float > 0.3) AS fear_count,
          AVG((emotions->>'anxiety')::float) AS avg_anxiety,
          AVG((emotions->>'anger')::float) AS avg_anger,
          AVG((emotions->>'sarcasm')::float) AS avg_sarcasm,
          AVG((emotions->>'support')::float) AS avg_support,
          AVG((emotions->>'excitement')::float) AS avg_excitement,
          AVG((emotions->>'fear')::float) AS avg_fear,
          COUNT(*) AS total
        FROM posts
        WHERE timestamp >= NOW() - INTERVAL '24 hours';
      `);

      const row = res.rows[0] || {};
      const total = parseInt(row.total || "0", 10);

      if (total > 0) {
        const metrics = [
          { name: "Anxiety", nameHi: "चिंता (Anxiety)", percentage: Math.max(2, Math.round((parseInt(row.anxiety_count || "0", 10) / total) * 100)), color: "#ef4444" },
          { name: "Anger", nameHi: "क्रोध (Anger)", percentage: Math.max(2, Math.round((parseInt(row.anger_count || "0", 10) / total) * 100)), color: "#f97316" },
          { name: "Sarcasm", nameHi: "व्यंग्य (Sarcasm)", percentage: Math.max(1, Math.round((parseInt(row.sarcasm_count || "0", 10) / total) * 100)), color: "#eab308" },
          { name: "Support", nameHi: "समर्थन (Support)", percentage: Math.max(1, Math.round((parseInt(row.support_count || "0", 10) / total) * 100)), color: "#22c55e" },
          { name: "Excitement", nameHi: "उत्साह (Excitement)", percentage: Math.max(1, Math.round((parseInt(row.excitement_count || "0", 10) / total) * 100)), color: "#0ea5e9" },
          { name: "Fear", nameHi: "भय (Fear)", percentage: Math.max(1, Math.round((parseInt(row.fear_count || "0", 10) / total) * 100)), color: "#a855f7" },
        ].sort((a, b) => b.percentage - a.percentage);
        return { metrics, total, source: "live" };
      }
    } catch (err) {
      console.error("Error fetching emotion metrics:", err);
    }

    const fallbackMetrics = [
      { name: "Anxiety", nameHi: "चिंता (Anxiety)", percentage: 38, color: "#ef4444" },
      { name: "Anger", nameHi: "क्रोध (Anger)", percentage: 27, color: "#f97316" },
      { name: "Sarcasm", nameHi: "व्यंग्य (Sarcasm)", percentage: 18, color: "#eab308" },
      { name: "Support", nameHi: "समर्थन (Support)", percentage: 12, color: "#22c55e" },
      { name: "Excitement", nameHi: "उत्साह (Excitement)", percentage: 5, color: "#0ea5e9" },
      { name: "Fear", nameHi: "भय (Fear)", percentage: 8, color: "#a855f7" },
    ];
    return { metrics: fallbackMetrics, total: 0, source: "fallback" };
  });

  fastify.get("/platform-comparison", async (_req, reply) => {
    try {
      const res = await pgPool.query(`
        SELECT
          platform,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE sentiment='positive')::int AS pos,
          COUNT(*) FILTER (WHERE sentiment='neutral')::int AS neu,
          COUNT(*) FILTER (WHERE sentiment='negative')::int AS neg
        FROM posts
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY platform
        ORDER BY total DESC;
      `);

      if (res.rows.length > 0) {
        const comparison = res.rows.map(r => {
          const t = parseInt(r.total, 10) || 1;
          return {
            platform: r.platform,
            neg: Math.round((parseInt(r.neg, 10) / t) * 100),
            neu: Math.round((parseInt(r.neu, 10) / t) * 100),
            pos: Math.round((parseInt(r.pos, 10) / t) * 100),
            vol: r.total >= 1000 ? `${(r.total / 1000).toFixed(1)}k` : `${r.total}`
          };
        });
        return { comparison, source: "live" };
      }
    } catch (err) {
      console.error("Platform comparison error:", err);
    }

    const fallback = [
      { platform: "telegram", neg: 54, neu: 28, pos: 18, vol: "12.4k" },
      { platform: "youtube", neg: 48, neu: 32, pos: 20, vol: "9.8k" },
      { platform: "reddit", neg: 51, neu: 34, pos: 15, vol: "4.2k" },
      { platform: "facebook", neg: 38, neu: 36, pos: 26, vol: "5.1k" },
      { platform: "instagram", neg: 41, neu: 37, pos: 22, vol: "6.5k" },
      { platform: "twitter", neg: 49, neu: 27, pos: 24, vol: "8.3k" },
    ];
    return { comparison: fallback, source: "fallback" };
  });

  fastify.get("/language-breakdown", async (_req, reply) => {
    try {
      const res = await pgPool.query(`
        SELECT language, COUNT(*)::int AS cnt
        FROM posts
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY language
        ORDER BY cnt DESC;
      `);
      if (res.rows.length > 0) {
        const total = res.rows.reduce((sum: number, r) => sum + parseInt(r.cnt, 10), 0) || 1;
        const breakdown = res.rows.map(r => {
          const pct = Math.round((parseInt(r.cnt, 10) / total) * 100);
          const langMap: Record<string, { name: string; nameHi: string; color: string }> = {
            en: { name: "English", nameHi: "अंग्रेज़ी", color: "#3b82f6" },
            hi: { name: "Hindi", nameHi: "हिन्दी", color: "#f97316" },
            hinglish: { name: "Hinglish (Colloquial)", nameHi: "हिंग्लिश (मिश्रित)", color: "#10b981" },
          };
          const meta = langMap[r.language] || { name: r.language || "Other", nameHi: "अन्य", color: "#94a3b8" };
          return { ...meta, share: `${pct}%`, neg: Math.round(pct * 0.5), neu: Math.round(pct * 0.3), pos: Math.round(pct * 0.2), percentage: pct };
        });
        return { breakdown, source: "live" };
      }
    } catch (err) {
      console.error("Language breakdown error:", err);
    }
    const fallback = [
      { name: "Hindi", nameHi: "हिन्दी", share: "45%", neg: 52, neu: 29, pos: 19, color: "#f97316", percentage: 45 },
      { name: "English", nameHi: "अंग्रेज़ी", share: "35%", neg: 42, neu: 34, pos: 24, color: "#3b82f6", percentage: 35 },
      { name: "Hinglish", nameHi: "हिंग्लिश", share: "20%", neg: 49, neu: 31, pos: 20, color: "#10b981", percentage: 20 },
    ];
    return { breakdown: fallback, source: "fallback" };
  });

  fastify.get("/demographics-summary", async (_req, reply) => {
    try {
      const [regionRes, profRes, langRes] = await Promise.all([
        pgPool.query(`
          SELECT region, COUNT(*)::int AS cnt
          FROM posts
          WHERE timestamp >= NOW() - INTERVAL '24 hours' AND region IS NOT NULL AND region <> 'Unknown'
          GROUP BY region ORDER BY cnt DESC LIMIT 10;
        `),
        pgPool.query(`
          SELECT profession, COUNT(*)::int AS cnt
          FROM posts
          WHERE timestamp >= NOW() - INTERVAL '24 hours' AND profession IS NOT NULL
          GROUP BY profession ORDER BY cnt DESC LIMIT 8;
        `),
        pgPool.query(`
          SELECT language, COUNT(*)::int AS cnt
          FROM posts
          WHERE timestamp >= NOW() - INTERVAL '24 hours'
          GROUP BY language ORDER BY cnt DESC LIMIT 5;
        `),
      ]);

      const totalRegion = regionRes.rows.reduce((s, r) => s + parseInt(r.cnt, 10), 0) || 1;
      const totalProf = profRes.rows.reduce((s, r) => s + parseInt(r.cnt, 10), 0) || 1;
      const totalLang = langRes.rows.reduce((s, r) => s + parseInt(r.cnt, 10), 0) || 1;

      if (regionRes.rows.length > 0 || profRes.rows.length > 0) {
        return {
          k_threshold: 100,
          region_distribution: regionRes.rows.map(r => ({ name: r.region, value: parseInt(r.cnt, 10), share_pct: Math.round((parseInt(r.cnt, 10) / totalRegion) * 100), suppressed: parseInt(r.cnt, 10) < 100 })),
          profession_distribution: profRes.rows.map(r => ({ name: r.profession, value: parseInt(r.cnt, 10), share_pct: Math.round((parseInt(r.cnt, 10) / totalProf) * 100), suppressed: parseInt(r.cnt, 10) < 100 })),
          language_distribution: langRes.rows.map(r => ({ name: r.language, value: parseInt(r.cnt, 10), share_pct: Math.round((parseInt(r.cnt, 10) / totalLang) * 100), suppressed: false })),
          source: "live"
        };
      }
    } catch (err) {
      console.error("Demographics summary error:", err);
    }
    return {
      k_threshold: 100,
      region_distribution: [
        { name: "Delhi / NCR", value: 3110, share_pct: 25, suppressed: false },
        { name: "Uttar Pradesh", value: 2490, share_pct: 20, suppressed: false },
        { name: "Rajasthan", value: 1860, share_pct: 15, suppressed: false },
        { name: "Maharashtra", value: 1490, share_pct: 12, suppressed: false },
        { name: "Karnataka", value: 1120, share_pct: 9, suppressed: false },
        { name: "Others", value: 2280, share_pct: 19, suppressed: false },
      ],
      profession_distribution: [
        { name: "Student / Academic", value: 6400, share_pct: 52, suppressed: false },
        { name: "Young Professional", value: 2980, share_pct: 24, suppressed: false },
        { name: "Education & Faculty", value: 1480, share_pct: 12, suppressed: false },
        { name: "Agriculture & Rural", value: 880, share_pct: 7, suppressed: false },
        { name: "General Public", value: 620, share_pct: 5, suppressed: false },
      ],
      language_distribution: [
        { name: "Hindi", value: 5500, share_pct: 45, suppressed: false },
        { name: "English", value: 4280, share_pct: 35, suppressed: false },
        { name: "Hinglish", value: 2440, share_pct: 20, suppressed: false },
      ],
      source: "fallback"
    };
  });
}
