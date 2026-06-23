import { oklch as toOklch } from "culori"
import type { SanzoColor } from "../data"

/**
 * The palette gradient used by the hero dot — and reused as the fill for the
 * About link so its hover/active state reads as "the same gradient as the dot".
 *
 * Colors are laid down lightest-first along a fixed diagonal, with each segment
 * shrinking by a constant decay so the lighter tones get more room and the
 * gradient never reads as evenly-banded stripes.
 */
export const DOT_GRADIENT_ANGLE = "160deg"
export const DOT_GRADIENT_SEGMENT_DECAY = 0.8

export function oklchLightness(color: string): number {
  return toOklch(color)?.l ?? 0.5
}

function gradientStopPositions(count: number): number[] {
  if (count <= 1) return [0]

  const segmentCount = count - 1
  const weights = Array.from(
    { length: segmentCount },
    (_, i) => DOT_GRADIENT_SEGMENT_DECAY ** i,
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let position = 0

  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return 0
    if (i === count - 1) return 100

    position += (weights[i - 1] / total) * 100
    return Number(position.toFixed(2))
  })
}

/** Build the diagonal OKLCH gradient string for a list of colors. */
export function paletteLinearGradient(colors: string[]): string {
  const gradientColors = colors.length > 1 ? colors : [colors[0], colors[0]]
  const positions = gradientStopPositions(gradientColors.length)
  const stops = gradientColors
    .map((color, i) => `${color} ${positions[i]}%`)
    .join(", ")

  return `linear-gradient(${DOT_GRADIENT_ANGLE} in oklch, ${stops})`
}

/**
 * Order the palette colors for the dot gradient: lightest first, dropping any
 * color equal to the field background so the gradient always contrasts. Returns
 * the OKLCH strings in gradient order.
 */
export function dotGradientColors(
  palette: SanzoColor[],
  background: string,
): string[] {
  return palette
    .map((color, index) => ({
      color,
      index,
      lightness: oklchLightness(color.oklch),
    }))
    .filter(({ color }) => color.oklch !== background)
    .sort((a, b) => b.lightness - a.lightness || a.index - b.index)
    .map(({ color }) => color.oklch)
}
