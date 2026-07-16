function seededRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Return a stable random arrangement with per-color counts differing by at most one. */
export function shuffledBalancedColors(
  count: number,
  colors: string[],
  seed: number,
) {
  if (colors.length === 0) {
    return Array.from({ length: count }, () => "currentColor")
  }

  const values = Array.from(
    { length: count },
    (_, index) => colors[index % colors.length],
  )
  const random = seededRandom(seed)

  for (let index = values.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[values[index], values[swapIndex]] = [values[swapIndex], values[index]]
  }

  return values
}
