# NHANES Population-Stage Benchmark + Context Card

## Problem Statement
How might HerSignal turn its well-built application layer into a genuine
piece of *shared* research infrastructure — by grounding its schema and a
new reproducible benchmark task in real, public, open women's-health data,
not only synthetic hand-written notes?

## Recommended Direction
Build a crosswalk from NHANES (CDC) reproductive-health and demographic
variables into a subset of the `EvidenceCapsule` vocabulary, and use it to
define a second, *real-data* benchmark task alongside the existing synthetic
extraction benchmark: predicting a reproductive-stage bucket
(premenopausal / perimenopausal / postmenopausal) from age + a handful of
RHQ survey fields, with a simple, explainable baseline model (logistic
regression or a documented rule-based classifier — not a black box).

This directly answers the challenge's own diagnosis of the field
("no shared benchmark," "data scattered across institutions") and the
explicit judging language calling out weak submissions as ones that "build
an isolated application with no reusable dataset, benchmark, or model
contribution." Right now that's HerSignal's biggest exposure: everything
that exists is excellent on the Application Infrastructure track, but
nothing yet touches Data & Benchmark Infrastructure or AI Model
Infrastructure with real data — a two-out-of-three-tracks gap in a
challenge that explicitly rewards leaving behind reusable layers.

The stage-bucket task is chosen deliberately over anything more ambitious
(hormone-level regression, ovulation prediction) because NHANES RHQ is
self-reported survey data, not lab-confirmed hormone assay data — a
population-level stage bucket is a defensible label from that data; an
individual hormone-level prediction would not be, and would sit uncomfortably
next to this project's existing "no diagnosis, no risk score" discipline
(`backend/src/routes/extract.ts`).

If time remains after the benchmark ships, wire a read-only "population
context" card into the existing Timeline or Review screen: "Women in NHANES's
national sample around your reported life stage report cycle irregularity at
X% — for context, not diagnosis." Same safety-banner discipline as the rest
of the app. This is explicitly a stretch goal, not core scope — see MVP
Scope below.

## Key Assumptions to Validate
- [ ] **NHANES ships as `.xpt` (SAS transport), not CSV.** Validate a Node/TS
      parsing path exists (small npm package) or budget 15 min for a one-time
      Python preprocessing script that emits CSV — do this *first*, before
      writing any crosswalk logic, since it gates everything else.
- [ ] **RHQ variables are sufficient to construct a defensible 3-bucket
      label** (e.g. `RHQ031` regular periods, `RHQ060` hysterectomy,
      `RHQ141`/`RHQ151` age at last period) without needing data NHANES
      doesn't have. Confirm variable availability for one recent cycle
      (e.g. 2017–2018, pre-pandemic, most complete RHQ module) before
      committing to the task definition.
- [ ] **The "population context" card copy doesn't read as diagnostic or
      individualized risk.** If added, this needs the same scrutiny given to
      the extraction system prompt — population base rates framed as
      context, never as "this applies to you."

## MVP Scope
**In:**
- One-time NHANES download + ETL script (`benchmark/nhanes_stage/etl.ts` or
  a documented Python preprocessing step + TS loader).
- Documented crosswalk: NHANES variable → EvidenceCapsule-compatible field
  (age, cycle_context-equivalent, stage label).
- One benchmark task: reproductive-stage bucket classification, explainable
  baseline model, documented train/val/test split.
- `benchmark/nhanes_stage/results.md` with the same rigor as the existing
  `benchmark/results.md` — explicit methodology, limitations, and a
  "population survey data, not clinical ground truth" disclaimer up top.
- A new `DATASET_CARD_NHANES.md` (or a section in the existing one)
  documenting provenance, license (NHANES is US public domain — no
  PhysioNet-style credentialing required, unlike mcPHASES), and intended use.
- README update describing the project's contribution across two tracks now
  (Application Infrastructure + Data & Benchmark Infrastructure), not one.

**Out (stretch, only if time remains):**
- The "population context" UI card — real value-add, but is app-layer polish
  on top of an already-strong app layer; the benchmark/crosswalk is the part
  that's actually missing.

## Not Doing (and Why)
- **mcPHASES integration** — requires PhysioNet credentialed access (DUA,
  approval latency); real longitudinal wearable+hormone data would be a
  stronger fit for the existing `wearable_context`/`sleep_hours` fields than
  NHANES, but the access process alone can blow a half-day budget. Worth
  flagging as explicit future work in the README rather than attempting it
  under time pressure.
- **Individual hormone-level or risk prediction from NHANES** — RHQ is
  self-report, cross-sectional survey data, not an assay. Predicting
  individual hormone levels from it would be a real overclaim and would
  contradict the project's own "no diagnosis, no risk score" rule. Stage
  bucket (which RHQ directly asks about) is the defensible task; a
  quantitative hormone-level model is not, regardless of feasibility.
- **A live aggregate research API over consented capsules** — the genuinely
  10x version of this idea (population-level querying across real consented
  users), but there's no real user base yet to aggregate, and building the
  plumbing for zero live data is speculative scope for a hackathon judged on
  working, demonstrable contributions.
- **Rewriting the existing synthetic benchmark** — it's honest, well-caveated,
  and already does its job (evaluating the extraction prompt). This is an
  *addition*, not a replacement.

## Open Questions
- Which NHANES cycle has the most complete RHQ module for this purpose —
  needs a quick look at CDC's variable documentation before locking the ETL.
- Does the "population context" card ship this round, or stay as a
  documented-but-not-wired data asset (i.e., the crosswalk exists and is
  demoable via the benchmark script, but isn't yet surfaced in the running
  app)? Depends on how much of the half-day the XPT-parsing assumption eats.
