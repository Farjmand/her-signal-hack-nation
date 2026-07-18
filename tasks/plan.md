# HerSignal MVP — Implementation Plan

## Source of truth
No `SPEC.md` exists in this repo yet. The authoritative spec is the concept doc the user
supplied in conversation (concept, MVP flow, schema fields, open scientific assets,
benchmark, safety boundaries, build order). This plan operationalizes that doc; it does not
change scope.

**Open decision for the user:** repo `LICENSE` is currently MIT; the spec calls for
Apache-2.0. Flagged in Phase 6 rather than silently swapped.

## Architecture

```
/
  frontend/          React + TypeScript + Vite + shadcn/ui
  backend/            Node + Express + TypeScript, SQLite (better-sqlite3), OpenAI SDK
  schema/             evidence-capsule.schema.json, consent-receipt.schema.json
  examples/           20-30 synthetic symptom notes + expected structured labels (JSON)
  benchmark/           eval script + results.md
  docs/               fhir-omop-mapping.md
  DATASET_CARD.md
  README.md
```

Frontend and backend are separate npm workspaces (or two sibling folders each with their own
package.json — simplest for a hackathon, avoids monorepo tooling overhead). Frontend talks to
backend only for: (a) `POST /api/extract` (OpenAI structured-output call), (b) CRUD on
evidence capsules, (c) consent state, (d) export bundle generation. SQLite file lives in
`backend/data/`.

Every AI-touched screen carries a persistent "Not medical advice — this records your
experience" banner (component-level, not per-page copy, so it can't be forgotten on a new
screen).

## Dependency graph

```
Phase 0  Scaffolding (frontend+backend skeletons, shared types)
   |
Phase 1  Schema + synthetic examples          (no dependency on app code)
   |
   +---------------------------+
   |                           |
Phase 2  Capture -> Extract API -> Review   Phase 5 can start once Phase 1 lands
   |                           (benchmark script only needs schema + examples,
Phase 3  Evidence card + Timeline             not the running app — parallelizable)
   |
Phase 4  Consent -> Export + receipt
   |
Phase 5  Benchmark script + results   (parallel-capable with Phase 2-4, needs Phase 1 only)
   |
Phase 6  Docs (README, DATASET_CARD, FHIR/OMOP mapping doc, license decision, demo script)
```

Phase 5 (benchmark) only depends on Phase 1 (schema + examples) and calls the same
`/api/extract` endpoint Phase 2 builds — so it can be built in parallel with Phase 3/4 by a
second workstream once Phase 2's extract endpoint exists. Flagged below as a parallelizable
task.

## Checkpoints
- **Checkpoint A** (after Phase 1): schema + examples reviewed before any UI is built on top
  of them — cheap to fix field names now, expensive after Review/Consent screens hard-code them.
- **Checkpoint B** (after Phase 2): capture→extract→review loop demoed end-to-end with a real
  OpenAI call before building Timeline/Consent/Export on top of the capsule shape.
- **Checkpoint C** (after Phase 4): full user flow (capture → review → timeline → consent →
  export) walked through in the browser before writing docs/demo narrative.
- **Checkpoint D** (end): `/agent-skills:ship` run for go/no-go.

---

## Phase 0 — Scaffolding

### Task 0.1 — Frontend scaffold
- `npm create vite@latest frontend -- --template react-ts`, install Tailwind + shadcn/ui, set
  up `src/lib/api.ts` fetch wrapper pointed at `VITE_API_URL`.
- **Acceptance:** `npm run dev` in `frontend/` serves a blank shadcn-styled page at localhost.
- **Verify:** run dev server, load in browser, confirm no console errors.

### Task 0.2 — Backend scaffold
- `backend/` with Express + TypeScript, `better-sqlite3`, `openai` SDK, `zod` for schema
  validation. `.env.example` with `OPENAI_API_KEY=`, `PORT=`.
- SQLite schema: `evidence_capsules` table (matches schema fields below), `consent_events`
  table (study id, fields granted, timestamp, revoked bool).
- **Acceptance:** `npm run dev` in `backend/` starts server, `GET /health` returns 200, DB file
  created on first run with both tables.
- **Verify:** `curl localhost:PORT/health`, inspect SQLite file with `sqlite3 .schema`.

### Task 0.3 — Shared type contract
- `backend/src/types.ts` (or a shared package) defining the `EvidenceCapsule` and
  `ConsentReceipt` TypeScript types 1:1 with the JSON Schemas from Phase 1 — written now as
  stubs, finalized once Phase 1 schema is locked.
- **Acceptance:** types compile; imported by both a backend route stub and a frontend stub
  without error.

*(Phase 0 has no external dependency and can run as its own workstream in parallel with Phase 1.)*

---

## Phase 1 — Schema + synthetic benchmark data
### Checkpoint A gate: do not proceed to Phase 2 until this is reviewed.

### Task 1.1 — `schema/evidence-capsule.schema.json`
Fields (from spec): `event_id`, `reported_at`, `source_text`, `symptoms[]`, `severity`,
`duration`, `functional_impact`, `sleep_hours`, `cycle_context`,
`hormone_therapy_or_contraception_context`, `wearable_context`, `ai_confidence`,
`user_verified`, `consent_scope`.
- Draft as JSON Schema (draft-07 or 2020-12), with per-field type, enum where applicable
  (e.g. `severity`: low/medium/high), and a `needs_review` boolean per uncertain field or a
  parallel `field_confidence` map.
- **Acceptance:** valid JSON Schema (lints with `ajv` CLI), covers every field in the spec,
  distinguishes required vs optional (e.g. `cycle_context`, `hormone_therapy_or_contraception_context`,
  `wearable_context` are optional).
- **Verify:** `npx ajv compile -s schema/evidence-capsule.schema.json`.

### Task 1.2 — `schema/consent-receipt.schema.json`
Fields: fields shared, purpose, recipient/study id, timestamp, schema version, revocation
status, consent scope granted vs declined per category.
- **Acceptance/Verify:** same ajv-compiles bar as 1.1.

### Task 1.3 — 20-30 synthetic examples with expected labels
- `examples/NNN.json`: `{ source_text, expected: <EvidenceCapsule fields minus event_id/timestamps> }`.
- Cover: clear-cut cases, ambiguous severity, missing sleep data, multiple symptoms in one
  note, cases that should trigger `needs_review`.
- **Acceptance:** 20-30 files, each validates against `evidence-capsule.schema.json`'s
  `expected`-relevant subset, at least 4 examples deliberately ambiguous (for the benchmark's
  "correctly flagged for review" metric).
- **Verify:** small validation script (`examples/validate.ts`) run once at the end of the task.

---

## Phase 2 — Capture → Extract → Review
*(Depends on Phase 1 schema being locked; depends on Phase 0 scaffolds.)*

### Task 2.1 — `POST /api/extract` backend endpoint
- Takes `{ source_text }`, calls OpenAI with structured output (`response_format: json_schema`)
  constrained to `evidence-capsule.schema.json`, returns capsule with `ai_confidence` and
  per-field `needs_review` flags, `user_verified: false`.
- System prompt explicitly forbids diagnosis/triage/risk language — extraction only.
- **Acceptance:** given a sample note, returns valid JSON matching schema; malformed/empty
  input returns 400.
- **Verify:** `curl -X POST localhost:PORT/api/extract -d '{"source_text":"..."}'` against 3
  examples from Phase 1.3, manually diff against `expected`.

### Task 2.2 — `CaptureScreen`
- Textarea + submit, "not medical advice" banner, loading state while extract call is in
  flight, error state on failure.
- **Acceptance:** submitting text navigates to Review with the returned capsule.
- **Verify:** manual browser test — type a note, submit, confirm loading→review transition.

### Task 2.3 — `ReviewScreen`
- Editable fields for every capsule field, confidence indicator per field, source text shown
  alongside, fields flagged `needs_review` visually distinct, explicit "Accept" action that
  sets `user_verified: true` and persists to backend (`POST /api/capsules`).
- Nothing is saved as "final" without this explicit accept step (core safety requirement).
- **Acceptance:** editing a field and accepting persists the edited value, not the raw AI
  output; capsule appears in DB with `user_verified: true`.
- **Verify:** edit a field in-browser, accept, `sqlite3` query confirms edited value stored.

**Checkpoint B:** walk capture → extract (real OpenAI call) → review → accept end-to-end
before continuing.

---

## Phase 3 — Evidence card + Timeline
*(Depends on Phase 2's persisted capsule shape.)*

### Task 3.1 — Evidence card component
- Renders one capsule: symptom(s), date, severity, functional impact, sleep, optional
  cycle/hormone context, "user verified" badge.
- **Acceptance:** renders correctly for a capsule with all fields populated and one with only
  required fields.

### Task 3.2 — `EvidenceTimeline`
- Lists capsules newest-first from `GET /api/capsules`; seed 3-5 demo capsules via a seed
  script (`backend/src/seed.ts`) so the timeline isn't empty on first run.
- **Acceptance:** timeline shows seeded + newly captured entries in correct order.
- **Verify:** run seed script, load timeline in browser, capture one new entry, confirm it
  appears at top.

---

## Phase 4 — Consent → Export
*(Depends on Phase 2/3 capsule data existing.)*

### Task 4.1 — Mock study definition + `ConsentScreen`
- Hardcoded mock study object: name, requesting org, purpose, list of requested field
  categories (e.g. symptoms, severity, cycle_context — NOT source_text by default, modeling
  purpose limitation).
- Per-category toggle (approve/decline), nothing pre-checked.
- **Acceptance:** user can grant a subset of requested fields; declined fields are excluded
  from what gets exported.

### Task 4.2 — Consent persistence
- `POST /api/consent` writes a `consent_events` row: study id, granted fields, timestamp,
  `revoked: false`.
- Add a revoke action (`PATCH /api/consent/:id`) — "here's what's shared, and you can stop
  sharing it" is core to ConsentLedger's trust story.
- **Acceptance:** consent event persisted; revoke flips `revoked: true` and export no longer
  includes that consent's data.

### Task 4.3 — `ExportScreen` — de-identified bundle + receipt
- De-identification: strip `event_id`→re-hash or drop, drop `source_text` unless explicitly
  granted, drop any direct identifiers (there shouldn't be any collected, but strip
  defensively).
- Generates two downloadable JSON files: research bundle (only granted fields, across granted
  capsules) and consent receipt (fields shared, purpose, recipient, timestamp, schema version,
  revocation status) validating against `consent-receipt.schema.json`.
- UI copy: "De-identification prototype" — no compliance claims.
- **Acceptance:** downloaded bundle contains only granted fields; receipt validates against
  schema; revoking consent and re-exporting excludes the revoked data.
- **Verify:** manual export, `ajv validate` the two downloaded files against their schemas.

**Checkpoint C:** full flow walked in browser — capture → review → timeline → consent →
export — before Phase 6.

---

## Phase 5 — Benchmark (parallelizable with Phase 3/4 once Task 2.1 exists)

### Task 5.1 — `benchmark/run.ts`
- Runs every `examples/*.json` through `/api/extract` (or calls the extraction function
  directly, bypassing HTTP), compares to `expected`.
- Metrics: symptom extraction exact-match/precision/recall; severity accuracy;
  functional-impact accuracy; % of deliberately-ambiguous examples correctly flagged
  `needs_review`; (user correction rate is N/A until real usage exists — report as "not yet
  measured, requires live usage" rather than fabricating a number).
- **Acceptance:** script runs against all examples, outputs `benchmark/results.md` with the
  metrics above and the required disclaimer: "Synthetic, preliminary extraction benchmark —
  not clinical validation."
- **Verify:** run script, inspect `results.md` for sane (non-zero, non-100%-suspicious)
  numbers.

*This task only needs Task 2.1 (the extract endpoint/function) and Phase 1 examples — it does
not depend on any frontend screen. A second agent/workstream can pick this up as soon as 2.1
lands, in parallel with Phase 3-4 frontend work. Recommended as a parallel subagent task.*

---

## Phase 6 — Docs + polish

### Task 6.1 — `docs/fhir-omop-mapping.md`
- Documentation-only: symptoms/severity/functional_impact → FHIR `Observation`
  (with example code bindings), wearable/sleep values → `Observation`, consent →
  FHIR `Consent`. Explicitly labeled as a mapping sketch, not a certified implementation.

### Task 6.2 — `DATASET_CARD.md`
- Describes `examples/` dataset: synthetic origin, intended use (extraction benchmarking),
  known limitations, no real patient data.

### Task 6.3 — `README.md`
- Concept summary, safety boundaries, setup instructions (frontend/backend/.env), demo
  narrative from the spec, links to schema/benchmark/docs.

### Task 6.4 — License decision
- **Blocking sub-decision:** current `LICENSE` is MIT; spec says Apache-2.0. Ask user whether
  to swap to Apache-2.0 or keep MIT and update the README's license line to match reality.
  Do not silently change the license file.

**Checkpoint D:** run `/agent-skills:ship` for go/no-go; fix flagged issues.

---

## Parallelization recommendation
- Phase 0 (frontend scaffold + backend scaffold) can be two agents in parallel — no shared
  files until Task 0.3.
- Phase 5 (benchmark) can run as a parallel subagent workstream starting right after Task 2.1
  lands, alongside Phase 3/4 frontend work.
- Everything else is a linear vertical slice (capture→extract→review→timeline→consent→export)
  and should NOT be parallelized — each screen depends on the previous screen's data shape
  being real, not stubbed.
