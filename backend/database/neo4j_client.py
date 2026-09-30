from neo4j import GraphDatabase
import logging
from config import settings

logger = logging.getLogger("bsi.neo4j")

class Neo4jClient:
    def __init__ (self):
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            logger.info("Connected to Neo4j Graph Database")
        except Exception as e:
            logger.error(f"Neo4j connection error: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def run_query(self, query: str, parameters: dict = None):
        if not self.driver:
            self.connect()
        if not self.driver:
            return []
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Error executing Cypher query: {e}")
            return []

    def create_post_nodes_and_edges(self, post_data: dict):
        """
        Creates User, Post, Topic nodes and REPLIED_TO, FORWARDED, POSTED edges.
        """
        query = """
        MERGE (u:User {id: $author_id})
        ON CREATE SET u.hashed_id = $author_hashed, u.region = $region
        
        MERGE (p:Post {id: $post_key})
        ON CREATE SET p.platform = $platform, p.text = $text, p.timestamp = $timestamp, 
                      p.sentiment = $sentiment, p.stance = $stance
        
        MERGE (u)-[:POSTED]->(p)

        FOREACH (t IN CASE WHEN $topic_id IS NOT NULL THEN [$topic_id] ELSE [] END |
            MERGE (topic:Topic {id: t})
            ON CREATE SET topic.name = $topic_name
            MERGE (p)-[:BELONGS_TO]->(topic)
        )

        FOREACH (parent IN CASE WHEN $canonical_post_id IS NOT NULL AND $canonical_post_id <> $post_key THEN [$canonical_post_id] ELSE [] END |
            MERGE (parent_post:Post {id: parent})
            MERGE (p)-[:FORWARDED_FROM]->(parent_post)
        )
        """
        self.run_query(query, post_data)

neo4j_client = Neo4jClient()
