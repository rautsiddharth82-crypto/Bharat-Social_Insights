import dotenv from "dotenv";
import path from "path";

// Resolved from the working directory instead of import.meta.url so this script
// also compiles under the package's CommonJS emit.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import neo4j from "neo4j-driver";

async function test() {
  const driver = neo4j.driver(process.env.NEO4J_URI!, neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!));

  try {
    await driver.verifyConnectivity();
    console.log("Neo4j Connected!");
    
    const session = driver.session();
    const result = await session.run("RETURN 1 as test");
    console.log("Query result:", result.records[0].get("test"));
    await session.close();
  } catch (e) {
    console.error("Failed:", (e as Error).message);
  } finally {
    await driver.close();
  }
}

test();