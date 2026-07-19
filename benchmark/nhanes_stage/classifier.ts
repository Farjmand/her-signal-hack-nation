/**
 * Explainable single-feature (age) decision-stump baseline. Deliberately
 * chosen over a black-box model per the project's "reproducibility and
 * explainability over sheer size" goal -- the fitted tree's thresholds can
 * be read directly out of results.md as "predict X if age < N".
 *
 * Age is the only non-circular feature available: the stage label itself is
 * derived from the same survey's RHQ031/RHQ060 answers, so using those as
 * model inputs would leak the label. Age alone is a fair, realistic feature
 * to evaluate against.
 */
export interface Sample {
  age: number
  label: string
}

export type StumpNode =
  | { type: "leaf"; label: string }
  | { type: "split"; threshold: number; left: StumpNode; right: StumpNode }

function majorityLabel(samples: Sample[]): string {
  const counts = new Map<string, number>()
  for (const s of samples) counts.set(s.label, (counts.get(s.label) ?? 0) + 1)
  let best = samples[0].label
  let bestCount = -1
  // Iterate in a stable, deterministic order (insertion order of first
  // occurrence) so ties resolve consistently across runs.
  for (const [label, count] of counts) {
    if (count > bestCount) {
      best = label
      bestCount = count
    }
  }
  return best
}

function misclassifications(samples: Sample[]): number {
  const majority = majorityLabel(samples)
  return samples.filter((s) => s.label !== majority).length
}

function bestThreshold(samples: Sample[]): { threshold: number; error: number } | null {
  const uniqueAges = [...new Set(samples.map((s) => s.age))].sort((a, b) => a - b)
  if (uniqueAges.length < 2) return null

  let best: { threshold: number; error: number } | null = null
  for (let i = 0; i < uniqueAges.length - 1; i++) {
    const threshold = (uniqueAges[i] + uniqueAges[i + 1]) / 2
    const left = samples.filter((s) => s.age < threshold)
    const right = samples.filter((s) => s.age >= threshold)
    const error = misclassifications(left) + misclassifications(right)
    if (best === null || error < best.error) {
      best = { threshold, error }
    }
  }
  return best
}

export function fitAgeStump(samples: Sample[], maxDepth: number): StumpNode {
  if (samples.length === 0) {
    throw new Error("Cannot fit a stump on an empty training set")
  }

  if (maxDepth <= 0) {
    return { type: "leaf", label: majorityLabel(samples) }
  }

  const allSameLabel = samples.every((s) => s.label === samples[0].label)
  if (allSameLabel) {
    return { type: "leaf", label: samples[0].label }
  }

  const split = bestThreshold(samples)
  if (split === null || split.error >= misclassifications(samples)) {
    // No split improves on just predicting the majority class -- stop here.
    return { type: "leaf", label: majorityLabel(samples) }
  }

  const left = samples.filter((s) => s.age < split.threshold)
  const right = samples.filter((s) => s.age >= split.threshold)

  return {
    type: "split",
    threshold: split.threshold,
    left: fitAgeStump(left, maxDepth - 1),
    right: fitAgeStump(right, maxDepth - 1)
  }
}

export function predictAgeStump(node: StumpNode, age: number): string {
  if (node.type === "leaf") return node.label
  return age < node.threshold ? predictAgeStump(node.left, age) : predictAgeStump(node.right, age)
}
