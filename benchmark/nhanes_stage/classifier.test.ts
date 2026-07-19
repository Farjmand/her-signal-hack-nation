import { test } from "node:test"
import assert from "node:assert/strict"
import { fitAgeStump, predictAgeStump } from "./classifier.ts"

test("perfectly separates two age-linked classes when a clean threshold exists", () => {
  const samples = [
    { age: 22, label: "young" },
    { age: 25, label: "young" },
    { age: 28, label: "young" },
    { age: 40, label: "old" },
    { age: 45, label: "old" },
    { age: 50, label: "old" }
  ]
  const tree = fitAgeStump(samples, 2)

  for (const s of samples) {
    assert.equal(predictAgeStump(tree, s.age), s.label)
  }
})

test("predicts the majority label for a leaf when classes overlap", () => {
  // Ages 20-25 are 2/3 "young" and 1/3 "old" -- majority vote should win.
  const samples = [
    { age: 20, label: "young" },
    { age: 22, label: "young" },
    { age: 24, label: "old" }
  ]
  const tree = fitAgeStump(samples, 1)

  assert.equal(predictAgeStump(tree, 21), "young")
})

test("is deterministic for a fixed input (same samples -> identical tree, same predictions)", () => {
  const samples = [
    { age: 30, label: "a" },
    { age: 35, label: "a" },
    { age: 50, label: "b" },
    { age: 55, label: "b" }
  ]
  const treeA = fitAgeStump(samples, 2)
  const treeB = fitAgeStump(samples, 2)

  for (const age of [28, 33, 45, 52, 60]) {
    assert.equal(predictAgeStump(treeA, age), predictAgeStump(treeB, age))
  }
})

test("respects maxDepth of 0 by returning a single-leaf majority-class predictor", () => {
  const samples = [
    { age: 20, label: "young" },
    { age: 21, label: "young" },
    { age: 60, label: "old" }
  ]
  const tree = fitAgeStump(samples, 0)

  // A depth-0 tree can't split on age at all -- every prediction is the
  // overall majority class ("young", 2 of 3 samples).
  assert.equal(predictAgeStump(tree, 20), "young")
  assert.equal(predictAgeStump(tree, 60), "young")
})

test("throws on an empty training set rather than returning a meaningless model", () => {
  assert.throws(() => fitAgeStump([], 2))
})
