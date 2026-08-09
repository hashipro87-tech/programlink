-- Document Intelligence columns
-- Run in Railway query editor

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS verification_result  TEXT,
  ADD COLUMN IF NOT EXISTS detected_type        TEXT,
  ADD COLUMN IF NOT EXISTS confidence           NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS verification_reason  TEXT;

-- Optional check constraint
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_verification_result_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_verification_result_check
    CHECK (verification_result IN ('verified', 'needs_review', 'wrong_document') OR verification_result IS NULL);
