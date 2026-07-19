import { useEffect, useState } from "react"
import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { EvidenceCard } from "@/components/EvidenceCard"
import { SafetyBanner } from "@/components/SafetyBanner"
import { Eyebrow } from "@/components/Eyebrow"
import { fetchCapsules } from "@/lib/api"
import type { EvidenceCapsule } from "@/lib/types"

export function EvidenceTimeline() {
  const [capsules, setCapsules] = useState<EvidenceCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCapsules()
      .then(setCapsules)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load timeline."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />

        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Timeline</Eyebrow>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Your evidence, ready for an appointment
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link to="/consent" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Share
            </Link>
            <Link to="/" className={buttonVariants({ size: "sm" })}>
              New entry
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && capsules.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No entries yet. Capture your first one to start building your timeline.
          </p>
        )}

        <div>
          {capsules.map((capsule) => (
            <EvidenceCard key={capsule.event_id} capsule={capsule} />
          ))}
        </div>
      </div>
    </main>
  )
}
