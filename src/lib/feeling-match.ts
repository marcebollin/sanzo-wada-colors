import { clampChroma, formatCss, oklch as toOklch } from "culori"
import {
  combinations,
  getCombinationColors,
  type SanzoColor,
  type SanzoCombination,
} from "../data"

export type Emotion = {
  name: "Anger" | "Fear" | "Disgust" | "Sadness" | "Joy"
  start: number
  end: number
  /** Starting tone only; dragging inward/outward takes over. */
  lightness: number
  tone: "light" | "dark"
}

export const EMOTIONS: Emotion[] = [
  { name: "Anger", start: 0, end: 80, lightness: 0.72, tone: "light" },
  { name: "Fear", start: 80, end: 155, lightness: 0.38, tone: "dark" },
  {
    name: "Disgust",
    start: 155,
    end: 210,
    lightness: 0.64,
    tone: "light",
  },
  {
    name: "Sadness",
    start: 210,
    end: 275,
    lightness: 0.34,
    tone: "dark",
  },
  { name: "Joy", start: 275, end: 360, lightness: 0.78, tone: "light" },
]

export type FeelingTarget = {
  hue: number
  lightness: number
  intensity: number
}

export type PaletteProfile = {
  hue: number
  lightness: number
  chroma: number
}

export type FeelingMatch = {
  combination: SanzoCombination
  colors: SanzoColor[]
  profile: PaletteProfile
  similarity: number
  deltas: {
    hue: number
    lightness: number
    chroma: number
  }
}

export const FEELING_LIGHTNESS_MIN = 0.16
export const FEELING_LIGHTNESS_MAX = 0.94

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

export function emotionForHue(hue: number): Emotion {
  const normalized = normalizeHue(hue)
  return (
    EMOTIONS.find(
      (emotion) => normalized >= emotion.start && normalized < emotion.end,
    ) ?? EMOTIONS[0]
  )
}

export function targetOklch(target: FeelingTarget): {
  css: string
  chroma: number
} {
  // A quiet feeling still keeps a trace of pigment. The upper value is then
  // clamped for the target hue/lightness so the displayed color stays in sRGB.
  const requestedChroma = 0.012 + (target.intensity / 100) * 0.248
  const clamped = clampChroma(
    {
      mode: "oklch",
      l: target.lightness,
      c: requestedChroma,
      h: normalizeHue(target.hue),
    },
    "oklch",
    "rgb",
  )
  const parsed = toOklch(clamped)
  const color = {
    mode: "oklch" as const,
    l: parsed?.l ?? target.lightness,
    c: parsed?.c ?? requestedChroma,
    h: parsed?.h ?? normalizeHue(target.hue),
  }

  return { css: formatCss(color), chroma: color.c }
}

function profileColors(colors: SanzoColor[]): PaletteProfile {
  const parsed = colors
    .map((color) => toOklch(color.oklch))
    .filter((color): color is NonNullable<typeof color> => Boolean(color))

  if (parsed.length === 0) {
    return { hue: 0, lightness: 0.5, chroma: 0 }
  }

  let x = 0
  let y = 0
  let totalHueWeight = 0

  for (const color of parsed) {
    // Near-neutrals should contribute less to a palette's emotional hue, but
    // never disappear completely from the calculation.
    const weight = Math.max(color.c ?? 0, 0.012)
    const radians = ((color.h ?? 0) * Math.PI) / 180
    x += Math.cos(radians) * weight
    y += Math.sin(radians) * weight
    totalHueWeight += weight
  }

  const hue = normalizeHue((Math.atan2(y, x) * 180) / Math.PI)
  const lightness =
    parsed.reduce((total, color) => total + (color.l ?? 0.5), 0) / parsed.length
  const chroma =
    parsed.reduce((total, color) => total + (color.c ?? 0), 0) / parsed.length

  return {
    hue: totalHueWeight > 0 ? hue : 0,
    lightness,
    chroma,
  }
}

const PALETTE_PROFILES = combinations.map((combination) => ({
  combination,
  colors: getCombinationColors(combination),
  profile: profileColors(getCombinationColors(combination)),
}))

function circularHueDistance(a: number, b: number): number {
  const raw = Math.abs(normalizeHue(a) - normalizeHue(b))
  return Math.min(raw, 360 - raw)
}

export function feelingMatchWeights(intensity: number): {
  hue: number
  lightness: number
  chroma: number
} {
  const chroma = 0.12 + (intensity / 100) * 0.18
  const hue = 0.45

  return {
    hue,
    lightness: 1 - hue - chroma,
    chroma,
  }
}

export function rankFeelingPalettes(
  target: FeelingTarget,
  limit = 8,
  candidates: SanzoCombination[] = combinations,
): FeelingMatch[] {
  const targetColor = targetOklch(target)
  const candidateIds = new Set(candidates.map((combination) => combination.id))
  // Intensity makes chroma increasingly decisive without drowning out hue and
  // lightness. At zero, low chroma is still rewarded with a smaller weight.
  const weights = feelingMatchWeights(target.intensity)

  return PALETTE_PROFILES.filter(({ combination }) =>
    candidateIds.has(combination.id),
  )
    .map(({ combination, colors, profile }) => {
      const deltas = {
        hue: circularHueDistance(profile.hue, target.hue) / 180,
        lightness:
          Math.abs(profile.lightness - target.lightness) /
          (FEELING_LIGHTNESS_MAX - FEELING_LIGHTNESS_MIN),
        chroma: Math.abs(profile.chroma - targetColor.chroma) / 0.26,
      }
      const distance = Math.sqrt(
        deltas.hue ** 2 * weights.hue +
          deltas.lightness ** 2 * weights.lightness +
          deltas.chroma ** 2 * weights.chroma,
      )

      return {
        combination,
        colors,
        profile,
        similarity: Math.round(Math.max(0, 1 - distance) * 100),
        deltas,
      }
    })
    .sort(
      (a, b) =>
        b.similarity - a.similarity ||
        a.deltas.hue - b.deltas.hue ||
        a.combination.id - b.combination.id,
    )
    .slice(0, limit)
}
