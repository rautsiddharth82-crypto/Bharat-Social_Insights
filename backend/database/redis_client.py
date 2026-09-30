import redis
import logging
import json
from config import settings

logger = logging.getLogger("bsi.redis")

class RedisClient:
    def __init__(self):
        self.client = None

    def connect(self):
        try:
            kwargs = {
                "host": settings.REDIS_HOST,
                "port": settings.REDIS_PORT,
                "decode_responses": True
            }
            if getattr(settings, "REDIS_PASSWORD", None):
                kwargs["password"] = settings.REDIS_PASSWORD
            self.client = redis.Redis(**kwargs)
            self.client.ping()
            logger.info("Connected to Redis server")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None

    def push_to_stream(self, stream_name: str, payload: dict):
        if not self.client:
            self.connect()
        if not self.client:
            return None
        try:
            serialized = {k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in payload.items()}
            return self.client.xadd(stream_name, serialized)
        except Exception as e:
            logger.error(f"Error pushing to Redis Stream {stream_name}: {e}")
            return None

    def read_stream(self, stream_name: str, group_name: str, consumer_name: str, count: int = 10):
        if not self.client:
            self.connect()
        if not self.client:
            return []
        try:
            # Ensure consumer group exists
            try:
                self.client.xgroup_create(stream_name, group_name, id='0', mkstream=True)
            except redis.exceptions.ResponseError:
                pass # Group already exists
            
            messages = self.client.xreadgroup(group_name, consumer_name, {stream_name: '>'}, count=count)
            return messages
        except Exception as e:
            logger.error(f"Error reading from Redis Stream {stream_name}: {e}")
            return []

    def set_cache(self, key: str, value: str, ttl: int = 300):
        if not self.client:
            self.connect()
        if self.client:
            try:
                self.client.setex(key, ttl, value)
            except Exception as e:
                logger.error(f"Error setting Redis cache: {e}")

    def get_cache(self, key: str):
        if not self.client:
            self.connect()
        if self.client:
            try:
                return self.client.get(key)
            except Exception as e:
                logger.error(f"Error reading Redis cache: {e}")
        return None

redis_client = RedisClient()
