import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow } from "@/components/Eyebrow"
import { fetchPopulationContext } from "@/lib/api"
import type { PopulationContext } from "@/lib/types"

function formatLabel(label: string): string {
  return label.replaceAll("_", " ")
}

export function PopulationContextCard() {
  const [ageInput, setAgeInput] = useState("")
  const [context, setContext] = useState<PopulationContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLookup() {
    const age = Number(ageInput)
    setLoading(true)
    setError(null)
    try {
      const result = await fetchPopulationContext(age)
      setContext(result)
    } catch (err) {
      setContext(null)
      setError(err instanceof Error ? err.message : "Failed to load population context.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <Eyebrow>Population context (NHANES)</Eyebrow>
        <CardTitle className="text-base font-normal text-muted-foreground">
          Optional — see how a national health survey's respondents near a given age answered
          reproductive-health questions. This is not about any specific entry above.
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="population-context-age">Age</Label>
            <Input
              id="population-context-age"
              type="number"
              min={18}
              max={59}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup()
              }}
              placeholder="e.g. 45"
            />
          </div>
          <Button type="button" onClick={handleLookup} disabled={loading || ageInput === ""}>
            {loading ? "Loading..." : "Show"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {context && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p>
              Respondents aged <span className="font-medium">{context.ageBand}</span> (n = {context.n}) in{" "}
              {context.source}:
            </p>
            <ul className="space-y-0.5">
              {Object.entries(context.distribution)
                .sort((a, b) => b[1] - a[1])
                .map(([label, share]) => (
                  <li key={label} className="flex justify-between font-mono text-xs">
                    <span className="capitalize">{formatLabel(label)}</span>
                    <span>{(share * 100).toFixed(1)}%</span>
                  </li>
                ))}
            </ul>
            <p className="text-xs text-muted-foreground">{context.disclaimer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
