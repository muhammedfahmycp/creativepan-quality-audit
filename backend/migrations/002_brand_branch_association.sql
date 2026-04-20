-- 002_brand_branch_association.sql
-- Associates branches (shared from KPI) with qa_brands. Many-to-many to stay flexible,
-- even though real-world usage will typically be 1 brand per branch.

BEGIN;

CREATE TABLE qa_brand_branches (
  brand_id  UUID NOT NULL REFERENCES qa_brands(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES qa_users(id) ON DELETE SET NULL,
  PRIMARY KEY (brand_id, branch_id)
);

CREATE INDEX qa_brand_branches_branch_idx ON qa_brand_branches (branch_id);

COMMIT;
