import { test } from "node:test"
import assert from "node:assert/strict"
import { binByAgeBand } from "./ageBands.ts"
import type { Sample } from "./classifier.ts"

test("groups samples into fixed-width age bands within [minAge, maxAge]", () => {
  const samples: Sample[] = [
    { age: 18, label: "a" },
    { age: 20, label: "a" },
    { age: 25, label: "b" }
  ]
  const bands = binByAgeBand(samples, 5, 18, 29)

  assert.deepEqual(
    bands.map((b) => b.band),
    ["18-22", "23-27", "28-29"]
  )
})

test("computes n and a normalized label distribution per band", () => {
  const samples: Sample[] = [
    { age: 20, label: "premenopausal" },
    { age: 21, label: "premenopausal" },
    { age: 22, label: "postmenopausal" }
  ]
  const bands = binByAgeBand(samples, 5, 18, 22)

  assert.equal(bands.length, 1)
  assert.equal(bands[0].n, 3)
  assert.equal(bands[0].distribution.premenopausal, 2 / 3)
  assert.equal(bands[0].distribution.postmenopausal, 1 / 3)
})

test("last band is truncated rather than overshooting maxAge", () => {
  const bands = binByAgeBand([], 5, 18, 21)
  assert.deepEqual(
    bands.map((b) => b.band),
    ["18-21"]
  )
})

test("reports n=0 and an empty distribution for a band with no samples, rather than omitting it", () => {
  const samples: Sample[] = [{ age: 20, label: "a" }]
  const bands = binByAgeBand(samples, 5, 18, 29)

  // Every band in range is present (so a lookup by age never silently
  // misses a band) even though only "18-22" has any samples.
  assert.deepEqual(
    bands.map((b) => b.band),
    ["18-22", "23-27", "28-29"]
  )
  const emptyBand = bands.find((b) => b.band === "23-27")
  assert.equal(emptyBand?.n, 0)
  assert.deepEqual(emptyBand?.distribution, {})
})

test("throws if minAge is not less than maxAge", () => {
  assert.throws(() => binByAgeBand([], 5, 30, 20))
})
