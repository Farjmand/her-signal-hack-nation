import type { Sample } from "./classifier.ts"

export interface AgeBand {
  band: string
  minAge: number
  maxAge: number
  n: number
  distribution: Record<string, number>
}

/**
 * Groups labeled samples into fixed-width age bands, computing each band's
 * normalized label distribution. Used to build the static population-context
 * data the backend serves -- this is population-level aggregation, not a
 * per-individual prediction.
 */
export function binByAgeBand(samples: Sample[], bandWidth: number, minAge: number, maxAge: number): AgeBand[] {
  if (minAge >= maxAge) {
    throw new Error("minAge must be less than maxAge")
  }

  const bands: AgeBand[] = []
  for (let start = minAge; start <= maxAge; start += bandWidth) {
    const end = Math.min(start + bandWidth - 1, maxAge)
    bands.push({ band: `${start}-${end}`, minAge: start, maxAge: end, n: 0, distribution: {} })
  }

  const counts = new Map<string, Map<string, number>>()
  for (const sample of samples) {
    const owningBand = bands.find((b) => sample.age >= b.minAge && sample.age <= b.maxAge)
    if (!owningBand) continue
    const labelCounts = counts.get(owningBand.band) ?? new Map<string, number>()
    labelCounts.set(sample.label, (labelCounts.get(sample.label) ?? 0) + 1)
    counts.set(owningBand.band, labelCounts)
  }

  return bands.map((band) => {
    const labelCounts = counts.get(band.band)
    if (!labelCounts) return band // n: 0, distribution: {} as initialized above

    const n = [...labelCounts.values()].reduce((a, b) => a + b, 0)
    const distribution: Record<string, number> = {}
    for (const [label, count] of labelCounts) distribution[label] = count / n
    return { ...band, n, distribution }
  })
}
