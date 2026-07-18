import fs from "node:fs"
import path from "node:path"
import Ajv2020 from "ajv/dist/2020.js"
import addFormats from "ajv-formats"

const rootDir = path.resolve(import.meta.dirname, "..")
const examplesDir = path.resolve(import.meta.dirname)
const schemaPath = path.join(rootDir, "schema/evidence-capsule.schema.json")

const capsuleSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))

// Each example's `expected` is a partial EvidenceCapsule (it omits
// event_id/reported_at/user_verified/consent_scope, assigned at capture
// time). Validate it against a derived schema that drops those from
// `required` but keeps every field's type/enum constraints intact.
const expectedSchema = {
  ...capsuleSchema,
  required: capsuleSchema.required.filter(
    (f: string) =>
      !["event_id", "reported_at", "source_text", "ai_confidence", "user_verified", "consent_scope"].includes(f)
  )
}

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validateExpected = ajv.compile(expectedSchema)

const files = fs
  .readdirSync(examplesDir)
  .filter((f) => f.endsWith(".json"))
  .sort()

if (files.length < 20) {
  console.error(`Expected at least 20 example files, found ${files.length}`)
  process.exit(1)
}

let failures = 0
let needsReviewCount = 0

for (const file of files) {
  const full = path.join(examplesDir, file)
  const content = JSON.parse(fs.readFileSync(full, "utf-8"))

  if (typeof content.source_text !== "string" || content.source_text.length === 0) {
    console.error(`${file}: missing or empty source_text`)
    failures++
    continue
  }

  if (!content.expected || typeof content.expected !== "object") {
    console.error(`${file}: missing expected object`)
    failures++
    continue
  }

  const valid = validateExpected(content.expected)
  if (!valid) {
    console.error(`${file}: expected block fails schema validation`)
    console.error(validateExpected.errors)
    failures++
    continue
  }

  if (Array.isArray(content.expected.needs_review) && content.expected.needs_review.length > 0) {
    needsReviewCount++
  }
}

console.log(`Validated ${files.length} example files.`)
console.log(`${needsReviewCount} example(s) have a non-empty needs_review (ambiguous cases).`)

if (needsReviewCount < 4) {
  console.error("Expected at least 4 examples with needs_review populated.")
  failures++
}

if (failures > 0) {
  console.error(`${failures} failure(s).`)
  process.exit(1)
}

console.log("All examples valid.")
