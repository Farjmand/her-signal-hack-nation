export interface PredictionEntry {
  actual: string
  predicted: string
}

export function accuracy(entries: PredictionEntry[]): number {
  if (entries.length === 0) return 0
  const correct = entries.filter((e) => e.actual === e.predicted).length
  return correct / entries.length
}

export function confusionMatrix(entries: PredictionEntry[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>()
  for (const { actual, predicted } of entries) {
    const row = matrix.get(actual) ?? new Map<string, number>()
    row.set(predicted, (row.get(predicted) ?? 0) + 1)
    matrix.set(actual, row)
  }
  return matrix
}

export interface PrecisionRecall {
  precision: number | undefined
  recall: number
}

export function perClassPrecisionRecall(entries: PredictionEntry[]): Map<string, PrecisionRecall> {
  const classes = new Set<string>()
  for (const { actual, predicted } of entries) {
    classes.add(actual)
    classes.add(predicted)
  }

  const result = new Map<string, PrecisionRecall>()
  for (const cls of classes) {
    const actualCount = entries.filter((e) => e.actual === cls).length
    const predictedCount = entries.filter((e) => e.predicted === cls).length
    const correct = entries.filter((e) => e.actual === cls && e.predicted === cls).length

    result.set(cls, {
      // A class that was never predicted has no meaningful precision --
      // report it as absent rather than a misleading 0/0 -> 0.
      precision: predictedCount === 0 ? undefined : correct / predictedCount,
      recall: actualCount === 0 ? 0 : correct / actualCount
    })
  }
  return result
}
