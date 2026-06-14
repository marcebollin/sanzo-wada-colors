import colorsJson from "./colors.json"
import combinationsJson from "./combinations.json"

export type CMYK = {
  /** Cyan, 0-100 (Japanese print format) */
  c: number
  /** Magenta, 0-100 */
  m: number
  /** Yellow, 0-100 */
  y: number
  /** Key / black, 0-100 */
  k: number
}

export type SanzoColor = {
  /** Sequential id used to reference the color from combinations. */
  id: number
  /** Natural name as recorded by Sanzo Wada, e.g. "Ocher Red". */
  name: string
  /** Japanese name for the color, e.g. "朱色". */
  nameJa: string
  /** Source of truth: CMYK in the Japanese print format (0-100 per channel). */
  cmyk: CMYK
  /**
   * OKLCH string for screen rendering. Authored when available, otherwise
   * derived from `cmyk` by scripts/cmyk-to-oklch.mjs (never at runtime).
   */
  oklch: string
}

export type SanzoCombination = {
  id: number
  name: string
  note: string
  /** Ordered list of color ids that make up the palette. */
  colorIds: number[]
}

export const colors: SanzoColor[] = colorsJson as SanzoColor[]
export const combinations: SanzoCombination[] = combinationsJson as SanzoCombination[]

const colorById = new Map(colors.map((c) => [c.id, c]))

export function getColor(id: number): SanzoColor | undefined {
  return colorById.get(id)
}

export function getCombinationColors(combination: SanzoCombination): SanzoColor[] {
  return combination.colorIds
    .map((id) => colorById.get(id))
    .filter((c): c is SanzoColor => Boolean(c))
}

/** Format a CMYK record for display, e.g. "C0 M30 Y6 K0". */
export function formatCmyk(cmyk: CMYK): string {
  return `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`
}
