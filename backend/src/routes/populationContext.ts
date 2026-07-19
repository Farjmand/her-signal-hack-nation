import fs from "node:fs"
import path from "node:path"
import { Router } from "express"
import { z } from "zod"
import { findAgeBand, type PopulationContextData } from "../populationContext.js"

export const populationContextRouter = Router()

const dataPath = path.resolve(import.meta.dirname, "../data/nhanesPopulationContext.json")
const populationContextData: PopulationContextData = JSON.parse(fs.readFileSync(dataPath, "utf-8"))

const MIN_AGE = 18
const MAX_AGE = 59

const AgeQuerySchema = z.object({
  age: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE)
})

// Population-level NHANES statistics only -- never an individual prediction,
// diagnosis, or risk assessment. Mirrors the "no diagnosis" discipline
// enforced in ../routes/extract.ts's system prompt.
populationContextRouter.get("/", (req, res) => {
  const parsed = AgeQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: `age must be a whole number between ${MIN_AGE} and ${MAX_AGE}` })
    return
  }

  const band = findAgeBand(parsed.data.age, populationContextData)
  if (!band) {
    res.status(404).json({ error: "No population data available for this age" })
    return
  }

  res.status(200).json({
    ageBand: band.band,
    n: band.n,
    distribution: band.distribution,
    source: populationContextData.source,
    disclaimer: populationContextData.disclaimer
  })
})
