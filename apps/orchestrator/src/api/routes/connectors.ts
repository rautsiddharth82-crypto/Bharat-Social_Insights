import { FastifyInstance } from "fastify";
import { statusTracker } from "../../collectors/statusTracker.js";

// Only returned before an ingestion worker has written its first status row, so
// the interface can report "awaiting first poll" instead of inventing a health
// state it cannot verify.
const DEFAULT_STATUSES = [
  { platform: "telegram", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
  { platform: "youtube", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
  { platform: "reddit", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
  { platform: "facebook", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
  { platform: "instagram", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
  { platform: "twitter", configured: false, status: "Awaiting first poll", last_fetch: null, is_demo: false, error_message: null },
];

export async function connectorsRoutes(fastify: FastifyInstance) {
  fastify.get("", async (req, reply) => {
    const statuses = await statusTracker.getAllStatuses();
    if (statuses.length === 0) {
      return { connectors: DEFAULT_STATUSES };
    }
    return { connectors: statuses };
  });
}
