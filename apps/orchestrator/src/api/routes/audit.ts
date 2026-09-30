import { FastifyInstance } from "fastify";
import { fetchAuditLogs, logAuditEvent } from "../../services/auditService.js";

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.get("", async (req, reply) => {
    const query = req.query as { limit?: string; user?: string };
    const limit = Math.min(Math.max(parseInt(query.limit || "50", 10) || 50, 1), 200);
    const logs = await fetchAuditLogs(limit);
    // The UI filters by analyst id client-side too, but trimming here keeps the
    // payload small when someone is inspecting one operator's trail.
    const filtered = query.user ? logs.filter((l: any) => String(l.user_id).includes(query.user as string)) : logs;
    return { logs: filtered, total: logs.length, limit, source: logs.length ? "live" : "empty" };
  });

  fastify.post("", async (req, reply) => {
    const body = req.body as { userId: string; endpoint: string; queryParams: any };
    await logAuditEvent(body.userId, body.endpoint, body.queryParams);
    return { status: "logged" };
  });
}
