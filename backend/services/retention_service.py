import logging
from database.postgres import get_sync_db_conn

logger = logging.getLogger("bsi.services.retention")

def run_retention_policy_job(days_threshold: int = 30):
    """
    Deletes raw post text older than configurable retention window (default 30 days)
    while preserving row metrics, metadata, and aggregate counts.
    """
    logger.info(f"Running data retention policy job (Anonymizing post text older than {days_threshold} days)...")
    conn = get_sync_db_conn()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE posts
                    SET text = '[ANONYMIZED_RETENTION_EXPIRED]', raw_bio = ''
                    WHERE timestamp < NOW() - INTERVAL '%s days' AND text <> '[ANONYMIZED_RETENTION_EXPIRED]';
                """, (days_threshold,))
                affected = cur.rowcount
            conn.commit()
            conn.close()
            logger.info(f"Retention policy job completed. Anonymized {affected} historical post text records.")
        except Exception as e:
            logger.error(f"Error executing retention policy job: {e}")
