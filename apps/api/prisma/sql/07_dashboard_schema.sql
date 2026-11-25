-- PostgreSQL Schema - Matches & Real-Time Chat Dashboard
-- Standalone tables for dashboard UI data (lowercase, no Prisma conflicts)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'online_status_enum') THEN
    CREATE TYPE online_status_enum AS ENUM ('online', 'offline', 'away', 'busy');
  END IF;
END
$$;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT UNIQUE NOT NULL,
    password_hash       TEXT,
    display_name        TEXT NOT NULL,
    avatar_url          TEXT,
    gender              gender_enum,
    age                 SMALLINT CHECK (age >= 18),
    location_city       TEXT,
    location_state      TEXT,
    location_country    TEXT DEFAULT 'US',
    bio                 TEXT,
    match_percentage    NUMERIC(5,2) DEFAULT 0,
    online_status       online_status_enum DEFAULT 'offline',
    last_active_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score         NUMERIC(5,2) NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    active              BOOLEAN DEFAULT TRUE,
    favorited_by_user1  BOOLEAN DEFAULT FALSE,
    favorited_by_user2  BOOLEAN DEFAULT FALSE,
    UNIQUE(user1_id, user2_id)
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id             UUID NOT NULL REFERENCES users(id),
    user2_id             UUID NOT NULL REFERENCES users(id),
    last_message_at      TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count_user1   INTEGER DEFAULT 0,
    unread_count_user2   INTEGER DEFAULT 0,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id      UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id            UUID NOT NULL REFERENCES users(id),
    content              TEXT NOT NULL,
    sent_at              TIMESTAMPTZ DEFAULT NOW(),
    read_at              TIMESTAMPTZ,
    deleted_by_sender    BOOLEAN DEFAULT FALSE,
    deleted_by_receiver  BOOLEAN DEFAULT FALSE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             TEXT NOT NULL,
    from_user_id     UUID REFERENCES users(id),
    content          TEXT,
    is_read          BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(online_status);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user1 ON chat_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user2 ON chat_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
