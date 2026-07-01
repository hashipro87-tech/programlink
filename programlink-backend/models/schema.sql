-- ProgramLink Database Schema
-- Run with: npm run db:migrate
-- Multi-tenant: sponsor_id is used to enforce data isolation between sponsors

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ORGANIZATIONS
-- Represents any entity in the system: sponsor, kitchen, site, or delivery provider
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(50) NOT NULL CHECK (type IN ('sponsor', 'kitchen', 'site', 'delivery')),
  status        VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  region        VARCHAR(100),
  address       TEXT,
  phone         VARCHAR(30),
  -- sponsor_id links all non-sponsor orgs to their overseeing sponsor
  -- NULL only for sponsor-type organizations themselves
  sponsor_id    UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- USERS
-- One login system; role determines which dashboard they see
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('sponsor', 'coordinator', 'kitchen', 'site', 'delivery')),
  org_id        UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- APPLICATIONS
-- Tracks the onboarding lifecycle for kitchens, sites, and delivery providers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- sponsor reviewing this application (data isolation enforced here)
  sponsor_id    UUID NOT NULL REFERENCES organizations(id),
  status        VARCHAR(50) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  submitted_at  TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  form_data     JSONB,                -- applicant's form answers
  notes         TEXT,  -- reviewer notes visible to applicant
  internal_notes TEXT, -- sponsor/coordinator notes NOT visible to applicant
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DOCUMENTS
-- Each org can upload multiple document types (health permit, insurance, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- e.g. 'health_permit', 'liability_insurance', 'food_handler_cert'
  doc_type      VARCHAR(100) NOT NULL,
  label         VARCHAR(255),           -- human-readable name shown in UI
  file_url      TEXT NOT NULL,          -- S3 or Supabase Storage URL
  file_name     VARCHAR(255),
  uploaded_by   UUID REFERENCES users(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,            -- NULL = no expiration
  -- status is auto-computed but stored for fast querying
  status        VARCHAR(50) NOT NULL DEFAULT 'valid'
                  CHECK (status IN ('valid', 'expiring_soon', 'expired', 'rejected', 'pending_review', 'requested', 'superseded')),
  rejection_note TEXT,                  -- coordinator note if rejected
  version       INT NOT NULL DEFAULT 1, -- increments on re-upload (audit trail)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MESSAGES
-- Threaded messaging between user types
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject       VARCHAR(255),
  -- thread is scoped to a specific org for audit trail
  related_org_id UUID REFERENCES organizations(id),
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id     UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  -- is_broadcast = true when sent to a group (coordinator → all sites, etc.)
  is_broadcast  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_recipients (
  message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES users(id),
  read_at       TIMESTAMPTZ,
  PRIMARY KEY (message_id, recipient_id)
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- In-app notification center (bell icon)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- type drives the icon and link in the UI
  type          VARCHAR(50) NOT NULL
                  CHECK (type IN (
                    'status_change', 'application_status',
                    'document_missing', 'document_expiring', 'document_expired',
                    'document_uploaded', 'document_rejected',
                    'new_message', 'pending_approval',
                    'delivery_issue', 'meal_anomaly',
                    'connection_request', 'general'
                  )),
  title         VARCHAR(255) NOT NULL,
  body          TEXT,
  -- link to the relevant page in the app (e.g. /applications/abc123)
  action_url    TEXT,
  read_at       TIMESTAMPTZ,           -- NULL = unread
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEAL COUNTS
-- Daily meal submissions from sites, verified by coordinators
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_counts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id           UUID NOT NULL REFERENCES organizations(id),
  kitchen_id        UUID REFERENCES organizations(id),
  date              DATE NOT NULL,
  count_submitted   INT NOT NULL CHECK (count_submitted >= 0),
  count_verified    INT CHECK (count_verified >= 0),
  submitted_by      UUID REFERENCES users(id),
  verified_by       UUID REFERENCES users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, date)  -- one submission per site per day
);

-- ─────────────────────────────────────────────
-- ROUTES
-- Delivery provider route assignments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_provider_id  UUID NOT NULL REFERENCES organizations(id),
  date                  DATE NOT NULL,
  -- stops is a JSON array of site IDs + expected delivery times
  stops                 JSONB NOT NULL DEFAULT '[]',
  status                VARCHAR(50) NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- KITCHEN ↔ SITE CONNECTIONS
-- Coordinator-approved relationships between kitchens and the sites they serve
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_site_connections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id    UUID NOT NULL REFERENCES organizations(id),
  site_id       UUID NOT NULL REFERENCES organizations(id),
  status        VARCHAR(50) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'ended')),
  approved_by   UUID REFERENCES users(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kitchen_id, site_id)
);

-- ─────────────────────────────────────────────
-- INDEXES for common query patterns
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_orgs_sponsor ON organizations(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_orgs_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_applications_org ON applications(org_id);
CREATE INDEX IF NOT EXISTS idx_applications_sponsor ON applications(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_expires ON documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_meal_counts_site_date ON meal_counts(site_id, date);
CREATE INDEX IF NOT EXISTS idx_routes_provider_date ON routes(delivery_provider_id, date);

-- Add any missing columns to existing tables (safe to run multiple times)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Expand documents.status to include 'requested' and 'superseded'
-- (needed for the compliance document-request workflow)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('valid', 'expiring_soon', 'expired', 'rejected', 'pending_review', 'requested', 'superseded'));
