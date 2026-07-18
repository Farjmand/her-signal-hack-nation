import path from "node:path"
import fs from "node:fs"
import Database from "better-sqlite3"

const dataDir = path.resolve(import.meta.dirname, "../data")
fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, "hersignal.db"))
db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_capsules (
    event_id TEXT PRIMARY KEY,
    reported_at TEXT NOT NULL,
    source_text TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    severity TEXT NOT NULL,
    duration TEXT,
    functional_impact TEXT,
    sleep_hours REAL,
    cycle_context TEXT,
    hormone_therapy_or_contraception_context TEXT,
    wearable_context TEXT,
    ai_confidence REAL NOT NULL,
    needs_review TEXT NOT NULL,
    user_verified INTEGER NOT NULL DEFAULT 0,
    consent_scope TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consent_events (
    receipt_id TEXT PRIMARY KEY,
    study_id TEXT NOT NULL,
    study_name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    recipient TEXT NOT NULL,
    fields TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    revoked_at TEXT
  );
`)
