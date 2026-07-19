# NHANES Reproductive-Stage Benchmark Results

**Real NHANES 2017-2018 survey data — population-level statistics, not
clinical validation, not a diagnosis, and not a hormone assay result.**

Generated: 2026-07-19T11:15:43.385Z
Source: NHANES 2017-2018 cycle, RHQ_J (reproductive health) + DEMO_J
(demographics), merged on SEQN. See `fetch_and_convert.py` and
`../../DATASET_CARD_NHANES.md` for provenance, license, and full methodology.

## Task

Predict a reproductive-stage bucket (premenopausal / postmenopausal /
perimenopausal_indeterminate — see `labels.ts`) from age alone. Age is the
only feature used because the label itself is derived from this survey's
RHQ031 ("regular periods in the last 12 months?") and RHQ060 (age when
periods stopped) answers — using those as model inputs would leak the
label. This makes the task "how well does age alone predict stage," a fair
and realistic baseline any future model could be compared against.

The model is a depth-2 age-only decision stump (`classifier.ts`) —
deliberately simple and fully inspectable rather than a black box, per this
project's explainability goal.

## Dataset composition

| | Count |
| --- | --- |
| Total NHANES respondents in source file | 3286 |
| Excluded: not female (RIAGENDR != 2) | 0 |
| Excluded: outside 18-59 adult age band | 1421 |
| Excluded: refused/don't know/missing on RHQ031 | 157 |
| **Included in benchmark** | **1708** |

Label distribution among included respondents:

- perimenopausal_indeterminate: 21
- postmenopausal: 506
- premenopausal: 1181

## Split

Stratified train/val/test split (60/20/20) by label, seeded for
reproducibility (see `split.ts`).

| Split | n |
| --- | --- |
| train | 1026 |
| val | 341 |
| test | 341 |

## Fitted model

Decision rule learned from the train split:

```
if age < 48.5:
  predict premenopausal
else:
  predict postmenopausal
```

## Results — validation split

### Age-stump classifier (val)

n = 341, accuracy = 83.3%

| Class | Precision | Recall |
| --- | --- | --- |
| perimenopausal_indeterminate | n/a (never predicted) | 0.0% |
| postmenopausal | 77.6% | 65.3% |
| premenopausal | 85.2% | 92.4% |

Confusion matrix:

| actual \ predicted | perimenopausal_indeterminate | postmenopausal | premenopausal |
| --- | --- | --- | --- |
| perimenopausal_indeterminate | 0 | 1 | 3 |
| postmenopausal | 0 | 66 | 35 |
| premenopausal | 0 | 18 | 218 |


## Results — test split

### Age-stump classifier (test)

n = 341, accuracy = 88.9%

| Class | Precision | Recall |
| --- | --- | --- |
| perimenopausal_indeterminate | n/a (never predicted) | 0.0% |
| postmenopausal | 85.9% | 78.2% |
| premenopausal | 90.0% | 94.9% |

Confusion matrix:

| actual \ predicted | perimenopausal_indeterminate | postmenopausal | premenopausal |
| --- | --- | --- | --- |
| perimenopausal_indeterminate | 0 | 1 | 3 |
| postmenopausal | 0 | 79 | 22 |
| premenopausal | 0 | 12 | 224 |


### Majority-class baseline (always predicts "premenopausal", test)

n = 341, accuracy = 69.2%

| Class | Precision | Recall |
| --- | --- | --- |
| perimenopausal_indeterminate | n/a (never predicted) | 0.0% |
| postmenopausal | n/a (never predicted) | 0.0% |
| premenopausal | 69.2% | 100.0% |

Confusion matrix:

| actual \ predicted | perimenopausal_indeterminate | postmenopausal | premenopausal |
| --- | --- | --- | --- |
| perimenopausal_indeterminate | 0 | 0 | 4 |
| postmenopausal | 0 | 0 | 101 |
| premenopausal | 0 | 0 | 236 |


## Known limitations

- **Self-reported survey data, not lab-confirmed hormone levels.** RHQ031/
  RHQ060 are respondents' own recollection, not an assay — this task
  predicts a survey-defined bucket, not a clinical hormonal state.
- **Cross-sectional, not longitudinal.** Each respondent is a single
  snapshot; this cannot capture how an individual's stage changes over time
  the way `EvidenceCapsule`'s longitudinal design is meant to.
- **`perimenopausal_indeterminate` is a data-quality bucket, not a precise
  clinical stage.** It groups respondents who reported stopped periods but
  didn't give (or refused/didn't know) an age when they stopped — likely a
  mix of true perimenopause, hysterectomy, and other causes NHANES's RHQ031/
  RHQ060 alone can't distinguish.
- **Age-only feature is a deliberately narrow baseline**, chosen to avoid
  label leakage (see Task section above) — not a claim that age is the best
  or only useful predictor. A future model with genuinely independent
  features (e.g. real hormone assay values from a different NHANES module)
  could reasonably beat this baseline.
- **18-59 age band is this task's own scope choice**, not an NHANES
  restriction — chosen to match the adult population HerSignal's app
  targets. See `labels.ts` and `../../DATASET_CARD_NHANES.md`.
