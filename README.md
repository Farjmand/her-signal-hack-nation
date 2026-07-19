# HerSignal

An AI-assisted symptom-evidence companion for hormonal health, with an
embedded **ConsentLedger** trust layer.

Women are often asked to recall months of complex symptoms in a single
appointment. Researchers receive fragmented, decontextualized data.
HerSignal turns a ten-second lived experience into a user-verified evidence
capsule: useful in care today, and — with explicit, granular, revocable
consent — interoperable research data tomorrow.

> **HerSignal does not diagnose.** It helps women make their experiences
> visible, and helps researchers receive consented, structured, longitudinal
> data. This records your experience — it is not medical advice, diagnosis,
> or a risk assessment.

## What's in this repo

- `frontend/` — React + TypeScript + Tailwind + shadcn/ui app (Capture,
  Review, Timeline, Consent, Export screens).
- `backend/` — Express + TypeScript + SQLite API (OpenAI structured-output
  extraction, capsule persistence, consent receipts).
- `schema/` — `evidence-capsule.schema.json` and
  `consent-receipt.schema.json`, the two open data contracts this project is
  built around.
- `examples/` — 24 synthetic, hand-written symptom notes with expected
  structured labels (see `DATASET_CARD.md`).
- `benchmark/` — `run.ts` evaluates the extraction endpoint against
  `examples/`; `results.md` has the current numbers.
- `docs/fhir-omop-mapping.md` — a documentation-only sketch of how this
  schema could map onto FHIR and OMOP CDM, for anyone building toward
  interoperability later.

## The MVP flow

1. **Capture** — a short free-text note: *"I had sharp pelvic pain today,
   slept four hours, and had to leave work early."*
2. **AI extraction** — OpenAI structured output turns it into: symptoms,
   severity, sleep hours, functional impact, and flags any field the note
   was ambiguous or hedging about (`needs_review`).
3. **User verification** — every field is editable. Nothing is saved until
   the user explicitly clicks Accept. AI never silently finalizes health
   data.
4. **Evidence timeline** — accepted entries appear as readable cards, newest
   first.
5. **Research consent** — a mock study requests specific field categories
   only (never the original note text). The user grants or declines each
   category individually; nothing is pre-checked.
6. **Export + receipt** — a de-identified research JSON bundle (hashed
   research ID, only granted fields, no direct identifiers) plus a consent
   receipt recording exactly what was shared, with whom, why, and whether
   it's since been revoked.

## Safety boundaries

These are enforced in the product, not just stated in docs:

- No diagnosis, triage, treatment suggestion, risk score, or condition
  prediction — anywhere. The extraction system prompt
  (`backend/src/routes/extract.ts`) explicitly forbids it.
- A persistent "not medical advice" banner appears on every screen that
  touches health data.
- Voice capture is out of scope for this MVP — text-only, by design.
- All demo/seed data (`backend/src/seed.ts`, `examples/`) is synthetic.
  Nothing here is real patient data.
- Export is labeled a **"de-identification prototype"** — it is not a
  certified or regulatory-compliant (HIPAA/GDPR) de-identification process,
  and the app never claims otherwise.
- Consent is granular, purpose-limited, and revocable — see `ConsentScreen`
  and `ExportScreen`.

## Running it locally

Requires Node 20+ and an OpenAI API key.

```bash
# Backend
cd backend
cp .env.example .env   # add your OPENAI_API_KEY
npm install
npm run seed            # optional: populate 5 demo timeline entries
npm run dev              # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5183
```

Open the frontend URL and walk the flow: Capture → Review → Timeline →
Consent → Export.

### Schema / example / benchmark tooling (repo root)

```bash
npm install
npm run validate:schemas   # ajv-validates both JSON Schemas
npm run validate:examples  # validates all 24 examples/*.json against schema
npm run benchmark          # requires backend running; regenerates benchmark/results.md
```

## Benchmark

`benchmark/results.md` reports symptom extraction precision/recall/exact-match,
severity and functional-impact accuracy, and ambiguity-flagging correctness
against the 24 synthetic examples. It is explicitly labeled a **synthetic,
preliminary extraction benchmark — not clinical validation** — see the file
itself for methodology caveats (small n, single author, free-text matching
limitations).

## Interoperability

`docs/fhir-omop-mapping.md` sketches how `EvidenceCapsule` and
`ConsentReceipt` fields could map onto FHIR R4 resources (`Observation`,
`Consent`, `Provenance`) and OMOP CDM tables (`OBSERVATION`, `MEASUREMENT`).
Nothing in the running app currently produces or consumes FHIR/OMOP — this is
a design reference, written honestly as a sketch rather than a claim of
compliance.

## License

Apache-2.0 — see `LICENSE`. Chosen over MIT specifically for its explicit
patent grant, since this project is meant to be reusable by research
institutions building on the schema and dataset.

## What this is not

A hackathon MVP, built to demonstrate the shape of the idea end-to-end:
capture → AI extraction → human verification → evidence timeline → granular
consent → de-identified export. It is not a medical device, not clinically
validated, not HIPAA/GDPR-certified, and not intended for use with real
patient data in its current form.
