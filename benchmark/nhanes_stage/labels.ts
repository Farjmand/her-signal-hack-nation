/**
 * Crosswalk: NHANES reproductive-health survey variables -> a reproductive-stage
 * bucket label. This is a population-survey label, not a clinical diagnosis or
 * a hormone assay result — see benchmark/nhanes_stage/results.md and
 * DATASET_CARD_NHANES.md for methodology and limitations.
 *
 * Source variables (2017-2018 cycle, RHQ_J + DEMO_J, merged on SEQN):
 *   sex             <- DEMO_J.RIAGENDR (1 = male, 2 = female)
 *   ageYears        <- DEMO_J.RIDAGEYR
 *   regularPeriods  <- RHQ_J.RHQ031 (1 = yes, 2 = no, 7 = refused, 9 = don't know)
 *   ageAtMenopause  <- RHQ_J.RHQ060 (age when periods stopped; 777 = refused, 999 = don't know)
 */
export type StageLabel = "premenopausal" | "postmenopausal" | "perimenopausal_indeterminate"

export interface RhqRow {
  sex: number
  ageYears: number
  regularPeriods: number | null
  ageAtMenopause: number | null
}

// NHANES-wide sentinel codes for "refused" / "don't know" on numeric fields.
const AGE_AT_MENOPAUSE_SENTINELS = new Set([777, 999])

// Adult age band this task is scoped to. RHQ031 is asked of some respondents
// younger than 18, but this benchmark task is deliberately scoped to the
// adult population HerSignal's app itself targets — see DATASET_CARD_NHANES.md.
const MIN_AGE_YEARS = 18
const MAX_AGE_YEARS = 59

const FEMALE = 2

export function deriveStageLabel(row: RhqRow): StageLabel | null {
  if (row.sex !== FEMALE) return null
  if (row.ageYears < MIN_AGE_YEARS || row.ageYears > MAX_AGE_YEARS) return null

  if (row.regularPeriods === 1) return "premenopausal"

  if (row.regularPeriods === 2) {
    const hasValidAgeAtMenopause =
      row.ageAtMenopause !== null &&
      row.ageAtMenopause > 0 &&
      !AGE_AT_MENOPAUSE_SENTINELS.has(row.ageAtMenopause)
    return hasValidAgeAtMenopause ? "postmenopausal" : "perimenopausal_indeterminate"
  }

  // regularPeriods is null (missing), 7 (refused), or 9 (don't know) --
  // excluded rather than guessed.
  return null
}
