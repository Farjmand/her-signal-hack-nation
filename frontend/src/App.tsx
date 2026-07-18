import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function App() {
  return (
    <main className="min-h-svh flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>HerSignal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Scaffold is running. Screens land in later tasks.
          </p>
          <Badge variant="secondary">Not medical advice</Badge>
        </CardContent>
      </Card>
    </main>
  )
}

export default App
