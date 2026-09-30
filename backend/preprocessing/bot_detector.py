import hashlib
from typing import Dict, Any, List, Tuple

# Memory structure to track recent post signatures: text_hash -> list of (author_id, timestamp)
RECENT_TEXT_CACHE: Dict[str, List[Tuple[str, float]]] = {}

def check_bot_coordination(text: str, author_id: str, post_timestamp_sec: float, threshold_accounts: int = 2) -> Dict[str, Any]:
    """
    Flags near-duplicate text posted by >= N distinct accounts.
    Returns dict with 'is_suspected_bot' (bool) and 'coordination_cluster_id' (str).
    """
    if not text or len(text.strip()) < 15:
        return {"is_suspected_bot": False, "coordination_cluster_id": None}

    # Generate a normalized signature hash for the text
    normalized_sig = hashlib.md5(" ".join(text.lower().split()[:20]).encode('utf-8')).hexdigest()[:12]
    cluster_id = f"coord_cluster_{normalized_sig}"

    if normalized_sig not in RECENT_TEXT_CACHE:
        RECENT_TEXT_CACHE[normalized_sig] = [(author_id, post_timestamp_sec)]
        return {"is_suspected_bot": False, "coordination_cluster_id": None}
    else:
        # Filter out posts older than 3600 seconds (1 hour)
        valid_entries = [
            (auth, ts) for auth, ts in RECENT_TEXT_CACHE[normalized_sig]
            if abs(post_timestamp_sec - ts) <= 3600
        ]
        valid_entries.append((author_id, post_timestamp_sec))
        RECENT_TEXT_CACHE[normalized_sig] = valid_entries

        # Count distinct authors
        distinct_authors = set(auth for auth, _ in valid_entries)

        if len(distinct_authors) >= threshold_accounts:
            return {
                "is_suspected_bot": True,
                "coordination_cluster_id": cluster_id
            }
        
        return {"is_suspected_bot": False, "coordination_cluster_id": None}
