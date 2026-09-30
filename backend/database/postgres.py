import asyncpg
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from config import settings

logger = logging.getLogger("bsi.postgres")

async def get_async_pool():
    try:
        kwargs = {
            "user": settings.POSTGRES_USER,
            "password": settings.POSTGRES_PASSWORD,
            "database": settings.POSTGRES_DB,
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "min_size": 2,
            "max_size": 10
        }
        if settings.POSTGRES_SSL:
            kwargs["ssl"] = "require"
        pool = await asyncpg.create_pool(**kwargs)
        return pool
    except Exception as e:
        logger.error(f"Failed to create asyncpg pool: {e}")
        return None

def get_sync_db_conn():
    try:
        kwargs = {
            "dbname": settings.POSTGRES_DB,
            "user": settings.POSTGRES_USER,
            "password": settings.POSTGRES_PASSWORD,
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "cursor_factory": RealDictCursor
        }
        if settings.POSTGRES_SSL:
            kwargs["sslmode"] = "require"
        conn = psycopg2.connect(**kwargs)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to Postgres sync: {e}")
        return None
