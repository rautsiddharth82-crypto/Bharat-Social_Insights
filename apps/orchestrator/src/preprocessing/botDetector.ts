import crypto from "crypto";

const RECENT_TEXT_CACHE = new Map<string, Array<{ authorId: string; timestamp: number }>>();

export function checkBotCoordination(text: string, authorId: string, timestampSec: number, thresholdAccounts = 2) {
  if (!text || text.trim().length < 15) {
    return { isSuspectedBot: false, coordinationClusterId: null };
  }

  const normalizedSig = crypto.createHash("md5").update(text.toLowerCase().split(/\s+/).slice(0, 20).join(" ")).digest("hex").slice(0, 12);
  const clusterId = `coord_cluster_${normalizedSig}`;

  const existing = RECENT_TEXT_CACHE.get(normalizedSig) || [];
  const valid = existing.filter(e => Math.abs(timestampSec - e.timestamp) <= 3600);
  valid.push({ authorId, timestamp: timestampSec });
  RECENT_TEXT_CACHE.set(normalizedSig, valid);

  const distinctAuthors = new Set(valid.map(e => e.authorId));

  if (distinctAuthors.size >= thresholdAccounts) {
    return { isSuspectedBot: true, coordinationClusterId: clusterId };
  }

  return { isSuspectedBot: false, coordinationClusterId: null };
}
