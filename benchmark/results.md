# HerSignal Extraction Benchmark Results

**Synthetic, preliminary extraction benchmark — not clinical validation.**

Generated: 2026-07-18T23:58:56.824Z
Examples evaluated: 24
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
| Exact-match rate (symptom set identical to expected) | 79.2% |
| Mean precision | 81.3% |
| Mean recall | 83.3% |

## Field accuracy

| Field | Accuracy |
| --- | --- |
| Severity (exact match to expected label) | 66.7% |
| Functional impact (semantic/substring match) | 62.5% |

## Ambiguity flagging (needs_review)

6 of 24 examples were hand-labeled as ambiguous (hedging language, uncertain timing, vague symptom naming).

| Metric | Value |
| --- | --- |
| Ambiguity recall (ambiguous examples correctly flagged) | 100.0% |
| False positive rate (clear examples incorrectly flagged) | 5.6% |

## User correction rate

Not yet measured — this requires real usage data (comparing AI-extracted
values to what users actually edited before accepting). Not available from a
synthetic benchmark; would be computed from the app's Review screen once in
real use.

## Per-example results

| File | Symptom P | Symptom R | Exact | Severity | Impact | Expected ambiguous | Flagged ambiguous |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01.json | 1.00 | 1.00 | yes | yes | no | no | no |
| 02.json | 1.00 | 1.00 | yes | no | no | no | no |
| 03.json | 1.00 | 1.00 | yes | yes | yes | no | no |
| 04.json | 1.00 | 1.00 | yes | no | yes | no | no |
| 05.json | 0.00 | 0.00 | no | no | yes | no | no |
| 06.json | 1.00 | 1.00 | yes | yes | yes | yes | yes |
| 07.json | 1.00 | 1.00 | yes | yes | no | no | no |
| 08.json | 1.00 | 1.00 | yes | yes | yes | yes | yes |
| 09.json | 1.00 | 1.00 | yes | no | no | no | no |
| 10.json | 1.00 | 1.00 | yes | no | yes | no | no |
| 11.json | 0.00 | 0.00 | no | yes | yes | yes | yes |
| 12.json | 0.50 | 1.00 | no | no | yes | no | no |
| 13.json | 1.00 | 1.00 | yes | yes | no | no | no |
| 14.json | 1.00 | 1.00 | yes | yes | yes | no | no |
| 15.json | 0.00 | 0.00 | no | yes | no | no | no |
| 16.json | 0.00 | 0.00 | no | no | yes | yes | yes |
| 17.json | 1.00 | 1.00 | yes | yes | yes | no | no |
| 18.json | 1.00 | 1.00 | yes | yes | no | no | no |
| 19.json | 1.00 | 1.00 | yes | yes | yes | yes | yes |
| 20.json | 1.00 | 1.00 | yes | yes | no | no | no |
| 21.json | 1.00 | 1.00 | yes | no | yes | yes | yes |
| 22.json | 1.00 | 1.00 | yes | yes | yes | no | no |
| 23.json | 1.00 | 1.00 | yes | yes | yes | no | no |
| 24.json | 1.00 | 1.00 | yes | yes | no | no | yes |
