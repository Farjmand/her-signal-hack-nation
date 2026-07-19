import type { ConsentReceipt, EvidenceCapsule, EvidenceCapsuleFieldName } from "@/lib/types"

/**
 * Prototype de-identification only — see README/docs for the "de-identification
 * prototype, not a compliance claim" framing. research_id is a one-way hash of
 * event_id so the same entry produces a stable id across re-exports without
 * exposing the original event_id.
 */
async function hashEventId(eventId: string): Promise<string> {
  const data = new TextEncoder().encode(eventId)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
}

// Defense in depth: source_text, event_id, and ai_confidence must never leave
// this function, no matter what a consent receipt's `fields` array contains
// (that array is free-text and not validated against this list upstream).
// This allowlist is the actual enforcement point for "we never share your
// original note" — not the mock study config, which could change.
const EXPORTABLE_FIELDS: readonly EvidenceCapsuleFieldName[] = [
  "symptoms",
  "severity",
  "duration",
  "functional_impact",
  "sleep_hours",
  "cycle_context",
  "hormone_therapy_or_contraception_context",
  "wearable_context"
]

export interface ResearchBundle {
  study_id: string
  study_name: string
  generated_at: string
  fields_included: string[]
  record_count: number
  records: Record<string, unknown>[]
}

export async function buildResearchBundle(
  receipt: ConsentReceipt,
  capsules: EvidenceCapsule[]
): Promise<ResearchBundle> {
  if (receipt.revoked) {
    throw new Error("Cannot export: this consent has been revoked.")
  }

  const grantedFields = receipt.fields
    .filter((f) => f.granted)
    .map((f) => f.field)
    .filter((field): field is EvidenceCapsuleFieldName =>
      (EXPORTABLE_FIELDS as string[]).includes(field)
    )

  const records = await Promise.all(
    capsules
      .filter((c) => c.user_verified)
      .map(async (capsule) => {
        const record: Record<string, unknown> = {
          research_id: await hashEventId(capsule.event_id)
        }
        for (const field of grantedFields) {
          record[field] = capsule[field]
        }
        return record
      })
  )

  return {
    study_id: receipt.study_id,
    study_name: receipt.study_name,
    generated_at: new Date().toISOString(),
    fields_included: grantedFields,
    record_count: records.length,
    records
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
