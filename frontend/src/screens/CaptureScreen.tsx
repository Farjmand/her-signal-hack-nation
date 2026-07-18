import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SafetyBanner } from "@/components/SafetyBanner"
import { extractCapsule } from "@/lib/api"

export function CaptureScreen() {
  const [sourceText, setSourceText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit() {
    if (!sourceText.trim()) return
    setLoading(true)
    setError(null)
    try {
      const capsule = await extractCapsule(sourceText)
      navigate("/review", { state: { capsule } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-4">
        <SafetyBanner />
        <Card>
          <CardHeader>
            <CardTitle>What happened today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g. I had sharp pelvic pain today, slept four hours, and had to leave work early."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={5}
              disabled={loading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading || !sourceText.trim()} className="w-full">
              {loading ? "Extracting..." : "Capture"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
