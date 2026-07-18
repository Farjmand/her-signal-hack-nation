/**
 * Runs every examples/*.json note through the live POST /api/extract endpoint
 * and compares the result to that example's `expected` block. Requires the
 * backend to be running (npm run dev in backend/) with a valid OPENAI_API_KEY.
 *
 * This is a narrow evaluation of the extraction task only (note -> structured
 * fields). It is a synthetic, preliminary benchmark, not clinical validation.
 */
import fs from "node:fs"
import path from "node:path"

const API_URL = process.env.BENCHMARK_API_URL ?? "http://localhost:4000"
const examplesDir = path.resolve(import.meta.dirname, "../examples")
const outPath = path.resolve(import.meta.dirname, "results.md")

interface ExpectedCapsule {
  symptoms: string[]
  severity: "low" | "medium" | "high"
  functional_impact: string
  needs_review: string[]
}

interface ExampleFile {
  source_text: string
  expected: ExpectedCapsule
  notes?: string
}

interface ExtractedCapsule {
  symptoms: string[]
  severity: "low" | "medium" | "high"
  functional_impact: string
  needs_review: string[]
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

// Symptom names are free text ("pelvic pain" vs "sharp pelvic pain"), so exact
// string equality is too strict a bar. A pair counts as a match if one string
// contains the other after normalization.
function fuzzyContains(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a)
}

function symptomSetMetrics(expected: string[], actual: string[]) {
  const e = expected.map(normalize)
  const a = actual.map(normalize)

  const matchedExpected = e.filter((exp) => a.some((act) => fuzzyContains(exp, act)))
  const matchedActual = a.filter((act) => e.some((exp) => fuzzyContains(exp, act)))

  const precision = a.length === 0 ? 0 : matchedActual.length / a.length
  const recall = e.length === 0 ? 0 : matchedExpected.length / e.length
  const exactMatch = precision === 1 && recall === 1 && e.length === a.length
  return { precision, recall, exactMatch }
}

function functionalImpactMatch(expected: string, actual: string): boolean {
  const e = normalize(expected)
  const a = normalize(actual)
  if (e === a) return true
  if (e === "none reported" || a === "none reported") return e === a
  return e.includes(a) || a.includes(e)
}

async function extract(sourceText: string): Promise<ExtractedCapsule> {
  const res = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_text: sourceText })
  })
  if (!res.ok) throw new Error(`Extraction failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const files = fs
    .readdirSync(examplesDir)
    .filter((f) => f.endsWith(".json"))
    .sort()

  const results: {
    file: string
    precision: number
    recall: number
    symptomsExact: boolean
    severityMatch: boolean
    functionalImpactMatch: boolean
    expectedAmbiguous: boolean
    flaggedAmbiguous: boolean
  }[] = []

  for (const file of files) {
    const example: ExampleFile = JSON.parse(fs.readFileSync(path.join(examplesDir, file), "utf-8"))
    const extracted = await extract(example.source_text)

    const symptomMetrics = symptomSetMetrics(example.expected.symptoms, extracted.symptoms)
    const severityMatch = example.expected.severity === extracted.severity
    const impactMatch = functionalImpactMatch(example.expected.functional_impact, extracted.functional_impact)
    const expectedAmbiguous = example.expected.needs_review.length > 0
    const flaggedAmbiguous = extracted.needs_review.length > 0

    results.push({
      file,
      precision: symptomMetrics.precision,
      recall: symptomMetrics.recall,
      symptomsExact: symptomMetrics.exactMatch,
      severityMatch,
      functionalImpactMatch: impactMatch,
      expectedAmbiguous,
      flaggedAmbiguous
    })

    console.log(`${file}: symptoms P=${symptomMetrics.precision.toFixed(2)} R=${symptomMetrics.recall.toFixed(2)} exact=${symptomMetrics.exactMatch} severity=${severityMatch} impact=${impactMatch}`)
  }

  const n = results.length
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

  const symptomExactMatchRate = results.filter((r) => r.symptomsExact).length / n
  const symptomPrecision = avg(results.map((r) => r.precision))
  const symptomRecall = avg(results.map((r) => r.recall))
  const severityAccuracy = results.filter((r) => r.severityMatch).length / n
  const functionalImpactAccuracy = results.filter((r) => r.functionalImpactMatch).length / n

  const ambiguousExamples = results.filter((r) => r.expectedAmbiguous)
  const clearExamples = results.filter((r) => !r.expectedAmbiguous)
  const ambiguityRecall =
    ambiguousExamples.length === 0
      ? null
      : ambiguousExamples.filter((r) => r.flaggedAmbiguous).length / ambiguousExamples.length
  const falsePositiveRate =
    clearExamples.length === 0
      ? null
      : clearExamples.filter((r) => r.flaggedAmbiguous).length / clearExamples.length

  const timestamp = new Date().toISOString()

  const md = `# HerSignal Extraction Benchmark Results

**Synthetic, preliminary extraction benchmark — not clinical validation.**

Generated: ${timestamp}
Examples evaluated: ${n}
Model: gpt-4o-mini (via POST /api/extract)

This benchmark evaluates only the narrow AI task of converting a symptom note
into structured fields. It does not assess diagnostic accuracy, clinical
validity, or real-world generalization — the input notes are synthetic and
hand-written, not sourced from real patients.

## Symptom extraction

Symptom matching uses case-insensitive substring containment (e.g. "pelvic
pain" matches "sharp pelvic pain") rather than exact string equality, since
symptom names are free text. This still under-counts genuine matches that use
a different word form than the hand-written expected label (e.g. model output
"dizzy" vs expected "dizziness", or "irritable" vs "irritability") — those
register as misses here even though a human reviewer would likely accept
them. The numbers below are therefore a conservative lower bound on symptom
extraction quality, not a precise measurement.

| Metric | Value |
| --- | --- |
| Exact-match rate (symptom set identical to expected) | ${(symptomExactMatchRate * 100).toFixed(1)}% |
| Mean precision | ${(symptomPrecision * 100).toFixed(1)}% |
| Mean recall | ${(symptomRecall * 100).toFixed(1)}% |

## Field accuracy

| Field | Accuracy |
| --- | --- |
| Severity (exact match to expected label) | ${(severityAccuracy * 100).toFixed(1)}% |
| Functional impact (semantic/substring match) | ${(functionalImpactAccuracy * 100).toFixed(1)}% |

## Ambiguity flagging (needs_review)

${ambiguousExamples.length} of ${n} examples were hand-labeled as ambiguous (hedging language, uncertain timing, vague symptom naming).

| Metric | Value |
| --- | --- |
| Ambiguity recall (ambiguous examples correctly flagged) | ${ambiguityRecall === null ? "n/a" : (ambiguityRecall * 100).toFixed(1) + "%"} |
| False positive rate (clear examples incorrectly flagged) | ${falsePositiveRate === null ? "n/a" : (falsePositiveRate * 100).toFixed(1) + "%"} |

## User correction rate

Not yet measured — this requires real usage data (comparing AI-extracted
values to what users actually edited before accepting). Not available from a
synthetic benchmark; would be computed from the app's Review screen once in
real use.

## Per-example results

| File | Symptom P | Symptom R | Exact | Severity | Impact | Expected ambiguous | Flagged ambiguous |
| --- | --- | --- | --- | --- | --- | --- | --- |
${results
  .map(
    (r) =>
      `| ${r.file} | ${r.precision.toFixed(2)} | ${r.recall.toFixed(2)} | ${r.symptomsExact ? "yes" : "no"} | ${r.severityMatch ? "yes" : "no"} | ${r.functionalImpactMatch ? "yes" : "no"} | ${r.expectedAmbiguous ? "yes" : "no"} | ${r.flaggedAmbiguous ? "yes" : "no"} |`
  )
  .join("\n")}
`

  fs.writeFileSync(outPath, md)
  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
