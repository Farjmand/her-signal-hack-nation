/**
 * Deterministic, stratified train/val/test split. Stratifying by label keeps
 * each split's class balance close to the source population's -- important
 * here because postmenopausal/perimenopausal_indeterminate/premenopausal are
 * not evenly distributed by age, and an unstratified split on a modest-sized
 * benchmark could easily starve one split of a whole class.
 */
export interface SplitOptions {
  trainRatio: number
  valRatio: number
  seed: number
}

export interface SplitResult<T> {
  train: T[]
  val: T[]
  test: T[]
}

// mulberry32: small, deterministic PRNG -- good enough for a reproducible
// benchmark split, not for cryptographic use.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function stratifiedSplit<T>(items: T[], labelOf: (item: T) => string, options: SplitOptions): SplitResult<T> {
  const { trainRatio, valRatio, seed } = options
  if (trainRatio + valRatio > 1) {
    throw new Error("trainRatio + valRatio must not exceed 1 (no room left for a test split)")
  }

  const rand = mulberry32(seed)
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const label = labelOf(item)
    const group = groups.get(label) ?? []
    group.push(item)
    groups.set(label, group)
  }

  const train: T[] = []
  const val: T[] = []
  const test: T[] = []

  for (const group of groups.values()) {
    const shuffled = shuffle(group, rand)
    const trainEnd = Math.round(shuffled.length * trainRatio)
    const valEnd = trainEnd + Math.round(shuffled.length * valRatio)
    train.push(...shuffled.slice(0, trainEnd))
    val.push(...shuffled.slice(trainEnd, valEnd))
    test.push(...shuffled.slice(valEnd))
  }

  return { train, val, test }
}
