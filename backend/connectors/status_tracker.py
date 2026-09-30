from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from database.postgres import get_sync_db_conn
import logging

logger = logging.getLogger("bsi.status_tracker")
IST = timezone(timedelta(hours=5, minutes=30))

class ConnectorStatusTracker:
    def __init__(self):
        self.statuses: Dict[str, Dict[str, Any]] = {}

    def update_status(self, platform: str, configured: bool, status: str, is_demo: bool, error_message: str = None):
        now_str = datetime.now(IST).isoformat()
        self.statuses[platform] = {
            "platform": platform,
            "configured": configured,
            "status": status,
            "last_fetch": now_str,
            "is_demo": is_demo,
            "error_message": error_message
        }

        # Persist to database
        conn = get_sync_db_conn()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO connector_status (platform, configured, status, last_fetch, is_demo, error_message, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (platform) DO UPDATE SET
                            configured = EXCLUDED.configured,
                            status = EXCLUDED.status,
                            last_fetch = EXCLUDED.last_fetch,
                            is_demo = EXCLUDED.is_demo,
                            error_message = EXCLUDED.error_message,
                            updated_at = NOW();
                    """, (platform, configured, status, now_str, is_demo, error_message))
                conn.commit()
                conn.close()
            except Exception as e:
                logger.error(f"Error persisting connector status for {platform}: {e}")

    def get_all_statuses(self) -> List[Dict[str, Any]]:
        conn = get_sync_db_conn()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT platform, configured, status, last_fetch, is_demo, error_message FROM connector_status ORDER BY platform;")
                    rows = cur.fetchall()
                    conn.close()
                    if rows:
                        return [dict(r) for r in rows]
            except Exception as e:
                logger.error(f"Error fetching connector statuses from DB: {e}")
        
        return list(self.statuses.values())

status_tracker = ConnectorStatusTracker()
