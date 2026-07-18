import { Router } from "express"
import type { EvidenceCapsule } from "../types.js"

export const capsulesRouter = Router()

// Stub — replaced with real persistence in Phase 2 (Task 2.3).
capsulesRouter.get("/", (_req, res) => {
  const capsules: EvidenceCapsule[] = []
  res.status(200).json(capsules)
})
