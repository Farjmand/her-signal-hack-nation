import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafetyBanner } from "@/components/SafetyBanner"

// Full de-identified bundle + receipt export lands in Task 4.3.
export function ExportScreen() {
  return (
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <Card>
          <CardHeader>
            <CardTitle>Export (placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consent saved. Export UI lands next.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
