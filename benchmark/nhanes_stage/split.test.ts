import { test } from "node:test"
import assert from "node:assert/strict"
import { stratifiedSplit } from "./split.ts"

interface Item {
  id: number
  label: "a" | "b"
}

function makeItems(countA: number, countB: number): Item[] {
  const items: Item[] = []
  for (let i = 0; i < countA; i++) items.push({ id: items.length, label: "a" })
  for (let i = 0; i < countB; i++) items.push({ id: items.length, label: "b" })
  return items
}

test("partitions every item into exactly one of train/val/test (no loss, no duplication)", () => {
  const items = makeItems(30, 20)
  const { train, val, test: testSet } = stratifiedSplit(items, (i) => i.label, {
    trainRatio: 0.6,
    valRatio: 0.2,
    seed: 1
  })

  const allIds = [...train, ...val, ...testSet].map((i) => i.id).sort((a, b) => a - b)
  assert.deepEqual(allIds, items.map((i) => i.id))
})

test("is deterministic for a fixed seed (same input + seed -> identical split)", () => {
  const items = makeItems(30, 20)
  const splitA = stratifiedSplit(items, (i) => i.label, { trainRatio: 0.6, valRatio: 0.2, seed: 42 })
  const splitB = stratifiedSplit(items, (i) => i.label, { trainRatio: 0.6, valRatio: 0.2, seed: 42 })

  assert.deepEqual(
    splitA.train.map((i) => i.id),
    splitB.train.map((i) => i.id)
  )
  assert.deepEqual(
    splitA.val.map((i) => i.id),
    splitB.val.map((i) => i.id)
  )
  assert.deepEqual(
    splitA.test.map((i) => i.id),
    splitB.test.map((i) => i.id)
  )
})

test("preserves label proportions within each split (stratified, not a plain shuffle-split)", () => {
  const items = makeItems(100, 100)
  const { train, val, test: testSet } = stratifiedSplit(items, (i) => i.label, {
    trainRatio: 0.6,
    valRatio: 0.2,
    seed: 7
  })

  for (const split of [train, val, testSet]) {
    const aCount = split.filter((i) => i.label === "a").length
    const bCount = split.filter((i) => i.label === "b").length
    // With a 50/50 source population, each split should stay close to 50/50 --
    // an unstratified random split on a small n could easily drift further.
    assert.ok(Math.abs(aCount - bCount) <= 2, `expected near-even split, got a=${aCount} b=${bCount}`)
  }
})

test("throws if trainRatio + valRatio exceeds 1 (leaves no room for a test split)", () => {
  const items = makeItems(10, 10)
  assert.throws(() => stratifiedSplit(items, (i) => i.label, { trainRatio: 0.7, valRatio: 0.5, seed: 1 }))
})
