import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SafetyBanner } from "@/components/SafetyBanner"
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
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <Card>
          <CardHeader>
            <CardTitle>{MOCK_STUDY.study_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Requesting: </span>
                {MOCK_STUDY.recipient}
              </p>
              <p>
                <span className="text-muted-foreground">Purpose: </span>
                {MOCK_STUDY.purpose}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">
                Choose which field categories to share. Nothing is shared by default.
              </p>
              {MOCK_STUDY.requested_fields.map((field) => (
                <div key={field} className="flex items-center justify-between">
                  <Label htmlFor={`grant-${field}`}>{FIELD_LABELS[field]}</Label>
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

            <Button onClick={handleSubmit} disabled={saving} className="w-full">
              {saving
                ? "Saving..."
                : grantedCount === 0
                  ? "Save decision (sharing nothing)"
                  : `Save decision (sharing ${grantedCount} field${grantedCount === 1 ? "" : "s"})`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
