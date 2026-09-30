import { Queue, Worker } from "bullmq";
import { config } from "../config.js";
import { Post } from "@bsi/types";
import { cleanText } from "../preprocessing/cleaner.js";
import { detectLanguage } from "../preprocessing/langDetect.js";
import { extractDemographics } from "../preprocessing/gazetteer.js";
import { checkBotCoordination } from "../preprocessing/botDetector.js";
import { mlClient } from "../ml-client/mlClient.js";
import { pgPool } from "../db/timescale.js";
import { runCypher } from "../db/neo4j.js";
import crypto from "crypto";

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  username: config.redis.username
};

export const ingestionQueue = new Queue<Post>("post-ingestion", { connection });

export function startIngestionWorker() {
  const worker = new Worker<Post>("post-ingestion", async job => {
    const post = job.data;
    try {
      const cleaned = cleanText(post.text);
      const lang = detectLanguage(cleaned);
      const demo = extractDemographics(post.raw_bio || "", cleaned);
      const timestampSec = new Date(post.timestamp).getTime() / 1000;
      const botInfo = checkBotCoordination(cleaned, post.author_id, timestampSec);

      // Call ML Service for batch inference
      const [sentimentRes] = await mlClient.inferSentimentBatch([cleaned]);
      const [topicRes] = await mlClient.inferTopicsBatch([cleaned]);
      const [stanceRes] = await mlClient.inferStanceBatch([{ text: cleaned, topic_name: topicRes.topic_name }]);

      const postKey = `${post.platform}_${post.post_id}`;
      const authorHashed = crypto.createHash("sha256").update(post.author_id).digest("hex").slice(0, 16);

      // 1. Write to TimescaleDB
      await pgPool.query(`
        INSERT INTO posts (
          post_key, platform, post_id, author_id, author_hashed, text, timestamp,
          likes, shares, comments_count, language, forward_count, canonical_post_id,
          is_suspected_bot, coordination_cluster_id, region, profession, interests,
          sentiment, sentiment_score, emotions, stance, topic_id, topic_name, is_demo_sample
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        ) ON CONFLICT (post_key, timestamp) DO NOTHING;
      `, [
        postKey, post.platform, post.post_id, post.author_id, authorHashed, cleaned, post.timestamp,
        post.likes, post.shares, post.comments_count, lang, 1, postKey,
        botInfo.isSuspectedBot, botInfo.coordinationClusterId, demo.region, demo.profession, demo.interests,
        sentimentRes.sentiment, sentimentRes.sentiment_score, JSON.stringify(sentimentRes.emotions), stanceRes,
        topicRes.topic_id, topicRes.topic_name, post.is_demo_sample
      ]);

      // 2. Write to Neo4j — the graph is what backs /network/graph and the
      // provenance cascade, so topic_id must live on the Post node too.
      await runCypher(`
        MERGE (u:User {id: $author_id})
        ON CREATE SET u.hashed_id = $author_hashed, u.region = $region
        MERGE (p:Post {id: $post_key})
        ON CREATE SET p.platform = $platform, p.text = $text, p.timestamp = $timestamp,
                      p.sentiment = $sentiment, p.topic_id = $topic_id,
                      p.topic_name = $topic_name, p.author_id = $author_id,
                      p.region = $region, p.is_bot = $is_bot
        MERGE (u)-[:POSTED]->(p)
        // A captured forward/repost of near-identical text becomes a real graph edge,
        // which is what makes "how the news arrived" traceable instead of guessed.
        FOREACH (_ IN CASE WHEN $canonical IS NOT NULL AND $canonical <> $post_key THEN [1] ELSE [] END |
          MERGE (src:Post {id: $canonical})
          FOREACH (_2 IN CASE WHEN src IS NOT NULL THEN [1] ELSE [] END |
            MERGE (p)-[:FORWARDED_FROM]->(src)
          )
        )
      `, {
        author_id: post.author_id,
        author_hashed: authorHashed,
        region: demo.region,
        post_key: postKey,
        platform: post.platform,
        text: cleaned.slice(0, 100),
        timestamp: post.timestamp,
        sentiment: sentimentRes.sentiment,
        topic_id: topicRes.topic_id,
        topic_name: topicRes.topic_name,
        is_bot: botInfo.isSuspectedBot,
        canonical: postKey
      });

    } catch (err) {
      console.error(`Error processing post ${post.post_id}:`, err);
    }
  }, { connection });

  console.log("BullMQ ingestion worker started successfully.");
  return worker;
}
