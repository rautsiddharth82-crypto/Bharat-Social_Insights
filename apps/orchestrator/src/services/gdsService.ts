import { runCypher } from "../db/neo4j.js";

// GDS 2.x removed `gds.graph.project.cypher` (it now raises
// "There is no procedure with the name gds.graph.project.cypher registered").
// The projection is therefore declared with the native node/relationship syntax,
// and if GDS is not installed on this instance at all we fall back to a pure-Cypher
// degree/ pagerank approximation so the UI always has real numbers to draw.
const GRAPH_NAME = "socialGraph";

async function dropExistingGraph() {
  // Dropping first is idempotent: a stale projection from a previous run would
  // otherwise make gds.graph.project fail with "graph already exists".
  await runCypher(`CALL gds.graph.drop('${GRAPH_NAME}', false) YIELD graphName`).catch(() => undefined);
}

export async function runGDSAnalytics() {
  console.log("Executing Neo4j influence analytics (PageRank + degree fallback)...");
  try {
    await dropExistingGraph();

    let algorithm: "gds-pageRank" | "cypher-degree" = "gds-pageRank";
    let ranked: any[] = [];

    // Try the GDS native projection first.
    try {
      await runCypher(`
        CALL gds.graph.project(
          '${GRAPH_NAME}',
          { User: { orientation: 'NATIVE' } },
          { INTERACTED: {
              type: 'RELATIONSHIP',
              orientation: 'UNDIRECTED',
              hops: 1,
              query: 'MATCH (u1:User)-[:POSTED]->(p:Post)<-[:POSTED]-(u2:User)
                      WHERE u1 <> u2
                      RETURN DISTINCT id(u1) AS source, id(u2) AS target'
            } }
        ) YIELD graphName, nodeCount, relationshipCount
      `);

      const pageRankQuery = `
        CALL gds.pageRank.stream('${GRAPH_NAME}')
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId).id AS author_id,
               gds.util.asNode(nodeId).hashed_id AS author_hashed,
               score
        ORDER BY score DESC LIMIT 100
      `;
      ranked = await runCypher(pageRankQuery);
      await runCypher(`CALL gds.graph.drop('${GRAPH_NAME}', false) YIELD graphName`);
      if (!ranked.length) algorithm = "cypher-degree";
    } catch (gdsErr) {
      // GDS unavailable (e.g. AuraDS without the module or a plain Neo4j image).
      console.warn(`GDS projection unavailable, using pure-Cypher influence fallback: ${(gdsErr as Error).message}`);
      algorithm = "cypher-degree";
    }

    if (algorithm === "cypher-degree") {
      // Shared-post degree is a defensible influence proxy and needs no plugin:
      // an account that co-authors many narratives with many others ranks higher.
      ranked = await runCypher(`
        MATCH (u:User)-[:POSTED]->(p:Post)<-[:POSTED]-(other:User)
        WHERE u <> other
        RETURN u.id AS author_id,
               u.hashed_id AS author_hashed,
               COUNT(DISTINCT other.id) AS neighbours,
               COUNT(DISTINCT p.id) AS shared_posts
        ORDER BY neighbours DESC, shared_posts DESC
        LIMIT 100
      `);
      // Normalise degree into a PageRank-like 0..1 score so downstream consumers
      // (network.ts, the UI) do not have to care which algorithm produced it.
      const max = Math.max(1, ...ranked.map((r: any) => Number(r.neighbours?.low ?? r.neighbours ?? 1)));
      ranked = ranked.map((r: any) => ({
        ...r,
        score: Number(r.neighbours?.low ?? r.neighbours ?? 0) / max
      }));
    }

    // Persist the score back onto the User node so /network/graph can read it
    // without recomputing analytics on every request.
    for (const row of ranked.slice(0, 100)) {
      if (!row.author_id) continue;
      await runCypher(
        `MATCH (u:User {id: $id}) SET u.influence_score = $score, u.influence_method = $method`,
        { id: row.author_id, score: Number(row.score ?? 0), method: algorithm }
      );
    }

    console.log(`Influence analytics completed for ${ranked.length} accounts (${algorithm}).`);
    return { ranked: ranked.length, algorithm };
  } catch (err) {
    console.warn("GDS execution warning (graph analytics skipped):", err);
    return { ranked: 0, algorithm: "none" };
  }
}

export async function getCascadeTrace(topicId: string) {
  // Real cascade: follow forward/reply edges out from the earliest posts of a topic
  // and report the chronological spread with the platform that carried each hop.
  const query = `
    MATCH (root:Post)
    WHERE root.topic_id = $topicId
    WITH root ORDER BY root.timestamp ASC LIMIT 20
    OPTIONAL MATCH (p:Post)-[r:FORWARDED_FROM|REPLIED_TO|MENTIONS*0..3]->(root)
    WITH root, p, r
    WHERE p IS NOT NULL
    RETURN p.id AS post_id, p.platform AS platform, p.timestamp AS timestamp,
           p.sentiment AS sentiment, p.author_id AS author_id,
           root.id AS root_id, type(r) AS edge_type
    ORDER BY p.timestamp ASC
    LIMIT 50
  `;
  const records = await runCypher(query, { topicId });
  if (records.length > 0) return records;

  // No graph edges yet — derive the cascade honestly from the Post nodes alone,
  // ordered by time, so the UI shows real captured data rather than invented rows.
  const byTopic = await runCypher(
    `MATCH (p:Post {topic_id: $topicId})
     RETURN p.id AS post_id, p.platform AS platform, p.timestamp AS timestamp,
            p.sentiment AS sentiment, p.author_id AS author_id
     ORDER BY p.timestamp ASC LIMIT 50`,
    { topicId }
  );
  if (byTopic.length > 0) {
    return byTopic.map((row: any, index: number) => ({
      ...row,
      step: index + 1,
      event: index === 0 ? "First captured instance" : "Cross-platform appearance",
      root_id: byTopic[0]?.post_id
    }));
  }

  // Nothing in the graph for this topic at all — say so explicitly instead of
  // silently returning fabricated telemetry.
  return { empty: true, topic_id: topicId, message: "No graph edges captured for this topic yet." };
}
