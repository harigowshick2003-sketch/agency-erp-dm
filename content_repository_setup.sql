-- ═══════════════════════════════════════════════════════════════════
--  Agency ERP — Content Repository Module
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--
--  BEFORE running: Create a Storage bucket called "content-repo"
--    Supabase Dashboard → Storage → New Bucket
--    Name: content-repo
--    Public: ✓ (toggle on)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. CONTENT REPOSITORY CARDS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_repository_cards (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  client_id          uuid        REFERENCES clients(id) ON DELETE CASCADE,
  column_id          text        NOT NULL DEFAULT 'shoot',
  -- column_id values: 'shoot' | 'raw_footage' | 'repository' | 'editors' | 'final_output'
  title              text        NOT NULL,
  description        text,
  assigned_editor_id uuid        REFERENCES employees(id) ON DELETE SET NULL,
  status             text        DEFAULT 'Pending',
  -- status values: 'Pending' | 'In Progress' | 'Review' | 'Done'
  position           integer     DEFAULT 0
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_content_repo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_repo_updated_at ON content_repository_cards;
CREATE TRIGGER trg_content_repo_updated_at
  BEFORE UPDATE ON content_repository_cards
  FOR EACH ROW EXECUTE FUNCTION update_content_repo_updated_at();

-- ── 2. CONTENT REPOSITORY ATTACHMENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS content_repository_attachments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  card_id    uuid        REFERENCES content_repository_cards(id) ON DELETE CASCADE,
  type       text        NOT NULL DEFAULT 'link',
  -- type values: 'file' | 'link'
  name       text        NOT NULL,
  url        text        NOT NULL,
  mime_type  text
  -- For files: url is the Supabase Storage public URL
  -- For links: url is the external URL (Google Drive, YouTube, etc.)
);

-- ═══════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE content_repository_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_repository_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_content_repo_cards"       ON content_repository_cards;
DROP POLICY IF EXISTS "auth_content_repo_attachments" ON content_repository_attachments;

CREATE POLICY "auth_content_repo_cards"
  ON content_repository_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_content_repo_attachments"
  ON content_repository_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════
--  STORAGE: Run this to create the bucket policy (if not done via UI)
-- ═══════════════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public) VALUES ('content-repo', 'content-repo', true)
-- ON CONFLICT (id) DO NOTHING;

-- DROP POLICY IF EXISTS "Public read content-repo" ON storage.objects;
-- CREATE POLICY "Public read content-repo" ON storage.objects
--   FOR SELECT USING (bucket_id = 'content-repo');

-- DROP POLICY IF EXISTS "Auth upload content-repo" ON storage.objects;
-- CREATE POLICY "Auth upload content-repo" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content-repo');

-- DROP POLICY IF EXISTS "Auth delete content-repo" ON storage.objects;
-- CREATE POLICY "Auth delete content-repo" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'content-repo');

-- ═══════════════════════════════════════════════════════════════════
--  VERIFY
-- ═══════════════════════════════════════════════════════════════════
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'content_repository%'
ORDER BY table_name;
