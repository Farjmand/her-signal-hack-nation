import { test } from "node:test"
import assert from "node:assert/strict"
import { findAgeBand, type PopulationContextData } from "./populationContext.js"

const sampleData: PopulationContextData = {
  source: "test source",
  generatedAt: "2020-01-01T00:00:00.000Z",
  disclaimer: "test disclaimer",
  ageBands: [
    { band: "18-22", minAge: 18, maxAge: 22, n: 10, distribution: { premenopausal: 1 } },
    { band: "23-27", minAge: 23, maxAge: 27, n: 5, distribution: { premenopausal: 0.8, postmenopausal: 0.2 } }
  ]
}

test("finds the band containing a given age", () => {
  const band = findAgeBand(25, sampleData)
  assert.equal(band?.band, "23-27")
})

test("matches the lower boundary of a band (inclusive)", () => {
  const band = findAgeBand(23, sampleData)
  assert.equal(band?.band, "23-27")
})

test("matches the upper boundary of a band (inclusive)", () => {
  const band = findAgeBand(22, sampleData)
  assert.equal(band?.band, "18-22")
})

test("returns null for an age outside every band's range", () => {
  const band = findAgeBand(100, sampleData)
  assert.equal(band, null)
})
