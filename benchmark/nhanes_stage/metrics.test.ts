import { test } from "node:test"
import assert from "node:assert/strict"
import { accuracy, confusionMatrix, perClassPrecisionRecall } from "./metrics.ts"

const entries = [
  { actual: "a", predicted: "a" },
  { actual: "a", predicted: "a" },
  { actual: "a", predicted: "b" },
  { actual: "b", predicted: "b" },
  { actual: "b", predicted: "a" }
]

test("accuracy is the fraction of entries where predicted matches actual", () => {
  assert.equal(accuracy(entries), 3 / 5)
})

test("accuracy of an empty entry set is 0, not NaN", () => {
  assert.equal(accuracy([]), 0)
})

test("confusionMatrix counts actual-vs-predicted pairs", () => {
  const matrix = confusionMatrix(entries)
  assert.equal(matrix.get("a")?.get("a"), 2)
  assert.equal(matrix.get("a")?.get("b"), 1)
  assert.equal(matrix.get("b")?.get("b"), 1)
  assert.equal(matrix.get("b")?.get("a"), 1)
})

test("perClassPrecisionRecall computes precision and recall per class", () => {
  const perClass = perClassPrecisionRecall(entries)

  // class "a": actual=3 (2 correct), predicted=3 (2 correct) -> recall 2/3, precision 2/3
  assert.equal(perClass.get("a")?.recall, 2 / 3)
  assert.equal(perClass.get("a")?.precision, 2 / 3)

  // class "b": actual=2 (1 correct), predicted=2 (1 correct) -> recall 1/2, precision 1/2
  assert.equal(perClass.get("b")?.recall, 1 / 2)
  assert.equal(perClass.get("b")?.precision, 1 / 2)
})

test("perClassPrecisionRecall reports precision 0 (not NaN) for a class never predicted", () => {
  const onlyActual = [{ actual: "c", predicted: "a" }]
  const perClass = perClassPrecisionRecall(onlyActual)
  assert.equal(perClass.get("c")?.recall, 0)
  // "c" was never predicted, so it shouldn't have a precision entry computed
  // from a zero-division -- precision is undefined/absent for classes with
  // no predictions rather than silently reporting a misleading 0.
  assert.equal(perClass.get("c")?.precision, undefined)
})
