import { useLocation, useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafetyBanner } from "@/components/SafetyBanner"
import type { EvidenceCapsule } from "@/lib/types"

interface ReviewLocationState {
  capsule: EvidenceCapsule
}

export function ReviewScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ReviewLocationState | null

  if (!state?.capsule) {
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

  // Full editable review form lands in Task 2.3 — placeholder shows the raw
  // capsule so Task 2.2's capture -> navigate flow can be verified end-to-end.
  return (
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <Card>
          <CardHeader>
            <CardTitle>Review (placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(state.capsule, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
