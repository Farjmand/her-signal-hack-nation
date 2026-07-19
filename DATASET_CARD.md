# Dataset Card: HerSignal Synthetic Extraction Examples

This card describes the dataset in `examples/` — 24 synthetic symptom notes
used to evaluate the `POST /api/extract` structured-extraction endpoint (see
`benchmark/run.ts` and `benchmark/results.md`).

## Summary

- **What it is:** 24 short, first-person, hand-written text notes describing
  a hormonal/menstrual-health symptom experience, each paired with a
  hand-labeled `expected` structured extraction (symptoms, severity,
  duration, functional impact, sleep hours, cycle/hormone context, and which
  fields should be flagged `needs_review`).
- **What it is not:** real patient data, clinically validated labels, or a
  representative sample of any real population's symptom reporting.
- **Intended use:** evaluating and iterating on the AI extraction prompt/logic
  in `backend/src/routes/extract.ts` — i.e. "does the model turn this note
  into reasonable structured fields." Not intended for training a production
  model, clinical research, or any use that treats the labels as ground
  truth about real symptom prevalence or severity.

## Provenance

Every note and its expected label were **hand-written by the project author**
for this hackathon project, in a single sitting, aiming to cover a range of
symptom types (pelvic pain, migraines, hot flashes, insomnia, mood changes,
hormone therapy/contraception context, etc.) and two structural cases:

- **Clear-cut notes** (18 of 24): specific, unhedged language where a
  confident structured extraction is expected and `needs_review` should stay
  empty.
- **Deliberately ambiguous notes** (6 of 24): notes containing hedging
  language ("not sure if...", "I guess", "hard to say"), uncertain timing, or
  vague symptom naming, written specifically to test whether the extraction
  correctly flags uncertainty via `needs_review` rather than silently
  resolving it.

No real user data, clinical records, or scraped text was used in any way.

## Structure

Each `examples/NN.json` file has the shape:

```json
{
  "source_text": "the synthetic note, first-person",
  "expected": {
    "symptoms": ["..."],
    "severity": "low | medium | high",
    "duration": "string or null",
    "functional_impact": "string",
    "sleep_hours": "number or null",
    "cycle_context": "string or null",
    "hormone_therapy_or_contraception_context": "string or null",
    "wearable_context": "string or null",
    "needs_review": ["field names flagged as ambiguous, if any"]
  },
  "notes": "optional: why this example was written this way"
}
```

`expected` intentionally omits `event_id`, `reported_at`, `source_text`
duplication, `ai_confidence`, `user_verified`, and `consent_scope` — those
are assigned at capture/review time, not part of what the extraction model
should predict from the note text alone. `examples/validate.ts` checks every
file's `expected` block against a derived subset of
`schema/evidence-capsule.schema.json`.

## Known limitations

- **Small sample (n=24).** Not statistically powered to make strong claims
  about extraction accuracy — see `benchmark/results.md` for point estimates
  with that caveat repeated throughout.
- **Single author, single writing session.** Real symptom notes from real
  people will vary far more in vocabulary, structure, length, and cultural
  framing than this dataset captures. This dataset cannot and should not
  stand in for that diversity.
- **English only, US-idiomatic phrasing.**
- **Labels reflect one reasonable reading, not ground truth.** The `expected`
  block for each note is the author's own judgment call about a fair
  extraction — including free-text fields like `symptoms` and
  `functional_impact`, where a different equally-valid word choice (e.g.
  "dizzy" vs "dizziness") would score as a mismatch under the benchmark's
  substring-matching metric even though it's a legitimate extraction. See
  `benchmark/results.md`'s methodology note.
- **No demographic, geographic, or clinical metadata** — by design, since
  none of this represents real people.

## License

Released under the same license as the rest of this repository (Apache-2.0).
Free to use for evaluating symptom-extraction prompts/models; not to be
represented as real-world symptom data in any downstream use.
