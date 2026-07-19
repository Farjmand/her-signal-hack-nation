import { useState } from "react"
import { useNavigate } from "react-router"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SafetyBanner } from "@/components/SafetyBanner"
import { Eyebrow } from "@/components/Eyebrow"
import { setStoredAge } from "@/lib/userProfile"

export function WelcomeScreen() {
  const [ageInput, setAgeInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function handleContinue() {
    const age = Number(ageInput)
    if (!ageInput.trim() || !Number.isFinite(age) || !Number.isInteger(age) || age <= 0) {
      setError("Enter your age as a whole number to continue.")
      return
    }
    setStoredAge(age)
    navigate("/", { replace: true })
  }

  return (
    <main className="p-4">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <SafetyBanner />

        <div>
          <Eyebrow>Welcome</Eyebrow>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-balance">Before you start</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We only ask for your age — never your name. It's stored on this device only, never sent anywhere as
            part of an entry, and used only to show you real national health-survey context (NHANES) alongside
            your own entries, for ages 18–59.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-mono font-medium uppercase tracking-wide text-muted-foreground">
              Your age
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="welcome-age">Age</Label>
              <Input
                id="welcome-age"
                type="number"
                min={1}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="e.g. 34"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleContinue} className="h-11 w-full text-[14.5px]">
              Continue
              <ArrowRight className="ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
