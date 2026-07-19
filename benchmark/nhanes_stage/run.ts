/**
 * Reproductive-stage benchmark on real NHANES 2017-2018 data.
 *
 * Reads the CSV produced by fetch_and_convert.py (RHQ_J + DEMO_J merged on
 * SEQN), derives a stage label per respondent via labels.ts, fits an
 * explainable age-only decision stump (classifier.ts) on a stratified train
 * split, and evaluates it against a majority-class baseline on held-out
 * val/test splits. Writes benchmark/nhanes_stage/results.md.
 *
 * This is a population-survey benchmark, not clinical validation -- see
 * results.md and ../../DATASET_CARD.md for full methodology and
 * limitations.
 */
import fs from "node:fs"
import path from "node:path"
import { deriveStageLabel, type RhqRow, type StageLabel } from "./labels.ts"
import { stratifiedSplit } from "./split.ts"
import { fitAgeStump, predictAgeStump, type Sample } from "./classifier.ts"
import { accuracy, confusionMatrix, perClassPrecisionRecall, type PredictionEntry } from "./metrics.ts"

const dataPath = path.resolve(import.meta.dirname, "data/nhanes_2017_2018_reproductive.csv")
const outPath = path.resolve(import.meta.dirname, "results.md")

interface RawRow {
  seqn: number
  regular_periods: number | null
  age_at_menopause: number | null
  sex: number
  age_years: number
}

function parseIntCell(cell: string): number | null {
  return cell === "" ? null : Number.parseInt(cell, 10)
}

function parseCsv(text: string): RawRow[] {
  const [header, ...lines] = text.trim().split("\n")
  const columns = header.split(",")
  return lines.map((line) => {
    const cells = line.split(",")
    const row: Record<string, string> = {}
    columns.forEach((col, i) => (row[col] = cells[i] ?? ""))
    return {
      seqn: Number.parseInt(row.seqn, 10),
      regular_periods: parseIntCell(row.regular_periods),
      age_at_menopause: parseIntCell(row.age_at_menopause),
      sex: Number.parseInt(row.sex, 10),
      age_years: Number.parseInt(row.age_years, 10)
    }
  })
}

function toRhqRow(raw: RawRow): RhqRow {
  return {
    sex: raw.sex,
    ageYears: raw.age_years,
    regularPeriods: raw.regular_periods,
    ageAtMenopause: raw.age_at_menopause
  }
}

function renderTree(node: ReturnType<typeof fitAgeStump>, indent = ""): string {
  if (node.type === "leaf") return `${indent}predict ${node.label}\n`
  return (
    `${indent}if age < ${node.threshold}:\n` +
    renderTree(node.left, indent + "  ") +
    `${indent}else:\n` +
    renderTree(node.right, indent + "  ")
  )
}

function metricsSection(title: string, entries: PredictionEntry[], classes: StageLabel[]): string {
  const acc = accuracy(entries)
  const perClass = perClassPrecisionRecall(entries)
  const matrix = confusionMatrix(entries)

  const perClassRows = classes
    .map((c) => {
      const pr = perClass.get(c)
      const precision = pr?.precision === undefined ? "n/a (never predicted)" : `${(pr.precision * 100).toFixed(1)}%`
      const recall = pr === undefined ? "n/a" : `${(pr.recall * 100).toFixed(1)}%`
      return `| ${c} | ${precision} | ${recall} |`
    })
    .join("\n")

  const confusionHeader = `| actual \\ predicted | ${classes.join(" | ")} |`
  const confusionSep = `| --- | ${classes.map(() => "---").join(" | ")} |`
  const confusionRows = classes
    .map((actual) => {
      const row = matrix.get(actual)
      return `| ${actual} | ${classes.map((p) => row?.get(p) ?? 0).join(" | ")} |`
    })
    .join("\n")

  return `### ${title}

n = ${entries.length}, accuracy = ${(acc * 100).toFixed(1)}%

| Class | Precision | Recall |
| --- | --- | --- |
${perClassRows}

Confusion matrix:

${confusionHeader}
${confusionSep}
${confusionRows}
`
}

function main() {
  const raw = parseCsv(fs.readFileSync(dataPath, "utf-8"))

  let excludedMale = 0
  let excludedAgeBand = 0
  let excludedNoAnswer = 0
  const samples: Sample[] = []
  const labelCounts = new Map<StageLabel, number>()

  for (const r of raw) {
    const label = deriveStageLabel(toRhqRow(r))
    if (label === null) {
      if (r.sex !== 2) excludedMale++
      else if (r.age_years < 18 || r.age_years > 59) excludedAgeBand++
      else excludedNoAnswer++
      continue
    }
    samples.push({ age: r.age_years, label })
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1)
  }

  const { train, val, test } = stratifiedSplit(samples, (s) => s.label, {
    trainRatio: 0.6,
    valRatio: 0.2,
    seed: 20180119 // NHANES 2017-2018 cycle, used as a fixed reproducible seed
  })

  const tree = fitAgeStump(train, 2)
  const trainMajority = [...new Map(train.map((s) => [s.label, train.filter((t) => t.label === s.label).length]))].sort(
    (a, b) => b[1] - a[1]
  )[0][0]

  const classes = [...labelCounts.keys()].sort()

  const stumpValEntries: PredictionEntry[] = val.map((s) => ({ actual: s.label, predicted: predictAgeStump(tree, s.age) }))
  const stumpTestEntries: PredictionEntry[] = test.map((s) => ({ actual: s.label, predicted: predictAgeStump(tree, s.age) }))
  const baselineTestEntries: PredictionEntry[] = test.map((s) => ({ actual: s.label, predicted: trainMajority }))

  const timestamp = new Date().toISOString()

  const md = `# NHANES Reproductive-Stage Benchmark Results

**Real NHANES 2017-2018 survey data — population-level statistics, not
clinical validation, not a diagnosis, and not a hormone assay result.**

Generated: ${timestamp}
Source: NHANES 2017-2018 cycle, RHQ_J (reproductive health) + DEMO_J
(demographics), merged on SEQN. See \`fetch_and_convert.py\` and
\`../../DATASET_CARD.md\` for provenance, license, and full methodology.

## Task

Predict a reproductive-stage bucket (premenopausal / postmenopausal /
perimenopausal_indeterminate — see \`labels.ts\`) from age alone. Age is the
only feature used because the label itself is derived from this survey's
RHQ031 ("regular periods in the last 12 months?") and RHQ060 (age when
periods stopped) answers — using those as model inputs would leak the
label. This makes the task "how well does age alone predict stage," a fair
and realistic baseline any future model could be compared against.

The model is a depth-2 age-only decision stump (\`classifier.ts\`) —
deliberately simple and fully inspectable rather than a black box, per this
project's explainability goal.

## Dataset composition

| | Count |
| --- | --- |
| Total NHANES respondents in source file | ${raw.length} |
| Excluded: not female (RIAGENDR != 2) | ${excludedMale} |
| Excluded: outside 18-59 adult age band | ${excludedAgeBand} |
| Excluded: refused/don't know/missing on RHQ031 | ${excludedNoAnswer} |
| **Included in benchmark** | **${samples.length}** |

Label distribution among included respondents:

${classes.map((c) => `- ${c}: ${labelCounts.get(c)}`).join("\n")}

## Split

Stratified train/val/test split (60/20/20) by label, seeded for
reproducibility (see \`split.ts\`).

| Split | n |
| --- | --- |
| train | ${train.length} |
| val | ${val.length} |
| test | ${test.length} |

## Fitted model

Decision rule learned from the train split:

\`\`\`
${renderTree(tree)}\`\`\`

## Results — validation split

${metricsSection("Age-stump classifier (val)", stumpValEntries, classes)}

## Results — test split

${metricsSection("Age-stump classifier (test)", stumpTestEntries, classes)}

${metricsSection(`Majority-class baseline (always predicts "${trainMajority}", test)`, baselineTestEntries, classes)}

## Known limitations

- **Self-reported survey data, not lab-confirmed hormone levels.** RHQ031/
  RHQ060 are respondents' own recollection, not an assay — this task
  predicts a survey-defined bucket, not a clinical hormonal state.
- **Cross-sectional, not longitudinal.** Each respondent is a single
  snapshot; this cannot capture how an individual's stage changes over time
  the way \`EvidenceCapsule\`'s longitudinal design is meant to.
- **\`perimenopausal_indeterminate\` is a data-quality bucket, not a precise
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
  targets. See \`labels.ts\` and \`../../DATASET_CARD.md\`.
`

  fs.writeFileSync(outPath, md)
  console.log(`Wrote ${outPath}`)
  console.log(`Included ${samples.length}/${raw.length} respondents.`)
  console.log(`Test accuracy: stump=${(accuracy(stumpTestEntries) * 100).toFixed(1)}% baseline=${(accuracy(baselineTestEntries) * 100).toFixed(1)}%`)
}

main()
