import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EvidenceCapsule, PopulationContext, Severity } from "@/lib/types"

function formatDistributionLabel(label: string): string {
  return label.replaceAll("_", " ")
}

const severityDot: Record<Severity, string> = {
  low: "bg-muted-foreground/50",
  medium: "bg-chart-2",
  high: "bg-warning"
}

const severityText: Record<Severity, string> = {
  low: "text-muted-foreground",
  medium: "text-accent-foreground",
  high: "text-warning-foreground"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

export function EvidenceCard({
  capsule,
  populationContext
}: {
  readonly capsule: EvidenceCapsule
  readonly populationContext?: PopulationContext | null
}) {
  const hasContext =
    capsule.cycle_context || capsule.hormone_therapy_or_contraception_context || capsule.wearable_context

  return (
    <div className="flex gap-3 pb-3">
      <div className="flex w-3 shrink-0 flex-col items-center pt-1.5">
        <span className={cn("size-2.5 rounded-full", severityDot[capsule.severity])} />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10.5px] text-muted-foreground">{formatDate(capsule.reported_at)}</p>
            <CardTitle className="mt-0.5 text-base">{capsule.symptoms.join(", ")}</CardTitle>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={cn("font-mono text-[10px] font-medium uppercase tracking-wide", severityText[capsule.severity])}>
              {capsule.severity}
            </span>
            {capsule.user_verified && (
              <Badge variant="secondary" className="text-[10px]">
                Verified
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
            <div className="space-y-0.5 pt-1 text-xs text-muted-foreground">
              {capsule.cycle_context && <p>Cycle: {capsule.cycle_context}</p>}
              {capsule.hormone_therapy_or_contraception_context && (
                <p>Hormone/contraception: {capsule.hormone_therapy_or_contraception_context}</p>
              )}
              {capsule.wearable_context && <p>Wearable: {capsule.wearable_context}</p>}
            </div>
          )}
          {populationContext && (
            <div className="mt-2 space-y-1 rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
              <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-primary">
                Population context (NHANES)
              </p>
              <p>
                Respondents aged {populationContext.ageBand} in a national health survey most commonly reported:{" "}
                {Object.entries(populationContext.distribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 1)
                  .map(([label, share]) => `${formatDistributionLabel(label)} (${(share * 100).toFixed(0)}%)`)}
                . General population context, not specific to this entry's symptom.
              </p>
              <p>{populationContext.disclaimer}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
