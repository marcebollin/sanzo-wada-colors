import { oklch as toOklch } from "culori"
import colorsJson from "./colors.json"
import combinationsJson from "./combinations.json"
import legacyOklchJson from "./legacy-oklch.json"

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

export type LabD50 = {
  l: number
  a: number
  b: number
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
   * Media-relative CIELAB reference derived from Japan Color 2001 Uncoated.
   * This is checked in so gamut variants can be regenerated without bundling
   * Adobe's ICC profile.
   */
  labD50: LabD50
  /** sRGB-safe OKLCH fallback and portable copy/export value. */
  oklch: string
  /** Display-P3-safe OKLCH enhancement for capable screens. */
  oklchP3: string
  /** Ids of the combinations (palettes) this color appears in. */
  combinationIds: number[]
}

export type SanzoCombination = {
  id: number
  name: string
  note: string
  /** Ordered list of color ids that make up the palette. */
  colorIds: number[]
}

type PaletteColorLightnessOrder = "asc" | "desc"

const PALETTE_COLOR_LIGHTNESS_ORDER: PaletteColorLightnessOrder = "desc"

export const colors: SanzoColor[] = colorsJson as SanzoColor[]
const colorById = new Map(colors.map((c) => [c.id, c]))
const legacyOklchById = legacyOklchJson as Record<string, string>

/** The sRGB-safe OKLCH value used by the site before print characterization. */
export function legacyOklch(color: Pick<SanzoColor, "id" | "oklch">): string {
  return legacyOklchById[String(color.id)] ?? color.oklch
}

function oklchLightness(color: SanzoColor | undefined): number {
  return color ? (toOklch(color.oklch)?.l ?? 0.5) : 0.5
}

function orderPaletteColorIds(colorIds: number[]): number[] {
  return colorIds
    .map((id, index) => ({
      id,
      index,
      lightness: oklchLightness(colorById.get(id)),
    }))
    .sort((a, b) => {
      const lightnessDiff = a.lightness - b.lightness
      const orderedDiff =
        PALETTE_COLOR_LIGHTNESS_ORDER === "asc" ? lightnessDiff : -lightnessDiff

      return orderedDiff || a.index - b.index
    })
    .map(({ id }) => id)
}

export const combinations: SanzoCombination[] = (
  combinationsJson as SanzoCombination[]
)
  .slice()
  .map((combination) => ({
    ...combination,
    colorIds: orderPaletteColorIds(combination.colorIds),
  }))
  .sort((a, b) => a.colorIds.length - b.colorIds.length)

export function getColor(id: number): SanzoColor | undefined {
  return colorById.get(id)
}

export function getCombinationColors(
  combination: SanzoCombination,
): SanzoColor[] {
  return combination.colorIds
    .map((id) => colorById.get(id))
    .filter((c): c is SanzoColor => Boolean(c))
}

/** Format a CMYK record for display, e.g. "C0 M30 Y6 K0". */
export function formatCmyk(cmyk: CMYK): string {
  return `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`
}
