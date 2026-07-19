import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SafetyBanner } from "@/components/SafetyBanner"
import { Eyebrow } from "@/components/Eyebrow"
import { cn } from "@/lib/utils"
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
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3.5",
        flagged ? "border-warning/40 bg-warning-tint" : "border-transparent bg-secondary/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {flagged && (
          <Badge className="border-warning/40 bg-transparent font-mono text-[10px] text-warning-foreground" variant="outline">
            Needs review
          </Badge>
        )}
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
      <main className="flex flex-col items-center px-4 pt-14 pb-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No capsule to review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Capture an entry first.{" "}
              <button className="text-primary underline" onClick={() => navigate("/")}>
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
      <main className="flex flex-col items-center px-4 pt-14 pb-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent">
              <Check className="size-6 text-accent-foreground" />
            </div>
            <CardTitle className="mt-3 text-lg">Entry saved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              It's in your timeline, ready to bring to your next appointment.
            </p>
            <Button onClick={() => navigate("/timeline")} className="h-11 w-full">
              View timeline
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="h-11 w-full">
              Log another entry
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />

        <div>
          <Eyebrow>Review before saving</Eyebrow>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Confirm or correct each field</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            AI never silently finalizes health data. Low-confidence fields are flagged — fill them in or
            leave as reported.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1 rounded-lg border bg-secondary/60 p-3.5">
              <Label className="font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                Original note
              </Label>
              <p className="text-sm text-foreground/90 italic">"{capsule.source_text}"</p>
              <p className="pt-1 text-xs text-muted-foreground">
                AI confidence: {Math.round(capsule.ai_confidence * 100)}%
              </p>
            </div>

            <FieldWrapper field="symptoms" needsReview={nr} label="Symptoms (comma-separated)">
              <Input value={symptomsText} onChange={(e) => setSymptomsText(e.target.value)} className="bg-background" />
            </FieldWrapper>

            <FieldWrapper field="severity" needsReview={nr} label="Severity">
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                value={capsule.severity}
                onChange={(e) => update("severity", e.target.value as Severity)}
              >
                <option value="low">Low</option>
                <option value="medium">Moderate</option>
                <option value="high">High</option>
              </select>
            </FieldWrapper>

            <FieldWrapper field="duration" needsReview={nr} label="Duration">
              <Input
                value={capsule.duration ?? ""}
                onChange={(e) => update("duration", e.target.value || null)}
                placeholder="Not stated — add an estimate"
                className="bg-background"
              />
            </FieldWrapper>

            <FieldWrapper field="functional_impact" needsReview={nr} label="Functional impact">
              <Textarea
                value={capsule.functional_impact}
                onChange={(e) => update("functional_impact", e.target.value)}
                className="bg-background"
              />
            </FieldWrapper>

            <FieldWrapper field="sleep_hours" needsReview={nr} label="Sleep hours">
              <Input
                type="number"
                min={0}
                max={24}
                value={capsule.sleep_hours ?? ""}
                onChange={(e) => update("sleep_hours", e.target.value === "" ? null : Number(e.target.value))}
                className="bg-background"
              />
            </FieldWrapper>

            <FieldWrapper field="cycle_context" needsReview={nr} label="Cycle context (optional)">
              <Input
                value={capsule.cycle_context ?? ""}
                onChange={(e) => update("cycle_context", e.target.value || null)}
                placeholder="Not stated in note"
                className="bg-background"
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
                placeholder="Not stated in note"
                className="bg-background"
              />
            </FieldWrapper>

            <FieldWrapper field="wearable_context" needsReview={nr} label="Wearable context (optional)">
              <Input
                value={capsule.wearable_context ?? ""}
                onChange={(e) => update("wearable_context", e.target.value || null)}
                className="bg-background"
              />
            </FieldWrapper>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <Button onClick={handleAccept} disabled={saving} className="h-11 w-full">
              {saving ? "Saving..." : "Save to timeline"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
