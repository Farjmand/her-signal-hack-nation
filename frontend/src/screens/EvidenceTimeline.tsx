import { useEffect, useState } from "react"
import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { EvidenceCard } from "@/components/EvidenceCard"
import { SafetyBanner } from "@/components/SafetyBanner"
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
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Your evidence timeline</h1>
          <div className="flex gap-2">
            <Link to="/consent" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Share with research
            </Link>
            <Link to="/" className={buttonVariants({ size: "sm" })}>
              Capture new entry
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && capsules.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No entries yet. Capture your first one to start building your timeline.
          </p>
        )}

        <div className="space-y-3">
          {capsules.map((capsule) => (
            <EvidenceCard key={capsule.event_id} capsule={capsule} />
          ))}
        </div>
      </div>
    </main>
  )
}
