import logging
import requests
from typing import List
from datetime import datetime, timezone, timedelta
from connectors.base import BaseConnector, Post, IST
from connectors.status_tracker import status_tracker
from config import settings

logger = logging.getLogger("bsi.twitter")

class TwitterConnector(BaseConnector):
    def __init__(self):
        super().__init__("twitter")
        self.bearer_token = settings.TWITTER_BEARER_TOKEN
        self.keywords = ["#MumbaiRains", "AQI Delhi", "Semiconductor India", "Crypto Governance"]

    def is_configured(self) -> bool:
        return bool(self.bearer_token)

    def fetch(self) -> List[Post]:
        if self.is_configured():
            try:
                headers = {"Authorization": f"Bearer {self.bearer_token}"}
                query = " OR ".join(self.keywords)
                url = "https://api.twitter.com/2/tweets/search/recent"
                params = {
                    "query": query,
                    "max_results": 10,
                    "tweet.fields": "created_at,public_metrics,lang,author_id"
                }
                res = requests.get(url, headers=headers, params=params, timeout=10)
                res.raise_for_status()
                data = res.json()
                posts = []

                for tweet in data.get("data", []):
                    metrics = tweet.get("public_metrics", {})
                    dt_str = tweet.get("created_at")
                    post = Post(
                        platform="twitter",
                        post_id=f"tw_{tweet['id']}",
                        author_id=f"user_{tweet.get('author_id')}",
                        text=tweet.get("text", ""),
                        timestamp=dt_str,
                        likes=metrics.get("like_count", 0),
                        shares=metrics.get("retweet_count", 0),
                        comments_count=metrics.get("reply_count", 0),
                        language=tweet.get("lang", "en"),
                        raw_bio="X / Twitter User Profile",
                        is_demo_sample=False
                    )
                    posts.append(post)

                status_tracker.update_status("twitter", True, "Active (X API v2)", False)
                return posts
            except Exception as e:
                logger.error(f"Twitter X API error: {e}")
                status_tracker.update_status("twitter", True, "Error", False, str(e))
                return self._get_fallback_seed()
        else:
            status_tracker.update_status("twitter", False, "Demo Mode (Sample Seed Data)", True)
            return self._get_fallback_seed()

    def _get_fallback_seed(self) -> List[Post]:
        now = datetime.now(IST)
        return [
            Post(
                platform="twitter",
                post_id="tw_seed_501",
                author_id="citizen_journo_in",
                text="Red alert issued in Mumbai suburban areas! Water levels reaching dangerous levels in Mithi river. #MumbaiRains #Alert #BMC",
                timestamp=(now - timedelta(minutes=10)).isoformat(),
                likes=3200,
                shares=1100,
                comments_count=290,
                language="en",
                raw_bio="Independent Journalist based in Mumbai",
                is_demo_sample=True
            ),
            Post(
                platform="twitter",
                post_id="tw_seed_502",
                author_id="mumbai_news_handle",
                text="Mithi river overflow warning! Mumbai train lines suspended. Evacuation started in low lying areas! #MumbaiRains",
                timestamp=(now - timedelta(minutes=8)).isoformat(),
                likes=2900,
                shares=950,
                comments_count=210,
                language="en",
                raw_bio="Breaking news tracker Mumbai",
                is_demo_sample=True
            ),
            Post(
                platform="twitter",
                post_id="tw_seed_503",
                author_id="bot_account_999",
                text="Mithi river overflow warning! Mumbai train lines suspended. Evacuation started in low lying areas! #MumbaiRains",
                timestamp=(now - timedelta(minutes=7)).isoformat(),
                likes=150,
                shares=400,
                comments_count=5,
                language="en",
                raw_bio="Automated alert aggregator",
                is_demo_sample=True
            ),
            Post(
                platform="twitter",
                post_id="tw_seed_504",
                author_id="delhi_air_watch",
                text="Stubble burning spikes in neighboring states, bringing AQI above 450 in Anand Vihar. #DelhiPollution #AQI",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                likes=1670,
                shares=420,
                comments_count=180,
                language="en",
                raw_bio="Environmental monitoring handle Delhi",
                is_demo_sample=True
            ),
            Post(
                platform="twitter",
                post_id="tw_seed_505",
                author_id="desh_updates_hi",
                text="देश भर में डिजिटल क्रांति का नया अध्याय: रिकॉर्ड ऑनलाइन ट्रांजैक्शन दर्ज। युवा उद्यमियों में भारी उत्साह।",
                timestamp=(now - timedelta(hours=2)).isoformat(),
                likes=2450,
                shares=530,
                comments_count=95,
                language="hi",
                raw_bio="Hindi Tech & Economy Watch",
                is_demo_sample=True
            )
        ]
