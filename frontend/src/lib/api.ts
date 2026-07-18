import type { EvidenceCapsule } from "@/lib/types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export async function fetchCapsules(): Promise<EvidenceCapsule[]> {
  const res = await fetch(`${API_URL}/api/capsules`)
  if (!res.ok) throw new Error(`Failed to fetch capsules: ${res.status}`)
  return res.json()
}
