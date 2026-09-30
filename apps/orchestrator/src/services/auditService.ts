import { pgPool } from "../db/timescale.js";

export async function logAuditEvent(userId: string, endpoint: string, queryParams: any) {
  try {
    await pgPool.query(
      "INSERT INTO audit_logs (user_id, endpoint, query_params, timestamp) VALUES ($1, $2, $3, NOW());",
      [userId || "analyst_guest", endpoint, JSON.stringify(queryParams || {})]
    );
  } catch (err) {
    console.error("Error logging audit event:", err);
  }
}

export async function fetchAuditLogs(limit = 50) {
  try {
    const res = await pgPool.query("SELECT id, user_id, endpoint, query_params, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT $1;", [limit]);
    return res.rows;
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return [];
  }
}
