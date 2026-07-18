import type { EvidenceCapsuleFieldName } from "@/lib/types"

export type ShareableField = EvidenceCapsuleFieldName | "source_text"

export const MOCK_STUDY = {
  study_id: "hormonal-symptom-patterns-2026",
  study_name: "Hormonal Symptom Patterns Study",
  purpose:
    "Researching how self-reported hormonal symptoms relate to daily functional impact, to improve understanding of symptom burden across the menstrual and hormone-therapy lifecycle.",
  recipient: "HerSignal Research Consortium (fictional, demo only)",
  requested_fields: [
    "symptoms",
    "severity",
    "duration",
    "functional_impact",
    "sleep_hours",
    "cycle_context",
    "hormone_therapy_or_contraception_context"
  ] as ShareableField[]
}

export const FIELD_LABELS: Record<ShareableField, string> = {
  symptoms: "Symptoms",
  severity: "Severity",
  duration: "Duration",
  functional_impact: "Functional impact",
  sleep_hours: "Sleep hours",
  cycle_context: "Cycle context",
  hormone_therapy_or_contraception_context: "Hormone therapy / contraception context",
  wearable_context: "Wearable context",
  source_text: "Original note text"
}
