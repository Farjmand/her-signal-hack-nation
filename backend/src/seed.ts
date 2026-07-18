import { randomUUID } from "node:crypto"
import { db } from "./db.js"
import type { EvidenceCapsule } from "./types.js"

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const seedCapsules: EvidenceCapsule[] = [
  {
    event_id: randomUUID(),
    reported_at: daysAgo(0),
    source_text: "I had sharp pelvic pain today, slept four hours, and had to leave work early.",
    symptoms: ["sharp pelvic pain"],
    severity: "high",
    duration: null,
    functional_impact: "left work early",
    sleep_hours: 4,
    cycle_context: null,
    hormone_therapy_or_contraception_context: null,
    wearable_context: null,
    ai_confidence: 0.9,
    needs_review: [],
    user_verified: true,
    consent_scope: []
  },
  {
    event_id: randomUUID(),
    reported_at: daysAgo(1),
    source_text:
      "Hot flashes on and off all day, maybe six or seven of them, had to step out of a client call twice to cool off.",
    symptoms: ["hot flashes"],
    severity: "medium",
    duration: "all day",
    functional_impact: "stepped out of a client call twice",
    sleep_hours: null,
    cycle_context: null,
    hormone_therapy_or_contraception_context: null,
    wearable_context: null,
    ai_confidence: 0.8,
    needs_review: [],
    user_verified: true,
    consent_scope: []
  },
  {
    event_id: randomUUID(),
    reported_at: daysAgo(3),
    source_text: "Breast tenderness the past two days, pretty mild, notice it mostly when I'm getting dressed.",
    symptoms: ["breast tenderness"],
    severity: "low",
    duration: "past two days",
    functional_impact: "none reported",
    sleep_hours: null,
    cycle_context: null,
    hormone_therapy_or_contraception_context: null,
    wearable_context: null,
    ai_confidence: 0.85,
    needs_review: [],
    user_verified: true,
    consent_scope: []
  },
  {
    event_id: randomUUID(),
    reported_at: daysAgo(5),
    source_text:
      "Started HRT patches two weeks ago. Today had some light bloating and breast tenderness, much milder than before I started treatment.",
    symptoms: ["bloating", "breast tenderness"],
    severity: "low",
    duration: null,
    functional_impact: "none reported",
    sleep_hours: null,
    cycle_context: null,
    hormone_therapy_or_contraception_context: "started HRT patches two weeks ago",
    wearable_context: null,
    ai_confidence: 0.82,
    needs_review: [],
    user_verified: true,
    consent_scope: []
  },
  {
    event_id: randomUUID(),
    reported_at: daysAgo(8),
    source_text:
      "Insomnia again, third night in a row, my sleep tracker says under 3 hours each night. Starting to really affect my focus at work.",
    symptoms: ["insomnia"],
    severity: "high",
    duration: "third consecutive night",
    functional_impact: "affecting focus at work",
    sleep_hours: 3,
    cycle_context: null,
    hormone_therapy_or_contraception_context: null,
    wearable_context: "sleep tracker recorded under 3 hours nightly",
    ai_confidence: 0.88,
    needs_review: [],
    user_verified: true,
    consent_scope: []
  }
]

const insert = db.prepare(
  `INSERT OR IGNORE INTO evidence_capsules (
    event_id, reported_at, source_text, symptoms, severity, duration,
    functional_impact, sleep_hours, cycle_context,
    hormone_therapy_or_contraception_context, wearable_context,
    ai_confidence, needs_review, user_verified, consent_scope
  ) VALUES (@event_id, @reported_at, @source_text, @symptoms, @severity, @duration,
    @functional_impact, @sleep_hours, @cycle_context,
    @hormone_therapy_or_contraception_context, @wearable_context,
    @ai_confidence, @needs_review, @user_verified, @consent_scope)`
)

const insertMany = db.transaction((capsules: EvidenceCapsule[]) => {
  for (const c of capsules) {
    insert.run({
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
  }
})

insertMany(seedCapsules)
console.log(`Seeded ${seedCapsules.length} demo evidence capsules.`)
