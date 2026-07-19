import { useState } from "react"
import { useNavigate } from "react-router"
import { Mic, Square, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SafetyBanner } from "@/components/SafetyBanner"
import { Eyebrow } from "@/components/Eyebrow"
import { extractCapsule } from "@/lib/api"
import { useSpeechRecognition } from "@/lib/useSpeechRecognition"

export function CaptureScreen() {
  const [sourceText, setSourceText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const { isSupported: voiceSupported, isListening, error: voiceError, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      setSourceText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    },
  })

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
    <main className="p-4">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <SafetyBanner />

        <div>
          <Eyebrow>New entry</Eyebrow>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-balance">
            Say what happened, in your own words
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A sentence is enough. AI drafts the structured fields — nothing is saved until you review it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-mono font-medium uppercase tracking-wide text-muted-foreground">
              Today's note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g. I had sharp pelvic pain today, slept four hours, and had to leave work early."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={5}
              disabled={loading}
              className="text-[15px]"
            />
            {voiceSupported && (
              <Button
                type="button"
                variant="outline"
                aria-label={isListening ? "Stop voice recording" : "Record symptom by voice"}
                onClick={isListening ? stop : start}
                disabled={loading}
                className="w-full"
              >
                {isListening ? (
                  <>
                    <Square className="animate-pulse" /> Stop recording
                  </>
                ) : (
                  <>
                    <Mic /> Record symptom by voice
                  </>
                )}
              </Button>
            )}
            {voiceError && <p className="text-sm text-destructive">{voiceError}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading || !sourceText.trim()} className="h-11 w-full text-[14.5px]">
              {loading ? "Extracting..." : "Save entry"}
              {!loading && <ArrowRight className="ml-1" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
