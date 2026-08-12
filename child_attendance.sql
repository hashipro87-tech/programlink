-- Task #177: Individual Child Attendance Tracking
-- Per-USDA 7 CFR 226.10(d): must document individual child names present each day
-- Run this in Railway Query Editor before deploying

CREATE TABLE IF NOT EXISTS child_attendance (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id       UUID        NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date           DATE        NOT NULL,
  is_present     BOOLEAN     NOT NULL DEFAULT false,
  had_breakfast  BOOLEAN     NOT NULL DEFAULT false,
  had_lunch      BOOLEAN     NOT NULL DEFAULT false,
  had_snack      BOOLEAN     NOT NULL DEFAULT false,
  had_supper     BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, date)
);

CREATE INDEX IF NOT EXISTS idx_child_att_org_date   ON child_attendance(org_id, date);
CREATE INDEX IF NOT EXISTS idx_child_att_child_date ON child_attendance(child_id, date);
