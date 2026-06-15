-- ROC Consulting — D1 schema
-- Run this in the Cloudflare D1 Console for your roc-contacts database

CREATE TABLE IF NOT EXISTS enquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  organisation  TEXT,
  message       TEXT    NOT NULL,
  submitted_at  TEXT    NOT NULL
);

-- Optional: index for browsing by date
CREATE INDEX IF NOT EXISTS idx_submitted_at ON enquiries (submitted_at DESC);
