import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EvidenceCapsule, Severity } from "@/lib/types"

const severityVariant: Record<Severity, "secondary" | "outline" | "destructive"> = {
  low: "secondary",
  medium: "outline",
  high: "destructive"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

export function EvidenceCard({ capsule }: { readonly capsule: EvidenceCapsule }) {
  const hasContext =
    capsule.cycle_context || capsule.hormone_therapy_or_contraception_context || capsule.wearable_context

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{capsule.symptoms.join(", ")}</CardTitle>
          <p className="text-xs text-muted-foreground">{formatDate(capsule.reported_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={severityVariant[capsule.severity]}>{capsule.severity}</Badge>
          {capsule.user_verified && (
            <Badge variant="secondary" className="text-[10px]">
              User verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {capsule.functional_impact && capsule.functional_impact !== "none reported" && (
          <p>
            <span className="text-muted-foreground">Impact: </span>
            {capsule.functional_impact}
          </p>
        )}
        {capsule.duration && (
          <p>
            <span className="text-muted-foreground">Duration: </span>
            {capsule.duration}
          </p>
        )}
        {capsule.sleep_hours !== null && (
          <p>
            <span className="text-muted-foreground">Sleep: </span>
            {capsule.sleep_hours}h
          </p>
        )}
        {hasContext && (
          <div className="pt-1 text-xs text-muted-foreground">
            {capsule.cycle_context && <p>Cycle: {capsule.cycle_context}</p>}
            {capsule.hormone_therapy_or_contraception_context && (
              <p>Hormone/contraception: {capsule.hormone_therapy_or_contraception_context}</p>
            )}
            {capsule.wearable_context && <p>Wearable: {capsule.wearable_context}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
