# HerSignal MVP — Task List

## Phase 0 — Scaffolding
- [ ] 0.1 Frontend scaffold (Vite + React + TS + Tailwind + shadcn/ui)
- [ ] 0.2 Backend scaffold (Express + TS + better-sqlite3 + openai SDK + zod), `.env.example`, `GET /health`, DB tables
- [ ] 0.3 Shared `EvidenceCapsule` / `ConsentReceipt` TS type stubs

## Phase 1 — Schema + synthetic data (Checkpoint A: review before Phase 2)
- [ ] 1.1 `schema/evidence-capsule.schema.json`
- [ ] 1.2 `schema/consent-receipt.schema.json`
- [ ] 1.3 20-30 synthetic examples in `examples/` with `expected` labels (incl. ambiguous cases)

## Phase 2 — Capture → Extract → Review
- [ ] 2.1 `POST /api/extract` (OpenAI structured output, extraction-only system prompt)
- [ ] 2.2 `CaptureScreen`
- [ ] 2.3 `ReviewScreen` (editable, confidence, needs_review, explicit accept → persist)
- [ ] **Checkpoint B** — demo capture→extract→review end-to-end with real OpenAI call

## Phase 3 — Evidence card + Timeline
- [ ] 3.1 Evidence card component
- [ ] 3.2 `EvidenceTimeline` + seed script (3-5 demo entries)

## Phase 4 — Consent → Export
- [ ] 4.1 Mock study + `ConsentScreen` (per-category toggles, nothing pre-checked)
- [ ] 4.2 Consent persistence + revoke endpoint
- [ ] 4.3 `ExportScreen` — de-identified bundle + consent receipt, schema-validated
- [ ] **Checkpoint C** — walk full flow capture→review→timeline→consent→export in browser

## Phase 5 — Benchmark (parallelizable with Phase 3/4 after 2.1 lands)
- [ ] 5.1 `benchmark/run.ts` + `benchmark/results.md` (exact-match/precision/recall, severity/impact accuracy, ambiguity-flagging rate; explicit "not clinical validation" disclaimer)

## Phase 6 — Docs + polish
- [ ] 6.1 `docs/fhir-omop-mapping.md`
- [ ] 6.2 `DATASET_CARD.md`
- [ ] 6.3 `README.md` (setup, safety boundaries, demo narrative)
- [ ] 6.4 License decision: MIT (current) vs Apache-2.0 (spec) — ask user, don't silently change
- [ ] **Checkpoint D** — run `/agent-skills:ship`, fix flagged issues

## Notes / open decisions surfaced during planning
- No `SPEC.md` existed in-repo; plan is derived from the conversation spec.
- LICENSE is currently MIT; spec text says Apache-2.0 — needs explicit user call before Task 6.4.
