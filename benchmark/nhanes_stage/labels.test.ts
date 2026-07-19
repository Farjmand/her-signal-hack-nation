import { test } from "node:test"
import assert from "node:assert/strict"
import { deriveStageLabel } from "./labels.ts"

test("classifies a respondent with regular periods as premenopausal", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 34, regularPeriods: 1, ageAtMenopause: null })
  assert.equal(label, "premenopausal")
})

test("classifies a respondent with stopped periods and a valid reported age at menopause as postmenopausal", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 54, regularPeriods: 2, ageAtMenopause: 50 })
  assert.equal(label, "postmenopausal")
})

test("classifies stopped periods with no age-at-menopause reported as indeterminate, not postmenopausal", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 45, regularPeriods: 2, ageAtMenopause: null })
  assert.equal(label, "perimenopausal_indeterminate")
})

test("treats a 'refused' age-at-menopause sentinel (777) as indeterminate rather than a real age", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 45, regularPeriods: 2, ageAtMenopause: 777 })
  assert.equal(label, "perimenopausal_indeterminate")
})

test("treats a 'don't know' age-at-menopause sentinel (999) as indeterminate rather than a real age", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 45, regularPeriods: 2, ageAtMenopause: 999 })
  assert.equal(label, "perimenopausal_indeterminate")
})

test("excludes male respondents entirely (returns null, not a guessed label)", () => {
  const label = deriveStageLabel({ sex: 1, ageYears: 45, regularPeriods: null, ageAtMenopause: null })
  assert.equal(label, null)
})

test("excludes respondents younger than the defined adult age band (18)", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 13, regularPeriods: 1, ageAtMenopause: null })
  assert.equal(label, null)
})

test("excludes respondents older than the defined age band (59)", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 65, regularPeriods: 2, ageAtMenopause: 55 })
  assert.equal(label, null)
})

test("excludes respondents who refused the core regular-periods question (7) rather than guessing", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 40, regularPeriods: 7, ageAtMenopause: null })
  assert.equal(label, null)
})

test("excludes respondents who answered 'don't know' to the core question (9) rather than guessing", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 40, regularPeriods: 9, ageAtMenopause: null })
  assert.equal(label, null)
})

test("excludes respondents with a missing (null) answer to the core question rather than guessing", () => {
  const label = deriveStageLabel({ sex: 2, ageYears: 40, regularPeriods: null, ageAtMenopause: null })
  assert.equal(label, null)
})
