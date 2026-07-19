import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SafetyBanner } from "@/components/SafetyBanner"
import { Eyebrow } from "@/components/Eyebrow"
import { submitConsent } from "@/lib/api"
import { MOCK_STUDY, FIELD_LABELS } from "@/lib/mockStudy"

export function ConsentScreen() {
  const navigate = useNavigate()
  const [grants, setGrants] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_STUDY.requested_fields.map((f) => [f, false]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grantedCount = Object.values(grants).filter(Boolean).length

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      await submitConsent({
        study_id: MOCK_STUDY.study_id,
        study_name: MOCK_STUDY.study_name,
        purpose: MOCK_STUDY.purpose,
        recipient: MOCK_STUDY.recipient,
        fields: MOCK_STUDY.requested_fields.map((field) => ({ field, granted: grants[field] }))
      })
      navigate("/export")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your consent decision.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />

        <div>
          <Eyebrow>Research study</Eyebrow>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{MOCK_STUDY.study_name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{MOCK_STUDY.recipient}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Purpose</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{MOCK_STUDY.purpose}</CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Approve or decline each category — nothing is shared by default.
            </p>

            <div className="space-y-2">
              {MOCK_STUDY.requested_fields.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/60 px-3.5 py-3"
                >
                  <Label htmlFor={`grant-${field}`} className="text-sm font-medium">
                    {FIELD_LABELS[field]}
                  </Label>
                  <Switch
                    id={`grant-${field}`}
                    checked={grants[field]}
                    onCheckedChange={(checked) => setGrants((g) => ({ ...g, [field]: checked }))}
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Your original note text and wearable context are never shared with this study.
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSubmit} disabled={saving} className="h-11 w-full">
              {saving
                ? "Saving..."
                : grantedCount === 0
                  ? "Save decision (sharing nothing)"
                  : `Approve & generate receipt (${grantedCount} field${grantedCount === 1 ? "" : "s"})`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
