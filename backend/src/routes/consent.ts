import { randomUUID } from "node:crypto"
import { Router } from "express"
import { z } from "zod"
import { db } from "../db.js"
import type { ConsentReceipt } from "../types.js"

export const consentRouter = Router()

export const CONSENT_SCHEMA_VERSION = "1.0.0"

const ConsentRequestSchema = z.object({
  study_id: z.string().min(1),
  study_name: z.string().min(1),
  purpose: z.string().min(1),
  recipient: z.string().min(1),
  fields: z.array(z.object({ field: z.string().min(1), granted: z.boolean() })).min(1)
})

interface ConsentRow {
  receipt_id: string
  study_id: string
  study_name: string
  purpose: string
  recipient: string
  fields: string
  timestamp: string
  schema_version: string
  revoked: number
  revoked_at: string | null
}

function rowToReceipt(row: ConsentRow): ConsentReceipt {
  return {
    receipt_id: row.receipt_id,
    study_id: row.study_id,
    study_name: row.study_name,
    purpose: row.purpose,
    recipient: row.recipient,
    fields: JSON.parse(row.fields),
    timestamp: row.timestamp,
    schema_version: row.schema_version,
    revoked: Boolean(row.revoked),
    revoked_at: row.revoked_at
  }
}

consentRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM consent_events ORDER BY timestamp DESC").all() as ConsentRow[]
  res.status(200).json(rows.map(rowToReceipt))
})

consentRouter.post("/", (req, res) => {
  const parsed = ConsentRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid consent request", details: z.flattenError(parsed.error) })
    return
  }

  const receipt: ConsentReceipt = {
    receipt_id: randomUUID(),
    study_id: parsed.data.study_id,
    study_name: parsed.data.study_name,
    purpose: parsed.data.purpose,
    recipient: parsed.data.recipient,
    fields: parsed.data.fields,
    timestamp: new Date().toISOString(),
    schema_version: CONSENT_SCHEMA_VERSION,
    revoked: false,
    revoked_at: null
  }

  db.prepare(
    `INSERT INTO consent_events (
      receipt_id, study_id, study_name, purpose, recipient, fields,
      timestamp, schema_version, revoked, revoked_at
    ) VALUES (@receipt_id, @study_id, @study_name, @purpose, @recipient, @fields,
      @timestamp, @schema_version, @revoked, @revoked_at)`
  ).run({
    receipt_id: receipt.receipt_id,
    study_id: receipt.study_id,
    study_name: receipt.study_name,
    purpose: receipt.purpose,
    recipient: receipt.recipient,
    fields: JSON.stringify(receipt.fields),
    timestamp: receipt.timestamp,
    schema_version: receipt.schema_version,
    revoked: 0,
    revoked_at: null
  })

  res.status(201).json(receipt)
})

consentRouter.patch("/:id/revoke", (req, res) => {
  const row = db
    .prepare("SELECT * FROM consent_events WHERE receipt_id = ?")
    .get(req.params.id) as ConsentRow | undefined

  if (!row) {
    res.status(404).json({ error: "Consent receipt not found" })
    return
  }

  const revokedAt = new Date().toISOString()
  db.prepare("UPDATE consent_events SET revoked = 1, revoked_at = ? WHERE receipt_id = ?").run(
    revokedAt,
    req.params.id
  )

  res.status(200).json(rowToReceipt({ ...row, revoked: 1, revoked_at: revokedAt }))
})
