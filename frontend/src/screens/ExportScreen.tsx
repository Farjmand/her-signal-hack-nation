import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SafetyBanner } from "@/components/SafetyBanner"
import { fetchCapsules, fetchConsentReceipts, revokeConsent } from "@/lib/api"
import { buildResearchBundle, downloadJson } from "@/lib/deidentify"
import { FIELD_LABELS, type ShareableField } from "@/lib/mockStudy"
import type { ConsentReceipt } from "@/lib/types"

export function ExportScreen() {
  const [receipts, setReceipts] = useState<ConsentReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetchConsentReceipts()
      .then(setReceipts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load consent receipts."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleRevoke(receiptId: string) {
    setBusyId(receiptId)
    try {
      await revokeConsent(receiptId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke consent.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport(receipt: ConsentReceipt) {
    setBusyId(receipt.receipt_id)
    setError(null)
    try {
      const capsules = await fetchCapsules()
      const bundle = await buildResearchBundle(receipt, capsules)
      const stamp = new Date().toISOString().replace(/[:.]/g, "-")
      downloadJson(`hersignal-research-bundle-${stamp}.json`, bundle)
      downloadJson(`hersignal-consent-receipt-${stamp}.json`, receipt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-svh p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <SafetyBanner />
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Consent &amp; export</h1>
          <Link to="/timeline" className={buttonVariants({ size: "sm", variant: "outline" })}>
            Back to timeline
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          This is a de-identification prototype for demo purposes — it is not a certified or
          regulatory-compliant de-identification process.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && receipts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No consent decisions yet.{" "}
            <Link to="/consent" className="underline">
              Review a study request
            </Link>
            .
          </p>
        )}

        <div className="space-y-3">
          {receipts.map((receipt) => {
            const granted = receipt.fields.filter((f) => f.granted)
            return (
              <Card key={receipt.receipt_id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{receipt.study_name}</CardTitle>
                  {receipt.revoked ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {new Date(receipt.timestamp).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {granted.length === 0 && (
                      <span className="text-xs text-muted-foreground">No fields granted</span>
                    )}
                    {granted.map((f) => (
                      <Badge key={f.field} variant="outline">
                        {FIELD_LABELS[f.field as ShareableField] ?? f.field}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={receipt.revoked || granted.length === 0 || busyId === receipt.receipt_id}
                      onClick={() => handleExport(receipt)}
                    >
                      {busyId === receipt.receipt_id ? "Working..." : "Export bundle + receipt"}
                    </Button>
                    {!receipt.revoked && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === receipt.receipt_id}
                        onClick={() => handleRevoke(receipt.receipt_id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
