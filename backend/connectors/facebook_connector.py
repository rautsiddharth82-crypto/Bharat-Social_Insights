import logging
import requests
from typing import List
from datetime import datetime, timezone, timedelta
from connectors.base import BaseConnector, Post, IST
from connectors.status_tracker import status_tracker
from config import settings

logger = logging.getLogger("bsi.facebook")

class FacebookConnector(BaseConnector):
    def __init__(self):
        super().__init__("facebook")
        self.access_token = settings.META_ACCESS_TOKEN
        self.page_id = settings.META_PAGE_ID

    def is_configured(self) -> bool:
        return bool(self.access_token and self.page_id)

    def fetch(self) -> List[Post]:
        if self.is_configured():
            try:
                url = f"https://graph.facebook.com/v19.0/{self.page_id}/posts"
                params = {
                    "access_token": self.access_token,
                    "fields": "id,message,created_time,shares,reactions.summary(true),comments.summary(true)",
                    "limit": 10
                }
                res = requests.get(url, params=params, timeout=10)
                res.raise_for_status()
                data = res.json()
                posts = []

                for item in data.get("data", []):
                    post_id = item.get("id", "")
                    message = item.get("message", "")
                    created_time = item.get("created_time", "")
                    shares_count = item.get("shares", {}).get("count", 0)
                    likes_count = item.get("reactions", {}).get("summary", {}).get("total_count", 0)
                    comments_count = item.get("comments", {}).get("summary", {}).get("total_count", 0)

                    posts.append(Post(
                        platform="facebook",
                        post_id=f"fb_{post_id}",
                        author_id=self.page_id,
                        text=message,
                        timestamp=created_time,
                        likes=likes_count,
                        shares=shares_count,
                        comments_count=comments_count,
                        language="en",
                        raw_bio="Official Managed Meta Page",
                        is_demo_sample=False
                    ))

                status_tracker.update_status("facebook", True, "Active (Meta Graph API)", False)
                return posts
            except Exception as e:
                logger.error(f"Facebook Meta Graph API error: {e}")
                status_tracker.update_status("facebook", True, "Error", False, str(e))
                return self._get_fallback_seed()
        else:
            status_tracker.update_status("facebook", False, "Demo Mode (Sample Data)", True)
            return self._get_fallback_seed()

    def _get_fallback_seed(self) -> List[Post]:
        now = datetime.now(IST)
        return [
            Post(
                platform="facebook",
                post_id="fb_seed_401",
                author_id="page_disaster_alert_in",
                text="NDRF teams deployed across coastal Konkan and Mumbai region due to continuous torrential downpour. Toll-free emergency helpline active: 1070.",
                timestamp=(now - timedelta(minutes=25)).isoformat(),
                likes=2100,
                shares=680,
                comments_count=140,
                language="en",
                raw_bio="Disaster Management Response Page",
                is_demo_sample=True
            ),
            Post(
                platform="facebook",
                post_id="fb_seed_402",
                author_id="page_digital_india",
                text="Digital India initiative reaches 1 Billion transactions milestone this month! Transforming rural banking and digital inclusion.",
                timestamp=(now - timedelta(hours=3)).isoformat(),
                likes=5400,
                shares=1200,
                comments_count=450,
                language="en",
                raw_bio="Public Governance & Tech updates",
                is_demo_sample=True
            )
        ]
