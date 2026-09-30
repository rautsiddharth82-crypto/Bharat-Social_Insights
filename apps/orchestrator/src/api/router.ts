import { FastifyInstance } from "fastify";
import { sentimentRoutes } from "./routes/sentiment.js";
import { trendsRoutes } from "./routes/trends.js";
import { demographicsRoutes } from "./routes/demographics.js";
import { networkRoutes } from "./routes/network.js";
import { rumorRoutes } from "./routes/rumor.js";
import { alertsRoutes } from "./routes/alerts.js";
import { connectorsRoutes } from "./routes/connectors.js";
import { pipelineRoutes } from "./routes/pipeline.js";
import { auditRoutes } from "./routes/audit.js";
import { postsRoutes, statsRoutes } from "./routes/liveFeed.js";
import { summaryRoutes } from "./routes/summary.js";
import { ingestRoutes } from "./routes/ingest.js";
import { logAuditEvent } from "../services/auditService.js";

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    if (url.startsWith("/sentiment") || url.startsWith("/trends") || url.startsWith("/demographics") || url.startsWith("/network") || url.startsWith("/rumor-risk") || url.startsWith("/alerts") || url.startsWith("/posts")) {
      const analystId = (request.headers["x-analyst-id"] as string) || "analyst_guest";
      await logAuditEvent(analystId, url, request.query);
    }
  });

  fastify.register(sentimentRoutes, { prefix: "/sentiment" });
  fastify.register(trendsRoutes, { prefix: "/trends" });
  fastify.register(demographicsRoutes, { prefix: "/demographics" });
  fastify.register(networkRoutes, { prefix: "/network" });
  fastify.register(rumorRoutes, { prefix: "/rumor-risk" });
  fastify.register(alertsRoutes, { prefix: "/alerts" });
  fastify.register(connectorsRoutes, { prefix: "/system/connectors" });
  fastify.register(pipelineRoutes, { prefix: "/system/pipeline" });
  fastify.register(auditRoutes, { prefix: "/admin/audit-log" });
  fastify.register(postsRoutes, { prefix: "/posts" });
  fastify.register(statsRoutes, { prefix: "/stats" });
  fastify.register(summaryRoutes, { prefix: "/summary" });
  fastify.register(ingestRoutes, { prefix: "/ingest" });
}
