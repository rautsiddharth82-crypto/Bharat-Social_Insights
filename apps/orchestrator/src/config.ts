import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps/orchestrator/.env"),
  path.resolve(currentDir, "../../.env"),
  path.resolve(currentDir, "../../../.env"),
  path.resolve(currentDir, "../.env"),
  path.resolve(currentDir, ".env"),
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  environment: process.env.ENVIRONMENT || "development",

  postgres: {
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "social_analytics",
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false
  },

  neo4j: {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    user: process.env.NEO4J_USER || "neo4j",
    password: process.env.NEO4J_PASSWORD || "password123"
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USER || undefined
  },

  // When running the orchestrator directly (npm run dev) the ML service lives on
  // localhost. Under docker-compose the `orchestrator` service overrides this to
  // http://ml-service:8001 via its `environment:` block, so both paths work.
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8001",

  // Optional shared secret for external ingest webhooks (e.g. the Reddit Devvit app).
  // When unset, ingest endpoints accept requests without auth (development only).
  ingestSharedSecret: process.env.INGEST_SHARED_SECRET || "",

  connectors: {
    telegramApiId: process.env.TELEGRAM_API_ID || "",
    telegramApiHash: process.env.TELEGRAM_API_HASH || "",
    youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
    redditClientId: process.env.REDDIT_CLIENT_ID || "",
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET || "",
    // When true, the legacy Reddit poller is skipped (posts arrive via the
    // Devvit app's /ingest/reddit push webhook instead).
    redditDisablePolling: process.env.REDDIT_DISABLE_POLLING === "true",
    metaAccessToken: process.env.META_ACCESS_TOKEN || "",
    metaPageId: process.env.META_PAGE_ID || "",
    twitterBearerToken: process.env.TWITTER_BEARER_TOKEN || ""
  }
};
