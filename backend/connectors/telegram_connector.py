import asyncio
import logging
from typing import List
from datetime import datetime, timezone, timedelta
from connectors.base import BaseConnector, Post, IST
from connectors.status_tracker import status_tracker
from config import settings

logger = logging.getLogger("bsi.telegram")

class TelegramConnector(BaseConnector):
    def __init__(self):
        super().__init__("telegram")
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.target_channels = ["@india_news_flash", "@bharat_updates", "@tech_india_now"]

    def is_configured(self) -> bool:
        return bool(self.api_id and self.api_hash)

    def fetch(self) -> List[Post]:
        if self.is_configured():
            try:
                # Real Telethon client execution logic
                from telethon.sync import TelegramClient
                posts = []
                with TelegramClient('bsi_session', int(self.api_id), self.api_hash) as client:
                    for channel in self.target_channels:
                        try:
                            messages = client.get_messages(channel, limit=10)
                            for msg in messages:
                                if msg.text:
                                    post = Post(
                                        platform="telegram",
                                        post_id=f"tg_{msg.id}",
                                        author_id=channel,
                                        text=msg.text,
                                        timestamp=msg.date.astimezone(IST).isoformat(),
                                        likes=getattr(msg, 'views', 120),
                                        shares=getattr(msg, 'forwards', 15),
                                        comments_count=0,
                                        language="en",
                                        raw_bio=f"Public Telegram channel {channel}",
                                        is_demo_sample=False
                                    )
                                    posts.append(post)
                        except Exception as ce:
                            logger.warning(f"Telegram error fetching channel {channel}: {ce}")

                status_tracker.update_status("telegram", True, "Active (Live Telethon)", False)
                return posts
            except Exception as e:
                logger.error(f"Telegram live fetch error: {e}")
                status_tracker.update_status("telegram", True, "Error", False, str(e))
                return self._get_fallback_seed()
        else:
            status_tracker.update_status("telegram", False, "Demo Mode (Sample Data)", True)
            return self._get_fallback_seed()

    def _get_fallback_seed(self) -> List[Post]:
        now = datetime.now(IST)
        return [
            Post(
                platform="telegram",
                post_id="tg_seed_101",
                author_id="channel_defence_india",
                text="BREAKING: Heavy rainfall causes severe flooding alert in Mumbai suburban train lines. Central line delayed. stay safe! #MumbaiRains #Alert",
                timestamp=(now - timedelta(minutes=15)).isoformat(),
                likes=1450,
                shares=320,
                comments_count=85,
                language="en",
                raw_bio="Defence & Emergency updates India channel",
                is_demo_sample=True
            ),
            Post(
                platform="telegram",
                post_id="tg_seed_102",
                author_id="channel_mumbai_alert",
                text="मुंबई में भारी बारिश की चेतावनी! दादर और कुर्ला में जलभराव की स्थिति बनी हुई है। प्रशासन मुस्तैद। #MumbaiRains",
                timestamp=(now - timedelta(minutes=10)).isoformat(),
                likes=980,
                shares=210,
                comments_count=42,
                language="hi",
                raw_bio="Local Mumbai Emergency Broadcast",
                is_demo_sample=True
            ),
            Post(
                platform="telegram",
                post_id="tg_seed_103",
                author_id="channel_crypto_bharat",
                text="Govt introducing new digital currency regulations in upcoming parliament session. Traders stay alert! #CryptoIndia",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                likes=540,
                shares=88,
                comments_count=30,
                language="en",
                raw_bio="Crypto and Fintech India",
                is_demo_sample=True
            )
        ]
