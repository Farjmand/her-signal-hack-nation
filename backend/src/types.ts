/**
 * Mirrors schema/evidence-capsule.schema.json and
 * schema/consent-receipt.schema.json (finalized in Phase 1). Kept as the
 * single TS source of truth on the backend side; frontend/src/lib/types.ts
 * mirrors it by hand since the two are separate npm packages.
 */

export type Severity = "low" | "medium" | "high"

export type EvidenceCapsuleFieldName =
  | "symptoms"
  | "severity"
  | "duration"
  | "functional_impact"
  | "sleep_hours"
  | "cycle_context"
  | "hormone_therapy_or_contraception_context"
  | "wearable_context"

export interface EvidenceCapsule {
  event_id: string
  reported_at: string
  source_text: string
  symptoms: string[]
  severity: Severity
  duration: string | null
  functional_impact: string
  sleep_hours: number | null
  cycle_context: string | null
  hormone_therapy_or_contraception_context: string | null
  wearable_context: string | null
  ai_confidence: number
  needs_review: EvidenceCapsuleFieldName[]
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
