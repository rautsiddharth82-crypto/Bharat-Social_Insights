import { pgPool } from "../db/timescale.js";

export async function runRetentionPolicyJob(daysThreshold = 30) {
  console.log(`Running scheduled data retention job (Anonymizing post text older than ${daysThreshold} days)...`);
  try {
    const res = await pgPool.query(`
      UPDATE posts
      SET text = '[ANONYMIZED_RETENTION_EXPIRED]'
      WHERE timestamp < NOW() - INTERVAL '${daysThreshold} days' AND text <> '[ANONYMIZED_RETENTION_EXPIRED]';
    `);
    console.log(`Retention policy job completed. Anonymized ${res.rowCount} historical records.`);
  } catch (err) {
    console.error("Error executing data retention job:", err);
  }
}
