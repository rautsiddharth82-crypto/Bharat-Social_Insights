from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta

# IST timezone helper
IST = timezone(timedelta(hours=5, minutes=30))

@dataclass
class Post:
    platform: str
    post_id: str
    author_id: str
    text: str
    timestamp: str  # ISO string in IST
    likes: int = 0
    shares: int = 0
    comments_count: int = 0
    language: str = "en"
    raw_bio: str = ""
    is_demo_sample: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class BaseConnector(ABC):
    def __init__(self, platform_name: str):
        self.platform_name = platform_name

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if live API credentials are valid and present."""
        pass

    @abstractmethod
    def fetch(self) -> List[Post]:
        """Fetches posts from live API if configured, otherwise returns seed sample posts."""
        pass
