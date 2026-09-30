CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS posts (
    post_key VARCHAR(256) NOT NULL,
    platform VARCHAR(32) NOT NULL,
    post_id VARCHAR(128) NOT NULL,
    author_id VARCHAR(128) NOT NULL,
    author_hashed VARCHAR(128) NOT NULL,
    text TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    likes INT DEFAULT 0,
    shares INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    language VARCHAR(16) DEFAULT 'en',
    forward_count INT DEFAULT 1,
    canonical_post_id VARCHAR(256),
    is_suspected_bot BOOLEAN DEFAULT FALSE,
    coordination_cluster_id VARCHAR(128),
    region VARCHAR(64) DEFAULT 'Unknown',
    profession VARCHAR(64) DEFAULT 'General',
    interests TEXT[] DEFAULT '{}',
    sentiment VARCHAR(16) DEFAULT 'neutral',
    sentiment_score FLOAT DEFAULT 0.0,
    emotions JSONB DEFAULT '{}'::jsonb,
    stance VARCHAR(32) DEFAULT 'neutral',
    topic_id VARCHAR(64) DEFAULT 'general',
    topic_name VARCHAR(128) DEFAULT 'General Discussion',
    is_demo_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_key, timestamp)
);

SELECT create_hypertable('posts', 'timestamp', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts (platform, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts (topic_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts (sentiment, timestamp DESC);

CREATE TABLE IF NOT EXISTS topic_clusters (
    topic_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    post_count INT DEFAULT 0,
    velocity FLOAT DEFAULT 0.0,
    forecast_next_hour FLOAT DEFAULT 0.0,
    dominant_sentiment VARCHAR(16) DEFAULT 'neutral',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    endpoint VARCHAR(128) NOT NULL,
    query_params JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connector_status (
    platform VARCHAR(32) PRIMARY KEY,
    configured BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'Disabled',
    last_fetch TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO connector_status (platform, configured, status, is_demo, updated_at)
VALUES 
('telegram', FALSE, 'Demo Mode', TRUE, NOW()),
('youtube', FALSE, 'Demo Mode', TRUE, NOW()),
('reddit', FALSE, 'Demo Mode', TRUE, NOW()),
('facebook', FALSE, 'Demo Mode', TRUE, NOW()),
('twitter', FALSE, 'Demo Mode', TRUE, NOW())
ON CONFLICT (platform) DO NOTHING;
