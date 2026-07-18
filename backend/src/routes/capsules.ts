import { Router } from "express"
import { z } from "zod"
import { db } from "../db.js"
import type { EvidenceCapsule } from "../types.js"

export const capsulesRouter = Router()

const CapsuleSchema = z.object({
  event_id: z.string().min(1),
  reported_at: z.string().min(1),
  source_text: z.string().min(1),
  symptoms: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
  duration: z.string().nullable(),
  functional_impact: z.string(),
  sleep_hours: z.number().nullable(),
  cycle_context: z.string().nullable(),
  hormone_therapy_or_contraception_context: z.string().nullable(),
  wearable_context: z.string().nullable(),
  ai_confidence: z.number().min(0).max(1),
  needs_review: z.array(z.string()),
  user_verified: z.boolean(),
  consent_scope: z.array(z.string())
})

interface CapsuleRow {
  event_id: string
  reported_at: string
  source_text: string
  symptoms: string
  severity: string
  duration: string | null
  functional_impact: string
  sleep_hours: number | null
  cycle_context: string | null
  hormone_therapy_or_contraception_context: string | null
  wearable_context: string | null
  ai_confidence: number
  needs_review: string
  user_verified: number
  consent_scope: string
}

function rowToCapsule(row: CapsuleRow): EvidenceCapsule {
  return {
    event_id: row.event_id,
    reported_at: row.reported_at,
    source_text: row.source_text,
    symptoms: JSON.parse(row.symptoms),
    severity: row.severity as EvidenceCapsule["severity"],
    duration: row.duration,
    functional_impact: row.functional_impact,
    sleep_hours: row.sleep_hours,
    cycle_context: row.cycle_context,
    hormone_therapy_or_contraception_context: row.hormone_therapy_or_contraception_context,
    wearable_context: row.wearable_context,
    ai_confidence: row.ai_confidence,
    needs_review: JSON.parse(row.needs_review),
    user_verified: Boolean(row.user_verified),
    consent_scope: JSON.parse(row.consent_scope)
  }
}

capsulesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM evidence_capsules ORDER BY created_at DESC")
    .all() as CapsuleRow[]
  res.status(200).json(rows.map(rowToCapsule))
})

capsulesRouter.post("/", (req, res) => {
  const parsed = CapsuleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid capsule", details: z.flattenError(parsed.error) })
    return
  }

  const c = parsed.data

  if (!c.user_verified) {
    res.status(400).json({ error: "Capsule must be user_verified to be saved" })
    return
  }

  db.prepare(
    `INSERT INTO evidence_capsules (
      event_id, reported_at, source_text, symptoms, severity, duration,
      functional_impact, sleep_hours, cycle_context,
      hormone_therapy_or_contraception_context, wearable_context,
      ai_confidence, needs_review, user_verified, consent_scope
    ) VALUES (@event_id, @reported_at, @source_text, @symptoms, @severity, @duration,
      @functional_impact, @sleep_hours, @cycle_context,
      @hormone_therapy_or_contraception_context, @wearable_context,
      @ai_confidence, @needs_review, @user_verified, @consent_scope)
    ON CONFLICT(event_id) DO UPDATE SET
      symptoms = excluded.symptoms,
      severity = excluded.severity,
      duration = excluded.duration,
      functional_impact = excluded.functional_impact,
      sleep_hours = excluded.sleep_hours,
      cycle_context = excluded.cycle_context,
      hormone_therapy_or_contraception_context = excluded.hormone_therapy_or_contraception_context,
      wearable_context = excluded.wearable_context,
      ai_confidence = excluded.ai_confidence,
      needs_review = excluded.needs_review,
      user_verified = excluded.user_verified,
      consent_scope = excluded.consent_scope`
  ).run({
    event_id: c.event_id,
    reported_at: c.reported_at,
    source_text: c.source_text,
    symptoms: JSON.stringify(c.symptoms),
    severity: c.severity,
    duration: c.duration,
    functional_impact: c.functional_impact,
    sleep_hours: c.sleep_hours,
    cycle_context: c.cycle_context,
    hormone_therapy_or_contraception_context: c.hormone_therapy_or_contraception_context,
    wearable_context: c.wearable_context,
    ai_confidence: c.ai_confidence,
    needs_review: JSON.stringify(c.needs_review),
    user_verified: c.user_verified ? 1 : 0,
    consent_scope: JSON.stringify(c.consent_scope)
  })

  res.status(201).json(c)
})
