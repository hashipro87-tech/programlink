-- ─────────────────────────────────────────────
-- CLAIMS SYSTEM MIGRATION
-- Run in Railway query editor
-- ─────────────────────────────────────────────

-- State configuration table
-- Each row = one state's rules, rates, and requirements
CREATE TABLE IF NOT EXISTS state_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code  VARCHAR(2)   NOT NULL UNIQUE,  -- 'OH', 'TX', 'GA', 'FL'
  state_name  VARCHAR(100) NOT NULL,
  config      JSONB        NOT NULL,          -- full state engine config
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- One claim per sponsor per month
CREATE TABLE IF NOT EXISTS claims (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id              UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  claim_month             DATE        NOT NULL,  -- always first of month e.g. 2026-07-01
  state_code              VARCHAR(2),            -- drives which state engine runs
  status                  VARCHAR(50) NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress', 'ready', 'submitted', 'approved', 'rejected')),
  readiness_score         NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100
  sites_ready             INT          NOT NULL DEFAULT 0,
  sites_needs_review      INT          NOT NULL DEFAULT 0,
  sites_cannot_submit     INT          NOT NULL DEFAULT 0,
  estimated_reimbursement NUMERIC(12,2) NOT NULL DEFAULT 0,
  potential_loss          NUMERIC(12,2) NOT NULL DEFAULT 0,
  breakdown               JSONB,  -- { breakfast: 23921.00, lunch: 88341.00, snack: 32400.00, supper: 4201.00, milk: 1901.00 }
  submitted_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (sponsor_id, claim_month)
);

-- One row per site per claim
CREATE TABLE IF NOT EXISTS claim_items (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id                UUID        NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  site_id                 UUID        NOT NULL REFERENCES organizations(id),
  status                  VARCHAR(20) NOT NULL DEFAULT 'needs_review'
                            CHECK (status IN ('ready', 'needs_review', 'cannot_submit')),
  -- checklist booleans
  has_meal_counts         BOOLEAN NOT NULL DEFAULT FALSE,
  has_attendance          BOOLEAN NOT NULL DEFAULT FALSE,
  has_enrollment          BOOLEAN NOT NULL DEFAULT FALSE,
  has_income_eligibility  BOOLEAN NOT NULL DEFAULT FALSE,
  has_documents           BOOLEAN NOT NULL DEFAULT FALSE,
  has_menus               BOOLEAN NOT NULL DEFAULT FALSE,
  -- meal totals: { breakfast: { tier1: 120, tier2: 80 }, lunch: {...}, snack: {...}, supper: {...}, milk: {...} }
  meal_totals             JSONB,
  estimated_reimbursement NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- errors: [{ code: 'LUNCH_EXCEEDS_ATTENDANCE', message: '...', severity: 'error'|'warning', potential_loss: 234.50 }]
  errors                  JSONB NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (claim_id, site_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claims_sponsor       ON claims(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_claims_month         ON claims(claim_month);
CREATE INDEX IF NOT EXISTS idx_claims_sponsor_month ON claims(sponsor_id, claim_month);
CREATE INDEX IF NOT EXISTS idx_claim_items_claim    ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_site     ON claim_items(site_id);
CREATE INDEX IF NOT EXISTS idx_state_configs_code   ON state_configs(state_code);
