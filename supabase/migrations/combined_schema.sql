-- Wild Reader Combined Database Schema
-- For fresh installs, run this single migration instead of applying incremental migrations.
-- Last updated: 2026-01-29

-- ====================
-- 1. EXTENSIONS
-- ====================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================
-- 2. ENUMS
-- ====================

DO $$ BEGIN
  CREATE TYPE item_type AS ENUM ('vocabulary', 'letter', 'person');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE game_type AS ENUM (
    'letter-match', 'letter-hunt', 'letter-to-picture',
    'picture-to-letter', 'starts-with', 'ends-with',
    'word-match', 'picture-match', 'face-match',
    'todays-sound', 'freeplay-canvas', 'sight-word-splatter'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ====================
-- 3. BETTER AUTH TABLES (wr_ prefix)
-- ====================

-- Users table
CREATE TABLE IF NOT EXISTS wr_user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS wr_session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES wr_user(id) ON DELETE CASCADE
);

-- Accounts table
CREATE TABLE IF NOT EXISTS wr_account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES wr_user(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("providerId", "accountId")
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS wr_verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

-- Better Auth indexes
CREATE INDEX IF NOT EXISTS wr_session_user_id_idx ON wr_session("userId");
CREATE INDEX IF NOT EXISTS wr_session_token_idx ON wr_session(token);
CREATE INDEX IF NOT EXISTS wr_account_user_id_idx ON wr_account("userId");
CREATE INDEX IF NOT EXISTS wr_verification_identifier_idx ON wr_verification(identifier);

-- ====================
-- 4. CORE APPLICATION TABLES
-- ====================

-- Child profiles table
CREATE TABLE IF NOT EXISTS wr_child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES wr_user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👶',
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT child_name_length CHECK (char_length(name) BETWEEN 1 AND 50)
);
CREATE INDEX IF NOT EXISTS idx_wr_child_profiles_user_id ON wr_child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wr_child_profiles_active ON wr_child_profiles(user_id, is_active);

-- Vocabulary items table
CREATE TABLE IF NOT EXISTS wr_vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  emoji TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, word)
);
CREATE INDEX IF NOT EXISTS idx_wr_vocabulary_child_id ON wr_vocabulary_items(child_id);

-- Letters table
CREATE TABLE IF NOT EXISTS wr_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  letter TEXT NOT NULL CHECK (char_length(letter) = 1),
  lowercase TEXT NOT NULL CHECK (char_length(lowercase) = 1),
  example_word TEXT NOT NULL,
  example_emoji TEXT NOT NULL,
  UNIQUE(child_id, letter)
);
CREATE INDEX IF NOT EXISTS idx_wr_letters_child_id ON wr_letters(child_id);

-- Mastery data table (normalized - one row per item per game)
CREATE TABLE IF NOT EXISTS wr_mastery_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id UUID NOT NULL,
  game_type game_type NOT NULL,
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  correct INTEGER DEFAULT 0 CHECK (correct >= 0 AND correct <= attempts),
  last_attempt_at TIMESTAMPTZ,
  UNIQUE(child_id, item_type, item_id, game_type)
);
CREATE INDEX IF NOT EXISTS idx_wr_mastery_child_item ON wr_mastery_data(child_id, item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_wr_mastery_game_type ON wr_mastery_data(child_id, game_type);

-- Game sessions table
CREATE TABLE IF NOT EXISTS wr_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  current_game game_type,
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  total_stars INTEGER DEFAULT 0 CHECK (total_stars >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  difficulty_by_game JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(child_id)
);
CREATE INDEX IF NOT EXISTS idx_wr_sessions_child_id ON wr_game_sessions(child_id);

-- Rewards table
CREATE TABLE IF NOT EXISTS wr_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  image_url TEXT,
  game_type game_type NOT NULL,
  streak_at_earn INTEGER NOT NULL,
  words JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wr_rewards_child_id ON wr_rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_wr_rewards_created_at ON wr_rewards(child_id, created_at DESC);

-- API keys table (encrypted)
CREATE TABLE IF NOT EXISTS wr_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES wr_user(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_wr_api_keys_user_id ON wr_api_keys(user_id);

-- IPA pronunciations table
CREATE TABLE IF NOT EXISTS wr_ipa_pronunciations (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'en',
  ipa TEXT[] NOT NULL,
  has_more_variants BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'wiktionary',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wr_ipa_pronunciations_word ON wr_ipa_pronunciations(word);
CREATE INDEX IF NOT EXISTS idx_wr_ipa_pronunciations_lang ON wr_ipa_pronunciations(lang);

-- ====================
-- 5. PEOPLE/FACES TABLES (for face-match game)
-- ====================

-- Reusable faces (shared across children for a user)
CREATE TABLE IF NOT EXISTS wr_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child-face associations
CREATE TABLE IF NOT EXISTS wr_child_faces (
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  face_id UUID NOT NULL REFERENCES wr_faces(id) ON DELETE CASCADE,
  is_distractor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (child_id, face_id)
);

-- ====================
-- 6. TODAY'S SOUND TABLE
-- ====================

CREATE TABLE IF NOT EXISTS wr_todays_sound_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES wr_child_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  letter_or_digraph TEXT NOT NULL,
  words_entered TEXT[] NOT NULL,
  matched_vocabulary TEXT[] NOT NULL,
  total_available INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wr_todays_sound_child_date ON wr_todays_sound_attempts(child_id, date);
CREATE INDEX IF NOT EXISTS idx_wr_todays_sound_child_letter ON wr_todays_sound_attempts(child_id, letter_or_digraph);

-- ====================
-- 7. AUDIO QUIZZES TABLES
-- ====================

CREATE TABLE IF NOT EXISTS wr_story_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_text TEXT NOT NULL,
  public_domain BOOLEAN NOT NULL DEFAULT false,
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wr_story_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_source_id UUID NOT NULL REFERENCES wr_story_sources(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  segment_text TEXT NOT NULL,
  pause_ms INTEGER NOT NULL DEFAULT 800,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_source_id, segment_index)
);
CREATE INDEX IF NOT EXISTS wr_story_segments_story_source_idx ON wr_story_segments(story_source_id);

CREATE TABLE IF NOT EXISTS wr_audio_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  provider TEXT NOT NULL,
  voice TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_ms INTEGER,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (checksum)
);
CREATE INDEX IF NOT EXISTS wr_audio_clips_owner_idx ON wr_audio_clips(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS wr_audio_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  story_source_id UUID NOT NULL REFERENCES wr_story_sources(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  voice TEXT NOT NULL DEFAULT 'nova',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wr_audio_quizzes_user_idx ON wr_audio_quizzes(user_id);

CREATE TABLE IF NOT EXISTS wr_audio_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES wr_audio_quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, order_index)
);
CREATE INDEX IF NOT EXISTS wr_audio_quiz_questions_quiz_idx ON wr_audio_quiz_questions(quiz_id);

CREATE TABLE IF NOT EXISTS wr_audio_quiz_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES wr_audio_quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  item_ref_id UUID,
  pause_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, order_index)
);
CREATE INDEX IF NOT EXISTS wr_audio_quiz_timeline_quiz_idx ON wr_audio_quiz_timeline(quiz_id);

-- ====================
-- 8. DISABLE ROW LEVEL SECURITY
-- (Authorization handled in application layer)
-- ====================

ALTER TABLE wr_child_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_vocabulary_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_mastery_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_todays_sound_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_story_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_story_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_audio_clips DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_audio_quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_audio_quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_audio_quiz_timeline DISABLE ROW LEVEL SECURITY;

-- ====================
-- 9. FUNCTIONS
-- ====================

-- Function: Initialize default data for new child
CREATE OR REPLACE FUNCTION initialize_child_data(p_child_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert default vocabulary (20 words)
  INSERT INTO wr_vocabulary_items (child_id, word, emoji, is_default)
  VALUES
    (p_child_id, 'cat', '🐱', true),
    (p_child_id, 'dog', '🐶', true),
    (p_child_id, 'ball', '⚽', true),
    (p_child_id, 'car', '🚗', true),
    (p_child_id, 'hat', '🎩', true),
    (p_child_id, 'bat', '🦇', true),
    (p_child_id, 'cap', '🧢', true),
    (p_child_id, 'sun', '☀️', true),
    (p_child_id, 'bed', '🛏️', true),
    (p_child_id, 'cup', '🥤', true),
    (p_child_id, 'pen', '🖊️', true),
    (p_child_id, 'box', '📦', true),
    (p_child_id, 'fox', '🦊', true),
    (p_child_id, 'pig', '🐷', true),
    (p_child_id, 'cow', '🐮', true),
    (p_child_id, 'duck', '🦆', true),
    (p_child_id, 'fish', '🐟', true),
    (p_child_id, 'bird', '🐦', true),
    (p_child_id, 'tree', '🌲', true),
    (p_child_id, 'book', '📚', true);

  -- Insert letters (A-Z)
  INSERT INTO wr_letters (child_id, letter, lowercase, example_word, example_emoji)
  VALUES
    (p_child_id, 'A', 'a', 'apple', '🍎'),
    (p_child_id, 'B', 'b', 'ball', '⚽'),
    (p_child_id, 'C', 'c', 'cat', '🐱'),
    (p_child_id, 'D', 'd', 'dog', '🐶'),
    (p_child_id, 'E', 'e', 'egg', '🥚'),
    (p_child_id, 'F', 'f', 'fish', '🐟'),
    (p_child_id, 'G', 'g', 'gift', '🎁'),
    (p_child_id, 'H', 'h', 'hat', '🎩'),
    (p_child_id, 'I', 'i', 'ice', '🧊'),
    (p_child_id, 'J', 'j', 'jam', '🍓'),
    (p_child_id, 'K', 'k', 'key', '🔑'),
    (p_child_id, 'L', 'l', 'leaf', '🍃'),
    (p_child_id, 'M', 'm', 'moon', '🌙'),
    (p_child_id, 'N', 'n', 'nest', '🪹'),
    (p_child_id, 'O', 'o', 'owl', '🦉'),
    (p_child_id, 'P', 'p', 'pen', '🖊️'),
    (p_child_id, 'Q', 'q', 'queen', '👸'),
    (p_child_id, 'R', 'r', 'ring', '💍'),
    (p_child_id, 'S', 's', 'sun', '☀️'),
    (p_child_id, 'T', 't', 'tree', '🌲'),
    (p_child_id, 'U', 'u', 'umbrella', '☂️'),
    (p_child_id, 'V', 'v', 'van', '🚐'),
    (p_child_id, 'W', 'w', 'watch', '⌚'),
    (p_child_id, 'X', 'x', 'xray', '🩻'),
    (p_child_id, 'Y', 'y', 'yo-yo', '🪀'),
    (p_child_id, 'Z', 'z', 'zebra', '🦓');

  -- Initialize game session
  INSERT INTO wr_game_sessions (child_id, streak, total_stars)
  VALUES (p_child_id, 0, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Trigger to auto-initialize new child
CREATE OR REPLACE FUNCTION trigger_initialize_child()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_child_data(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_child_created ON wr_child_profiles;
CREATE TRIGGER on_child_created
  AFTER INSERT ON wr_child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_child();

-- Function: Increment mastery (upsert pattern)
CREATE OR REPLACE FUNCTION increment_mastery(
  p_child_id UUID,
  p_item_type item_type,
  p_item_id UUID,
  p_game_type game_type,
  p_is_correct BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO wr_mastery_data (
    child_id, item_type, item_id, game_type,
    attempts, correct, last_attempt_at
  )
  VALUES (
    p_child_id, p_item_type, p_item_id, p_game_type,
    1, CASE WHEN p_is_correct THEN 1 ELSE 0 END, NOW()
  )
  ON CONFLICT (child_id, item_type, item_id, game_type)
  DO UPDATE SET
    attempts = wr_mastery_data.attempts + 1,
    correct = wr_mastery_data.correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_attempt_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Get vocabulary with mastery (aggregated)
CREATE OR REPLACE FUNCTION get_vocabulary_with_mastery(p_child_id UUID)
RETURNS TABLE(
  id UUID,
  word TEXT,
  emoji TEXT,
  mastery JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.word,
    v.emoji,
    COALESCE(
      jsonb_object_agg(
        m.game_type::text,
        jsonb_build_object(
          'attempts', COALESCE(m.attempts, 0),
          'correct', COALESCE(m.correct, 0)
        )
      ) FILTER (WHERE m.game_type IS NOT NULL),
      '{}'::jsonb
    ) AS mastery
  FROM wr_vocabulary_items v
  LEFT JOIN wr_mastery_data m ON
    m.item_id = v.id AND
    m.item_type = 'vocabulary' AND
    m.child_id = p_child_id
  WHERE v.child_id = p_child_id
  GROUP BY v.id, v.word, v.emoji
  ORDER BY v.word;
END;
$$ LANGUAGE plpgsql;

-- Function: Get letters with mastery (aggregated)
CREATE OR REPLACE FUNCTION get_letters_with_mastery(p_child_id UUID)
RETURNS TABLE(
  id UUID,
  letter TEXT,
  lowercase TEXT,
  example_word TEXT,
  example_emoji TEXT,
  mastery JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.letter,
    l.lowercase,
    l.example_word,
    l.example_emoji,
    COALESCE(
      jsonb_object_agg(
        m.game_type::text,
        jsonb_build_object(
          'attempts', COALESCE(m.attempts, 0),
          'correct', COALESCE(m.correct, 0)
        )
      ) FILTER (WHERE m.game_type IS NOT NULL),
      '{}'::jsonb
    ) AS mastery
  FROM wr_letters l
  LEFT JOIN wr_mastery_data m ON
    m.item_id = l.id AND
    m.item_type = 'letter' AND
    m.child_id = p_child_id
  WHERE l.child_id = p_child_id
  GROUP BY l.id, l.letter, l.lowercase, l.example_word, l.example_emoji
  ORDER BY l.letter;
END;
$$ LANGUAGE plpgsql;

-- Function: Get people/faces with mastery for face-match game
CREATE OR REPLACE FUNCTION get_people_with_mastery(p_child_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  image_path TEXT,
  is_distractor BOOLEAN,
  mastery JSONB
)
LANGUAGE SQL
AS $$
  SELECT
    f.id,
    f.name,
    f.image_path,
    cf.is_distractor,
    COALESCE(
      jsonb_object_agg(
        m.game_type,
        jsonb_build_object('attempts', m.attempts, 'correct', m.correct)
      ) FILTER (WHERE m.game_type IS NOT NULL),
      '{}'::jsonb
    ) AS mastery
  FROM wr_child_faces cf
  JOIN wr_faces f ON f.id = cf.face_id
  LEFT JOIN wr_mastery_data m
    ON m.child_id = cf.child_id
    AND m.item_type = 'person'
    AND m.item_id = f.id
  WHERE cf.child_id = p_child_id
  GROUP BY f.id, f.name, f.image_path, cf.is_distractor;
$$;
