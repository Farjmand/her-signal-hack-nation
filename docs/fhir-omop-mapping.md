# FHIR / OMOP mapping sketch

**Status: documentation sketch, not a certified or production interoperability
implementation.** This describes how HerSignal's `EvidenceCapsule` and
`ConsentReceipt` records *could* map onto FHIR R4 and the OMOP Common Data
Model (CDM), so the schemas are legible to people who work with those
standards. No code in this repo generates or consumes FHIR/OMOP resources —
this is a design reference for a future integration, written to be honest
about what a hackathon MVP can and can't claim.

## Why this exists

Researchers and clinical systems standardize on FHIR (for interoperability
between systems) and OMOP CDM (for observational research databases). A
symptom-evidence tool that wants to eventually feed structured data into
either ecosystem needs its schema to have a legible path onto both — even if
that path isn't built yet. This document is that path, sketched at the field
level.

## EvidenceCapsule → FHIR

Each `EvidenceCapsule` maps to a small bundle of FHIR resources, not a single
resource — a symptom report is not one clinical fact, it's a self-report with
context.

| EvidenceCapsule field | FHIR resource | FHIR field | Notes |
| --- | --- | --- | --- |
| `symptoms[]` (each entry) | `Observation` | `Observation.code` (text-only `CodeableConcept`, no coded system) | One `Observation` per symptom string. `Observation.code.text` holds the user's own words — deliberately **not** mapped to a SNOMED CT code, since that would imply a clinical coding decision this tool does not make. |
| `severity` | `Observation` | `Observation.component` with `component.code.text = "severity"`, `component.valueString` = `low`/`medium`/`high` | Modeled as a component of the symptom Observation, not `Observation.interpretation` — `interpretation` implies clinical judgment (e.g. "abnormal"), which this is not. |
| `duration` | `Observation` | `Observation.effectivePeriod` or a free-text `component` if duration is described qualitatively (e.g. "all day") | Only mapped to a structured `Period` when the text is unambiguous; otherwise kept as text, consistent with `needs_review` semantics. |
| `functional_impact` | `Observation` | separate `Observation` with `code.text = "functional impact"`, `valueString` = the free text | Kept as its own Observation rather than a note, so it can be queried, while remaining explicitly non-clinical text. |
| `sleep_hours` | `Observation` | `code = "sleep duration"` (could later map to LOINC 93832-4), `valueQuantity` = `{ value, unit: "h" }` | The one field with a plausible path to a standard LOINC code, since "hours slept" is a well-defined quantity. |
| `cycle_context` | `Observation` | `code.text = "menstrual cycle context"`, `valueString` | Free text by design (see schema); not mapped to a cycle-day integer unless the user's text is unambiguous. |
| `hormone_therapy_or_contraception_context` | `MedicationStatement` (loosely) or `Observation` | `MedicationStatement.medication.text` or `Observation.valueString` | Modeled as `Observation` in this sketch to avoid implying medication-list accuracy `MedicationStatement` typically carries. |
| `wearable_context` | `Observation` | `Observation.device` reference + `valueString`/`valueQuantity` | Placeholder — the MVP does not sync wearables; this field is user-typed context only. |
| `ai_confidence` | *(not mapped)* | — | Internal-only; FHIR has no standard "model confidence" field, and surfacing it as clinical metadata would overstate its meaning. |
| `needs_review` / `user_verified` | `Observation.status` | `preliminary` when `user_verified = false`, `final` when `true` | This is the one place FHIR's own semantics line up well: `preliminary` vs `final` status already captures "not yet confirmed by a person." |
| `source_text` | `Provenance` | `Provenance.entity` or an `Observation.note` on the parent Observation | Kept as provenance/note text, never dropped, so a clinician can always see the user's own words behind any structured field. |
| `event_id` | `Observation.id` (or `identifier`) | — | Direct 1:1. |
| `reported_at` | `Observation.effectiveDateTime` | — | Direct 1:1. |

All `Observation.subject` references would point to a `Patient` resource that
does not exist in this MVP (no patient registry — this is a single-user local
demo). `Observation.status = "preliminary"` is the load-bearing detail here:
it's the standards-native way to express "AI-extracted, not yet
user-confirmed," which is the same invariant the schema enforces with
`user_verified`.

## ConsentReceipt → FHIR Consent

| ConsentReceipt field | FHIR `Consent` field | Notes |
| --- | --- | --- |
| `receipt_id` | `Consent.id` | Direct 1:1. |
| `study_id` / `study_name` | `Consent.organization` (reference/display) | The requesting study/org. |
| `purpose` | `Consent.provision.purpose` (`CodeableConcept`, text-only) | Purpose-limitation is core to both FHIR `Consent` and this app's design. |
| `recipient` | `Consent.provision.actor` (recipient role) | — |
| `fields[].field` / `fields[].granted` | `Consent.provision.provision[]`, each with `type = "permit"` or `"deny"` and `Consent.provision.data` referencing the field category | FHIR models granular consent as nested provisions; this is the most direct part of the mapping. |
| `timestamp` | `Consent.dateTime` | Direct 1:1. |
| `revoked` / `revoked_at` | `Consent.status = "inactive"` + `Consent.provision.period.end` | FHIR's `Consent.status` state machine (`draft` / `active` / `inactive` / `entered-in-error`) already models revocation. |
| `schema_version` | *(not a FHIR field — app-internal)* | Kept in the app schema so old receipts stay interpretable; has no FHIR equivalent. |

## EvidenceCapsule → OMOP CDM (sketch)

OMOP CDM is table-oriented rather than resource-oriented, and — like the FHIR
mapping above — nothing here is coded to a standard vocabulary (SNOMED,
LOINC) yet; that would require a clinical coding decision this project
deliberately avoids making.

| EvidenceCapsule field | OMOP CDM table | Notes |
| --- | --- | --- |
| `symptoms[]` | `OBSERVATION` | One row per symptom, `observation_source_value` = the free-text symptom string, `observation_concept_id = 0` (unmapped) until/unless a clinician-reviewed vocabulary mapping is added. |
| `severity`, `functional_impact`, `duration`, `cycle_context`, `hormone_therapy_or_contraception_context`, `wearable_context` | `OBSERVATION` (as `value_as_string`) | Same table as symptoms — these are all self-reported qualitative context, not measurements. |
| `sleep_hours` | `MEASUREMENT` | The one field that's a genuine quantity (`value_as_number`, `unit_source_value = "hours"`), consistent with its FHIR `valueQuantity` mapping above. |
| `user_verified` | *(row inclusion filter, not a column)* | Only `user_verified = true` capsules would ever be considered for OMOP export — mirrors how `ExportScreen` already filters to verified capsules before building a research bundle. |
| `event_id`, `reported_at` | `observation_id` / `observation_date` (or `measurement_date` for sleep) | Direct mapping. |

## What this MVP actually does today

For clarity, since this document describes a *possible* future integration:
the running app does not read or write FHIR or OMOP anywhere. `ExportScreen`
produces a HerSignal-native de-identified JSON bundle (see
`schema/evidence-capsule.schema.json`) plus a consent receipt (see
`schema/consent-receipt.schema.json`). This document exists so that path is
legible on paper before anyone invests in building it.
