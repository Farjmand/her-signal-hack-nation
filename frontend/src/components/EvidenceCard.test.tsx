import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EvidenceCard } from "@/components/EvidenceCard"
import type { EvidenceCapsule, PopulationContext } from "@/lib/types"

const baseCapsule: EvidenceCapsule = {
  event_id: "evt-1",
  reported_at: "2026-01-01T00:00:00.000Z",
  source_text: "I felt bloated and tired today.",
  symptoms: ["bloating"],
  severity: "medium",
  duration: null,
  functional_impact: "none reported",
  sleep_hours: null,
  cycle_context: null,
  hormone_therapy_or_contraception_context: null,
  wearable_context: null,
  ai_confidence: 0.8,
  needs_review: [],
  user_verified: true,
  consent_scope: []
}

const populationContext: PopulationContext = {
  ageBand: "43-47",
  n: 191,
  distribution: { premenopausal: 0.77, postmenopausal: 0.22, perimenopausal_indeterminate: 0.01 },
  source: "NHANES 2017-2018 national survey (RHQ_J + DEMO_J)",
  disclaimer: "Population-level statistics from a real national survey -- not clinical validation, not a diagnosis, and not a prediction about any individual."
}

describe("EvidenceCard population context", () => {
  it("renders normally with no population context blurb when none is provided", () => {
    render(<EvidenceCard capsule={baseCapsule} />)
    expect(screen.getByText("bloating")).toBeInTheDocument()
    expect(screen.queryByText(/NHANES/i)).not.toBeInTheDocument()
  })

  it("shows the age-band population context when provided, framed as general (not symptom-specific)", () => {
    render(<EvidenceCard capsule={baseCapsule} populationContext={populationContext} />)
    expect(screen.getByText(/43-47/)).toBeInTheDocument()
    expect(screen.getByText(/premenopausal/i)).toBeInTheDocument()
    // Must not claim the population stat is specifically about "bloating" --
    // it's a general age-based reproductive-stage stat, not a symptom match.
    expect(screen.queryByText(/bloating.*NHANES|NHANES.*bloating/i)).not.toBeInTheDocument()
  })

  it("never claims to predict or diagnose the individual", () => {
    render(<EvidenceCard capsule={baseCapsule} populationContext={populationContext} />)
    expect(screen.getByText(/not a prediction about any individual/i)).toBeInTheDocument()
  })
})
