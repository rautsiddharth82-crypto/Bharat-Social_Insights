import logging
from typing import List
from datetime import datetime, timezone, timedelta
from connectors.base import BaseConnector, Post, IST
from connectors.status_tracker import status_tracker
from config import settings

logger = logging.getLogger("bsi.reddit")

class RedditConnector(BaseConnector):
    def __init__(self):
        super().__init__("reddit")
        self.client_id = settings.REDDIT_CLIENT_ID
        self.client_secret = settings.REDDIT_CLIENT_SECRET
        self.user_agent = settings.REDDIT_USER_AGENT
        self.target_subreddits = ["india", "mumbai", "delhi", "bangalore"]

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def fetch(self) -> List[Post]:
        if self.is_configured():
            try:
                import praw
                reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent
                )
                posts = []
                for sub in self.target_subreddits:
                    subreddit = reddit.subreddit(sub)
                    for submission in subreddit.hot(limit=5):
                        dt = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc).astimezone(IST)
                        post = Post(
                            platform="reddit",
                            post_id=f"rd_{submission.id}",
                            author_id=str(submission.author.name) if submission.author else "deleted",
                            text=f"{submission.title}\n{submission.selftext}",
                            timestamp=dt.isoformat(),
                            likes=submission.score,
                            shares=0,
                            comments_count=submission.num_comments,
                            language="en",
                            raw_bio=f"Reddit poster in r/{sub}",
                            is_demo_sample=False
                        )
                        posts.append(post)

                status_tracker.update_status("reddit", True, "Active (Live PRAW)", False)
                return posts
            except Exception as e:
                logger.error(f"Reddit API fetch error: {e}")
                status_tracker.update_status("reddit", True, "Error", False, str(e))
                return self._get_fallback_seed()
        else:
            status_tracker.update_status("reddit", False, "Demo Mode (Sample Data)", True)
            return self._get_fallback_seed()

    def _get_fallback_seed(self) -> List[Post]:
        now = datetime.now(IST)
        return [
            Post(
                platform="reddit",
                post_id="rd_seed_301",
                author_id="u_delhi_resident",
                text="Air Quality Index in NCR reaches severe category today. Urgent need for emergency stubble burning controls and traffic rationing. #AQI #Delhi",
                timestamp=(now - timedelta(hours=2)).isoformat(),
                likes=890,
                shares=45,
                comments_count=320,
                language="en",
                raw_bio="Resident of New Delhi, environmental activist",
                is_demo_sample=True
            ),
            Post(
                platform="reddit",
                post_id="rd_seed_302",
                author_id="u_mumbai_commuter",
                text="Waterlogging at Hindmata & Milan subway due to relentless rain. Central railway trains running 30 mins late. Avoid unnecessary travel guys.",
                timestamp=(now - timedelta(minutes=30)).isoformat(),
                likes=450,
                shares=20,
                comments_count=110,
                language="hinglish",
                raw_bio="Daily local train commuter from Dadar",
                is_demo_sample=True
            )
        ]
