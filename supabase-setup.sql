-- ═══════════════════════════════════════════
-- MEMOIR — Supabase setup (à coller dans SQL Editor)
-- ═══════════════════════════════════════════

-- 1. Table waitlist (pré-inscriptions)
CREATE TABLE IF NOT EXISTS waitlist (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email        text NOT NULL,
  name         text,
  source       text DEFAULT 'unknown',   -- 'landing' | 'app_end_session'
  lang         text DEFAULT 'fr',        -- 'fr' | 'en' | 'es'
  session_snippet text,                  -- extrait du texte écrit (200 chars max)
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- 2. RLS — autoriser les inserts anonymes (pas d'auth requise pour la waitlist)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_insert"
  ON waitlist FOR INSERT
  TO anon
  WITH CHECK (true);

-- Lecture réservée au service role (admin uniquement)
CREATE POLICY "service_role_all"
  ON waitlist FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Index utile pour admin
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_source_idx ON waitlist (source);
