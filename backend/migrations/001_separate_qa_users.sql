-- 001_separate_qa_users.sql
-- Separate QA users from KPI users. Wipes test audit data.
-- Safe to run on KPI side: does not touch `users`, `branches`, `areas`, or any KPI tables.

BEGIN;

-- 1. Wipe test audit data (order matters due to FKs)
DELETE FROM qa_audit_photos;
DELETE FROM qa_audit_responses;
DELETE FROM qa_audits;

-- 2. Drop the old role-layering table (role will move onto qa_users)
DROP TABLE IF EXISTS qa_user_roles;

-- 3. Drop any foreign key constraints on qa_audits / qa_audit_photos / qa_form_templates
--    that currently reference the shared `users` table. Names may vary by env.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname, cls.relname AS table_name
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_class ref ON ref.oid = con.confrelid
    WHERE con.contype = 'f'
      AND ref.relname = 'users'
      AND cls.relname IN ('qa_audits', 'qa_audit_photos', 'qa_form_templates')
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.conname);
    RAISE NOTICE 'Dropped constraint % from %', r.conname, r.table_name;
  END LOOP;
END $$;

-- 4. Create the standalone qa_users table
CREATE TABLE qa_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('top_management', 'quality_manager', 'quality_auditor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT qa_users_email_domain_chk CHECK (email LIKE '%@creativepan.com.eg')
);

CREATE INDEX qa_users_email_idx ON qa_users (lower(email));
CREATE INDEX qa_users_google_id_idx ON qa_users (google_id);
CREATE INDEX qa_users_active_idx ON qa_users (is_active) WHERE is_active = true;

-- 5. updated_at trigger (use existing function if present, else create)
CREATE OR REPLACE FUNCTION qa_users_set_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER qa_users_updated_at_trg
  BEFORE UPDATE ON qa_users
  FOR EACH ROW EXECUTE FUNCTION qa_users_set_updated_at();

-- 6. Seed the bootstrap admin
INSERT INTO qa_users (email, name, role, is_active)
VALUES ('mohamed.fahmy@creativepan.com.eg', 'Mohamed Fahmy', 'top_management', true);

-- 7. Point FKs at qa_users
ALTER TABLE qa_audits
  ADD CONSTRAINT qa_audits_auditor_id_fkey
    FOREIGN KEY (auditor_id) REFERENCES qa_users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT qa_audits_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES qa_users(id) ON DELETE SET NULL;

ALTER TABLE qa_audit_photos
  ADD CONSTRAINT qa_audit_photos_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES qa_users(id) ON DELETE RESTRICT;

ALTER TABLE qa_form_templates
  ADD CONSTRAINT qa_form_templates_published_by_fkey
    FOREIGN KEY (published_by) REFERENCES qa_users(id) ON DELETE SET NULL;

COMMIT;
