import logging
from typing import List
from datetime import datetime, timezone, timedelta
from connectors.base import BaseConnector, Post, IST
from connectors.status_tracker import status_tracker
from config import settings

logger = logging.getLogger("bsi.youtube")

class YouTubeConnector(BaseConnector):
    def __init__(self):
        super().__init__("youtube")
        self.api_key = settings.YOUTUBE_API_KEY
        self.target_video_ids = ["dQw4w9WgXcQ", "3JZ_D3ELwOQ"]
        self.daily_quota_used = 0
        self.max_daily_quota = 10000

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def fetch(self) -> List[Post]:
        if self.is_configured():
            if self.daily_quota_used >= self.max_daily_quota:
                logger.warning("YouTube Data API quota limit reached for today. Backing off.")
                status_tracker.update_status("youtube", True, "Quota Exceeded (Backed Off)", False)
                return self._get_fallback_seed()

            try:
                from googleapiclient.discovery import build
                youtube = build('youtube', 'v3', developerKey=self.api_key)
                posts = []
                for video_id in self.target_video_ids:
                    response = youtube.commentThreads().list(
                        part='snippet',
                        videoId=video_id,
                        maxResults=10,
                        textFormat='plainText'
                    ).execute()
                    self.daily_quota_used += 1  # 1 unit for commentThreads list

                    for item in response.get('items', []):
                        snippet = item['snippet']['topLevelComment']['snippet']
                        post = Post(
                            platform="youtube",
                            post_id=f"yt_{item['id']}",
                            author_id=snippet.get('authorDisplayName', 'yt_user'),
                            text=snippet.get('textDisplay', ''),
                            timestamp=snippet.get('publishedAt'),
                            likes=snippet.get('likeCount', 0),
                            shares=0,
                            comments_count=item['snippet'].get('totalReplyCount', 0),
                            language="en",
                            raw_bio="YouTube Commenter",
                            is_demo_sample=False
                        )
                        posts.append(post)

                status_tracker.update_status("youtube", True, f"Active (Quota used: {self.daily_quota_used}/10000)", False)
                return posts
            except Exception as e:
                logger.error(f"YouTube Data API error: {e}")
                status_tracker.update_status("youtube", True, "Error", False, str(e))
                return self._get_fallback_seed()
        else:
            status_tracker.update_status("youtube", False, "Demo Mode (Sample Data)", True)
            return self._get_fallback_seed()

    def _get_fallback_seed(self) -> List[Post]:
        now = datetime.now(IST)
        return [
            Post(
                platform="youtube",
                post_id="yt_seed_201",
                author_id="tech_reviewer_in",
                text="The new semiconductor fab in Gujarat is a game changer for Indian electronics manufacturing sector! Great initiative.",
                timestamp=(now - timedelta(minutes=45)).isoformat(),
                likes=3400,
                shares=0,
                comments_count=210,
                language="en",
                raw_bio="Tech enthusiast & reviewer from Bengaluru",
                is_demo_sample=True
            ),
            Post(
                platform="youtube",
                post_id="yt_seed_202",
                author_id="mumbai_vlogger",
                text="Mumbai Rains flooding live coverage update! Suburban rail traffic is completely stalled near Kurla station.",
                timestamp=(now - timedelta(minutes=20)).isoformat(),
                likes=1250,
                shares=0,
                comments_count=180,
                language="hinglish",
                raw_bio="Mumbai daily updates & vlog",
                is_demo_sample=True
            )
        ]
