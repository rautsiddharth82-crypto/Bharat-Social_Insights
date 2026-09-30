import hashlib
import json
import logging
from datetime import datetime
from database.postgres import get_sync_db_conn
from database.neo4j_client import neo4j_client
from preprocessing.lang_detect import detect_language
from preprocessing.text_cleaner import clean_text
from preprocessing.gazetteer import extract_demographics
from preprocessing.bot_detector import check_bot_coordination
from ml.sentiment_emotion import analyze_sentiment_and_emotions
from ml.stance_detector import detect_stance
from ml.topic_modeling import assign_topic

logger = logging.getLogger("bsi.ingestion.consumer")

def process_and_store_post(post_dict: dict):
    try:
        raw_text = post_dict.get("text", "")
        author_id = post_dict.get("author_id", "anonymous")
        platform = post_dict.get("platform", "unknown")
        post_id = post_dict.get("post_id", "0")

        post_key = f"{platform}_{post_id}"
        author_hashed = hashlib.sha256(author_id.encode('utf-8')).hexdigest()[:16]

        # 1. Preprocessing
        cleaned_text = clean_text(raw_text)
        language = detect_language(cleaned_text)
        demographics = extract_demographics(post_dict.get("raw_bio", ""), cleaned_text)
        
        timestamp_dt = datetime.fromisoformat(post_dict.get("timestamp"))
        bot_info = check_bot_coordination(cleaned_text, author_id, timestamp_dt.timestamp())

        # 2. AI Inference
        sentiment_info = analyze_sentiment_and_emotions(cleaned_text)
        topic_id, topic_name, keywords = assign_topic(cleaned_text)
        stance = detect_stance(cleaned_text, topic_name)

        # 3. TimescaleDB Insertion
        conn = get_sync_db_conn()
        if conn:
            with conn.cursor() as cur:
                # Deduplication check: if canonical post exists, increment forward_count
                cur.execute("SELECT post_key, forward_count FROM posts WHERE text = %s LIMIT 1;", (cleaned_text,))
                existing = cur.fetchone()
                if existing and len(cleaned_text) > 20:
                    canonical_id = existing["post_key"]
                    cur.execute("UPDATE posts SET forward_count = forward_count + 1 WHERE post_key = %s;", (canonical_id,))
                else:
                    canonical_id = post_key
                    cur.execute("""
                        INSERT INTO posts (
                            post_key, platform, post_id, author_id, author_hashed, text, timestamp,
                            likes, shares, comments_count, language, forward_count, canonical_post_id,
                            is_suspected_bot, coordination_cluster_id, region, profession, interests,
                            sentiment, sentiment_score, emotions, stance, topic_id, topic_name, is_demo_sample
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) ON CONFLICT (post_key, timestamp) DO NOTHING;
                    """, (
                        post_key, platform, post_id, author_id, author_hashed, cleaned_text, timestamp_dt,
                        post_dict.get("likes", 0), post_dict.get("shares", 0), post_dict.get("comments_count", 0),
                        language, 1, canonical_id, bot_info["is_suspected_bot"], bot_info["coordination_cluster_id"],
                        demographics["region"], demographics["profession"], demographics["interests"],
                        sentiment_info["sentiment"], sentiment_info["sentiment_score"], json.dumps(sentiment_info["emotions"]),
                        stance, topic_id, topic_name, post_dict.get("is_demo_sample", False)
                    ))
            conn.commit()
            conn.close()

        # 4. Neo4j Graph Insertion
        neo4j_data = {
            "author_id": author_id,
            "author_hashed": author_hashed,
            "region": demographics["region"],
            "post_key": post_key,
            "platform": platform,
            "text": cleaned_text[:100],
            "timestamp": post_dict.get("timestamp"),
            "sentiment": sentiment_info["sentiment"],
            "stance": stance,
            "topic_id": topic_id,
            "topic_name": topic_name,
            "canonical_post_id": canonical_id
        }
        neo4j_client.create_post_nodes_and_edges(neo4j_data)

    except Exception as e:
        logger.error(f"Error processing post {post_dict.get('post_id')}: {e}")
