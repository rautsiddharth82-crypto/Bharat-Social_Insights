import hashlib
from fastapi import APIRouter, Query
from typing import Optional
from services.gds_service import get_cascade_trace

router = APIRouter()

def hash_author(author_id: str) -> str:
    """Governance requirement: hash author_id before it's ever returned to the frontend."""
    if not author_id:
        return "anon_00"
    return "usr_" + hashlib.sha256(author_id.encode('utf-8')).hexdigest()[:10]

@router.get("/graph")
def get_network_graph(topic: Optional[str] = Query("topic_mumbai_rains")):
    # Nodes with PageRank scores and Louvain community IDs
    raw_nodes = [
        {"id": "channel_defence_india", "label": "Defence India Channel", "platform": "telegram", "pagerank": 0.082, "community": 1, "region": "Maharashtra"},
        {"id": "citizen_journo_in", "label": "Citizen Journalist IN", "platform": "twitter", "pagerank": 0.095, "community": 1, "region": "Maharashtra"},
        {"id": "mumbai_news_handle", "label": "Mumbai News Flash", "platform": "twitter", "pagerank": 0.064, "community": 1, "region": "Maharashtra"},
        {"id": "mumbai_vlogger", "label": "Mumbai Commuter Vlog", "platform": "youtube", "pagerank": 0.048, "community": 2, "region": "Maharashtra"},
        {"id": "u_mumbai_commuter", "label": "Local Commuter", "platform": "reddit", "pagerank": 0.035, "community": 2, "region": "Maharashtra"},
        {"id": "page_disaster_alert_in", "label": "NDRF Disaster Alert", "platform": "facebook", "pagerank": 0.088, "community": 3, "region": "Maharashtra"},
        {"id": "delhi_air_watch", "label": "Delhi Air Monitor", "platform": "twitter", "pagerank": 0.042, "community": 4, "region": "Delhi"},
        {"id": "tech_reviewer_in", "label": "Tech Reviewer IN", "platform": "youtube", "pagerank": 0.031, "community": 5, "region": "Karnataka"}
    ]

    raw_edges = [
        {"source": "channel_defence_india", "target": "citizen_journo_in", "type": "FORWARDED", "weight": 4},
        {"source": "citizen_journo_in", "target": "mumbai_news_handle", "type": "REPLIED_TO", "weight": 3},
        {"source": "mumbai_news_handle", "target": "mumbai_vlogger", "type": "COMMENTED_ON", "weight": 2},
        {"source": "mumbai_vlogger", "target": "u_mumbai_commuter", "type": "FORWARDED", "weight": 2},
        {"source": "page_disaster_alert_in", "target": "citizen_journo_in", "type": "MENTIONS", "weight": 5}
    ]

    # Enforce author hashing
    nodes = []
    id_map = {}
    for n in raw_nodes:
        hashed_id = hash_author(n["id"])
        id_map[n["id"]] = hashed_id
        nodes.append({
            "id": hashed_id,
            "label": n["label"],
            "platform": n["platform"],
            "pagerank": n["pagerank"],
            "community": n["community"],
            "region": n["region"],
            "val": max(n["pagerank"] * 100, 5) # node radius sizing
        })

    edges = []
    for e in raw_edges:
        edges.append({
            "source": id_map.get(e["source"], e["source"]),
            "target": id_map.get(e["target"], e["target"]),
            "type": e["type"],
            "weight": e["weight"]
        })

    return {"topic": topic, "nodes": nodes, "edges": edges}

@router.get("/cascade")
def get_network_cascade(topic: Optional[str] = Query("topic_mumbai_rains")):
    cascade_events = get_cascade_trace(topic or "topic_mumbai_rains")
    # Hash author IDs in cascade
    for event in cascade_events:
        if "author" in event:
            event["author_hashed"] = hash_author(event["author"])
            del event["author"]
    return {"topic": topic, "cascade": cascade_events}
