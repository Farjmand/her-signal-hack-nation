import type { ConsentReceipt, EvidenceCapsule } from "@/lib/types"

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
  const grantedFields = receipt.fields.filter((f) => f.granted).map((f) => f.field)

  const records = await Promise.all(
    capsules
      .filter((c) => c.user_verified)
      .map(async (capsule) => {
        const record: Record<string, unknown> = {
          research_id: await hashEventId(capsule.event_id)
        }
        for (const field of grantedFields) {
          record[field] = (capsule as unknown as Record<string, unknown>)[field]
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
