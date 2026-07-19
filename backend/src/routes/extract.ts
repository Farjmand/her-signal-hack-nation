import { randomUUID } from "node:crypto"
import { Router } from "express"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import type { EvidenceCapsule } from "../types.js"

export const extractRouter = Router()

// Lazily instantiated: constructing OpenAI() throws synchronously if
// OPENAI_API_KEY is missing. Since ES module imports execute before
// index.ts's own top-level code runs, a module-scope `new OpenAI()` here
// would crash the entire process on startup -- taking down /health and
// every other route -- if the key isn't configured, rather than failing
// only this endpoint on first use.
let openai: OpenAI | null = null
function getOpenAIClient(): OpenAI {
  openai ??= new OpenAI()
  return openai
}

const extractionFieldNames = [
  "symptoms",
  "severity",
  "duration",
  "functional_impact",
  "sleep_hours",
  "cycle_context",
  "hormone_therapy_or_contraception_context",
  "wearable_context"
] as const

const ExtractionSchema = z.object({
  symptoms: z.array(z.string()).describe(
    "Symptom(s) as the user described them, in their own words or lightly normalized. Never a diagnosis. Use ['none reported'] if the user reports feeling fine."
  ),
  severity: z.enum(["low", "medium", "high"]).describe(
    "The user's own characterization of intensity — not a clinical triage level."
  ),
  duration: z.string().nullable().describe("How long it lasted, in the user's own terms, or null if not mentioned."),
  functional_impact: z.string().describe(
    "What the user reported this disrupted in daily life, or 'none reported' if nothing was mentioned."
  ),
  sleep_hours: z.number().nullable().describe("Self-reported hours of sleep, or null if not mentioned."),
  cycle_context: z.string().nullable().describe("Self-reported menstrual cycle context, or null if not mentioned."),
  hormone_therapy_or_contraception_context: z
    .string()
    .nullable()
    .describe("Self-reported hormone therapy or contraception context, or null if not mentioned."),
  wearable_context: z.string().nullable().describe("Self-reported wearable/device data context, or null if not mentioned."),
  needs_review: z
    .array(z.enum(extractionFieldNames))
    .describe(
      "Field names to flag for user review because the note was hedging, vague, or ambiguous about them (e.g. 'not sure if', 'I guess', uncertain timing). Empty array if the note was clear."
    ),
  ai_confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall extraction confidence, 0 to 1, based on how clear and specific the note was.")
})

const SYSTEM_PROMPT = `You extract structured fields from a short first-person note about a symptom experience. You are not a medical professional and this is not a clinical tool.

Rules:
- Extract only what the user explicitly stated or clearly implied. Never diagnose, triage, assess risk, suggest treatment, or predict a medical condition.
- "severity" reflects the user's own characterization (their words, hedges, or self-rated scale), not a clinical judgment. As a calibration guide: "high" typically corresponds to a reported functional impact that disrupted a commitment (left work/school early, cancelled or missed plans, couldn't complete tasks) or explicit high self-rated intensity; "medium" to a manageable but noticeable disruption; "low" to mild or no disruption.
- If a field is not mentioned at all, use null (or "none reported" for functional_impact/symptoms when the user explicitly says nothing happened or they felt fine) — an unmentioned field is NOT ambiguous and must NOT be added to needs_review.
- Add a field's name to needs_review ONLY when the user gave information about that specific field but expressed hedging or uncertainty about it (e.g. "not sure if it's bad or just annoying", "I guess", "hard to say", "probably", "maybe" attached to that value). Do not flag a field just because it's short, null, or unmentioned — only flag it when the user's own words about that field signal doubt.
- ai_confidence should be lower when the note is short, vague, or hedging, and higher when it is specific and clear.
- Never output diagnostic labels, condition names as medical diagnoses, or risk/severity scores framed as clinical assessments — only the user's own reported experience.`

const RequestSchema = z.object({
  source_text: z.string().trim().min(1)
})

extractRouter.post("/", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "source_text is required and must be a non-empty string" })
    return
  }

  const { source_text } = parsed.data

  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: source_text }
      ],
      response_format: zodResponseFormat(ExtractionSchema, "evidence_extraction")
    })

    const extracted = completion.choices[0]?.message.parsed
    if (!extracted) {
      res.status(502).json({ error: "Extraction failed to produce structured output" })
      return
    }

    const capsule: EvidenceCapsule = {
      event_id: randomUUID(),
      reported_at: new Date().toISOString(),
      source_text,
      symptoms: extracted.symptoms,
      severity: extracted.severity,
      duration: extracted.duration,
      functional_impact: extracted.functional_impact,
      sleep_hours: extracted.sleep_hours,
      cycle_context: extracted.cycle_context,
      hormone_therapy_or_contraception_context: extracted.hormone_therapy_or_contraception_context,
      wearable_context: extracted.wearable_context,
      ai_confidence: extracted.ai_confidence,
      needs_review: extracted.needs_review,
      user_verified: false,
      consent_scope: []
    }

    res.status(200).json(capsule)
  } catch (err) {
    console.error("Extraction error:", err instanceof Error ? err.message : err)
    res.status(502).json({ error: "Extraction failed" })
  }
})
