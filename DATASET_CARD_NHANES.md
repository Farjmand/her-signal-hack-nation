# Dataset Card: NHANES 2017-2018 Reproductive-Stage Benchmark

This card describes `benchmark/nhanes_stage/data/nhanes_2017_2018_reproductive.csv`
— a derived subset of a real, public CDC survey, used to evaluate the
reproductive-stage prediction task in `benchmark/nhanes_stage/`. This is a
separate dataset from `examples/` (see `DATASET_CARD.md`), which is
synthetic, hand-written text used to benchmark the extraction prompt.

## Summary

- **What it is:** 3,286 rows, one per NHANES 2017-2018 respondent, merged
  from two public CDC files (`RHQ_J.xpt` reproductive health questionnaire,
  `DEMO_J.xpt` demographics) on their shared `SEQN` respondent ID, reduced to
  five columns: `seqn`, `regular_periods` (RHQ031), `age_at_menopause`
  (RHQ060), `sex` (RIAGENDR), `age_years` (RIDAGEYR).
- **What it is not:** clinical or lab-confirmed hormone data, longitudinal
  data (each respondent is one cross-sectional snapshot), or a
  representative sample of any population outside the US NHANES 2017-2018
  survey design.
- **Intended use:** evaluating a reproductive-stage classification baseline
  (`benchmark/nhanes_stage/run.ts`) against real survey data, and as a
  documented crosswalk showing how NHANES variables can map into
  `EvidenceCapsule`-adjacent concepts (age, cycle context) for researchers
  building on this schema. Not intended as ground truth about any
  individual's hormonal state, and not intended for clinical use.

## Provenance

Source: [NHANES](https://wwwn.cdc.gov/nchs/nhanes/), National Health and
Nutrition Examination Survey, run by the US CDC's National Center for Health
Statistics. 2017-2018 cycle, files `RHQ_J.xpt` and `DEMO_J.xpt`, downloaded
directly from `wwwn.cdc.gov`.

Regenerate via:
```bash
cd benchmark/nhanes_stage
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python fetch_and_convert.py
```

This re-downloads the two source `.xpt` files (not committed — see
`.gitignore`) and regenerates the committed CSV. The committed CSV is the
reusable artifact; the raw `.xpt` files and the prep venv are not needed to
use the benchmark, only to reproduce or refresh it.

**No credentialing required.** Unlike PhysioNet-hosted datasets (e.g.
mcPHASES, which this project's `docs/ideas/nhanes-population-benchmark.md`
explicitly scoped out for this reason), NHANES is US federal public-domain
data, freely downloadable with no data use agreement or approval process.

## Label derivation

`benchmark/nhanes_stage/labels.ts`'s `deriveStageLabel()` is the crosswalk:

| Condition | Label |
| --- | --- |
| `sex != 2` (not female) | excluded |
| `age_years` outside 18-59 | excluded |
| `regular_periods` (RHQ031) is null/refused(7)/don't-know(9) | excluded |
| `regular_periods == 1` (regular periods in last 12mo) | `premenopausal` |
| `regular_periods == 2` and `age_at_menopause` (RHQ060) is a valid reported age | `postmenopausal` |
| `regular_periods == 2` and `age_at_menopause` is missing/refused(777)/don't-know(999) | `perimenopausal_indeterminate` |

Of 3,286 respondents, 1,708 are included after exclusions (see
`benchmark/nhanes_stage/results.md` for the full breakdown and current label
distribution).

The 18-59 age band is this project's own scoping choice — chosen to match
the adult population HerSignal's app targets — not an NHANES-imposed
restriction. RHQ031 is asked of some NHANES respondents outside this range.

## Known limitations

- **Self-reported, not lab-confirmed.** RHQ031/RHQ060 are the respondent's
  own recollection of their menstrual history, not a hormone assay. The
  resulting label is a survey-defined bucket, not a clinical diagnosis of
  menopausal status.
- **Cross-sectional.** One row per respondent, one point in time — this
  cannot represent how a person's stage changes over months or years the way
  `EvidenceCapsule`'s longitudinal design is meant to.
- **`perimenopausal_indeterminate` is a data-quality bucket, not a precise
  clinical stage** — it groups respondents who reported stopped periods but
  didn't give (or refused/didn't know) an age when they stopped, which could
  reflect true perimenopause, hysterectomy, or other causes RHQ031/RHQ060
  alone can't distinguish. Treat it as "insufficient data to classify,"
  not as a third biologically equivalent category to the other two.
- **US-only, 2017-2018.** Not intended to generalize to other countries,
  time periods, or healthcare contexts without revalidation.
- **Small `perimenopausal_indeterminate` class** (21 of 1,708 included
  respondents) — any model evaluated against this dataset should be expected
  to perform poorly on this class purely from limited data, not necessarily
  from a flawed approach.

## License

NHANES data is US federal public-domain data (CDC/NCHS), free to redistribute
and reuse. This derived CSV and the accompanying crosswalk/benchmark code are
released under this repository's Apache-2.0 license (see `LICENSE`).
