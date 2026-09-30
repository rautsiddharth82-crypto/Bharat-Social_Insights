import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

export const pgPool = new Pool({
  user: config.postgres.user,
  password: config.postgres.password,
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  max: 10,
  ssl: config.postgres.ssl
});

export async function initPostgres() {
  try {
    const client = await pgPool.connect();
    await client.query("SELECT 1;");
    client.release();
    console.log("Connected to PostgreSQL / TimescaleDB pool successfully.");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
  }
}
