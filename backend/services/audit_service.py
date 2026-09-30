import json
import logging
from database.postgres import get_sync_db_conn

logger = logging.getLogger("bsi.services.audit")

def log_audit_event(user_id: str, endpoint: str, query_params: dict):
    conn = get_sync_db_conn()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO audit_logs (user_id, endpoint, query_params, timestamp) VALUES (%s, %s, %s, NOW());",
                    (user_id or "analyst_guest", endpoint, json.dumps(query_params or {}))
                )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error writing audit log row: {e}")

def fetch_audit_logs(limit: int = 50):
    conn = get_sync_db_conn()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, user_id, endpoint, query_params, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT %s;", (limit,))
                rows = cur.fetchall()
                conn.close()
                return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error fetching audit logs: {e}")
    return []
