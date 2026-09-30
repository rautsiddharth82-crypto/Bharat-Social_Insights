import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { initPostgres } from "./db/timescale.js";
import { initNeo4j } from "./db/neo4j.js";
import { initRedis } from "./db/redis.js";
import { registerRoutes } from "./api/router.js";

const fastify = Fastify({ logger: true });

async function start() {
  try {
    // x-analyst-id is a custom header — without listing it here the browser
    // preflight fails once the frontend is served from another origin (Vercel).
    // CORS_ORIGIN accepts a comma-separated list of allowed origins.
    const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
    const originList = corsOrigin.includes(",")
      ? corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
      : corsOrigin;
    await fastify.register(cors, {
      origin: originList as any,
      allowedHeaders: ["Content-Type", "Authorization", "x-analyst-id"],
      methods: ["GET", "POST", "OPTIONS"]
    });

    console.log("[Lite Mode] Initializing database connections (best-effort)...");
    try {
      await initPostgres();
    } catch (e) {
      console.warn("[Lite Mode] PostgreSQL unavailable — all endpoints will use fallback data.", (e as Error).message);
    }
    try {
      initNeo4j();
    } catch (e) {
      console.warn("[Lite Mode] Neo4j unavailable — network endpoints will use fallback data.", (e as Error).message);
    }
    try {
      await initRedis();
    } catch (e) {
      console.warn("[Lite Mode] Redis unavailable — caching & queue features disabled.", (e as Error).message);
    }

    await registerRoutes(fastify);

    fastify.get("/", async () => ({
      service: "Bharat Social Insights - Orchestrator API (Lite)",
      status: "healthy",
      version: "1.0.0"
    }));

    fastify.get("/favicon.ico", async (req, reply) => {
      reply.code(204).send();
    });

    fastify.get("/health", async () => ({
      status: "healthy",
      service: "orchestrator-lite",
      mode: "lite",
      port: config.port
    }));

    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`[Lite Mode] Orchestrator API listening on port ${config.port}. All routes active with fallback data.`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
