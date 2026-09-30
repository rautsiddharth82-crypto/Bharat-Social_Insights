import neo4j, { Driver } from "neo4j-driver";
import { config } from "../config.js";

export let neo4jDriver: Driver;

export function initNeo4j() {
  try {
    neo4jDriver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );
    console.log("Connected to Neo4j driver successfully.");
  } catch (err) {
    console.error("Neo4j driver error:", err);
  }
}

export async function runCypher(query: string, params: Record<string, any> = {}) {
  if (!neo4jDriver) initNeo4j();
  const session = neo4jDriver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.toObject());
  } catch (err) {
    console.error("Cypher execution error:", err);
    return [];
  } finally {
    await session.close();
  }
}
