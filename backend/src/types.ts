/**
 * Stub types mirroring schema/evidence-capsule.schema.json and
 * schema/consent-receipt.schema.json. Finalized in Phase 1 once those
 * schemas are locked; kept here as the single TS source of truth so
 * frontend and backend import the same shape.
 */

export type Severity = "low" | "medium" | "high"

export interface EvidenceCapsule {
  event_id: string
  reported_at: string
  source_text: string
  symptoms: string[]
  severity: Severity
  duration: string
  functional_impact: string
  sleep_hours: number | null
  cycle_context: string | null
  hormone_therapy_or_contraception_context: string | null
  wearable_context: string | null
  ai_confidence: number
  needs_review: string[]
  user_verified: boolean
  consent_scope: string[]
}

export interface ConsentReceiptFieldDecision {
  field: string
  granted: boolean
}

export interface ConsentReceipt {
  receipt_id: string
  study_id: string
  study_name: string
  purpose: string
  recipient: string
  fields: ConsentReceiptFieldDecision[]
  timestamp: string
  schema_version: string
  revoked: boolean
  revoked_at: string | null
}
