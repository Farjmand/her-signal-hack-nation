import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SafetyBanner } from "@/components/SafetyBanner"
import { saveCapsule } from "@/lib/api"
import type { EvidenceCapsule, EvidenceCapsuleFieldName, Severity } from "@/lib/types"

interface ReviewLocationState {
  capsule: EvidenceCapsule
}

interface FieldWrapperProps {
  readonly field: EvidenceCapsuleFieldName
  readonly needsReview: EvidenceCapsuleFieldName[]
  readonly label: string
  readonly children: React.ReactNode
}

function FieldWrapper({ field, needsReview, label, children }: FieldWrapperProps) {
  const flagged = needsReview.includes(field)
  return (
    <div className={`space-y-1 rounded-md p-2 ${flagged ? "border border-amber-400 bg-amber-50 dark:bg-amber-950" : ""}`}>
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {flagged && <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">Needs review</Badge>}
      </div>
      {children}
    </div>
  )
}

export function ReviewScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const initial = (location.state as ReviewLocationState | null)?.capsule ?? null

  const [capsule, setCapsule] = useState<EvidenceCapsule | null>(initial)
  const [symptomsText, setSymptomsText] = useState(initial?.symptoms.join(", ") ?? "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!capsule) {
    return (
      <main className="min-h-svh flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No capsule to review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Capture an entry first.{" "}
              <button className="underline" onClick={() => navigate("/")}>
                Go back
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  function update<K extends keyof EvidenceCapsule>(key: K, value: EvidenceCapsule[K]) {
    setCapsule((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleAccept() {
    if (!capsule) return
    const finalCapsule: EvidenceCapsule = {
      ...capsule,
      symptoms: symptomsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      user_verified: true
    }
    setSaving(true)
    setSaveError(null)
    try {
      await saveCapsule(finalCapsule)
      setCapsule(finalCapsule)
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const nr = capsule.needs_review

  if (saved) {
    return (
      <main className="min-h-svh flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Saved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your evidence capsule was recorded.
            </p>
            <Button onClick={() => navigate("/timeline")} className="w-full">
              View timeline
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Capture another entry
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <Card>
          <CardHeader>
            <CardTitle>Review your entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Original note</Label>
              <p className="rounded-md border bg-muted/50 p-2 text-sm text-muted-foreground">
                {capsule.source_text}
              </p>
              <p className="text-xs text-muted-foreground">
                AI confidence: {Math.round(capsule.ai_confidence * 100)}%
              </p>
            </div>

            <FieldWrapper field="symptoms" needsReview={nr} label="Symptoms (comma-separated)">
              <Input value={symptomsText} onChange={(e) => setSymptomsText(e.target.value)} />
            </FieldWrapper>

            <FieldWrapper field="severity" needsReview={nr} label="Severity">
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                value={capsule.severity}
                onChange={(e) => update("severity", e.target.value as Severity)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FieldWrapper>

            <FieldWrapper field="duration" needsReview={nr} label="Duration">
              <Input
                value={capsule.duration ?? ""}
                onChange={(e) => update("duration", e.target.value || null)}
              />
            </FieldWrapper>

            <FieldWrapper field="functional_impact" needsReview={nr} label="Functional impact">
              <Textarea
                value={capsule.functional_impact}
                onChange={(e) => update("functional_impact", e.target.value)}
              />
            </FieldWrapper>

            <FieldWrapper field="sleep_hours" needsReview={nr} label="Sleep hours">
              <Input
                type="number"
                min={0}
                max={24}
                value={capsule.sleep_hours ?? ""}
                onChange={(e) => update("sleep_hours", e.target.value === "" ? null : Number(e.target.value))}
              />
            </FieldWrapper>

            <FieldWrapper field="cycle_context" needsReview={nr} label="Cycle context (optional)">
              <Input
                value={capsule.cycle_context ?? ""}
                onChange={(e) => update("cycle_context", e.target.value || null)}
              />
            </FieldWrapper>

            <FieldWrapper
              field="hormone_therapy_or_contraception_context"
              needsReview={nr}
              label="Hormone therapy / contraception context (optional)"
            >
              <Input
                value={capsule.hormone_therapy_or_contraception_context ?? ""}
                onChange={(e) =>
                  update("hormone_therapy_or_contraception_context", e.target.value || null)
                }
              />
            </FieldWrapper>

            <FieldWrapper field="wearable_context" needsReview={nr} label="Wearable context (optional)">
              <Input
                value={capsule.wearable_context ?? ""}
                onChange={(e) => update("wearable_context", e.target.value || null)}
              />
            </FieldWrapper>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <Button onClick={handleAccept} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Accept and save"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
