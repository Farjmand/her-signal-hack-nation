import type { EvidenceCapsule } from "@/lib/types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export async function fetchCapsules(): Promise<EvidenceCapsule[]> {
  const res = await fetch(`${API_URL}/api/capsules`)
  if (!res.ok) throw new Error(`Failed to fetch capsules: ${res.status}`)
  return res.json()
}

export async function extractCapsule(sourceText: string): Promise<EvidenceCapsule> {
  const res = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_text: sourceText })
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Extraction failed: ${res.status}`)
  }
  return res.json()
}

export async function saveCapsule(capsule: EvidenceCapsule): Promise<EvidenceCapsule> {
  const res = await fetch(`${API_URL}/api/capsules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capsule)
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Save failed: ${res.status}`)
  }
  return res.json()
}
