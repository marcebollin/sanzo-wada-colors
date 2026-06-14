import { oklch as toOklch, formatCss, wcagContrast } from "culori"
import type { SanzoColor } from "../data"

/**
 * The palette theme engine.
 *
 * Given any 1-4 colors from the dictionary it derives a complete, harmonious
 * set of page roles entirely in the OKLCH color space. Neutrals (ink + paper)
 * are not fixed greys — they are pulled toward the palette's own hue and
 * chroma so the whole page feels mixed from the selected pigments.
 */

type Oklch = { mode: "oklch"; l: number; c: number; h?: number }

export type Swatch = {
  id: number
  name: string
  /** Original swatch color as an oklch() string. */
  css: string
  /** Best-contrast text color to lay over this swatch. */
  on: string
  /** Lightness 0-1, handy for layout decisions. */
  l: number
  /** True when the swatch is dark enough to carry light text. */
  isDark: boolean
}

export type PaletteTheme = {
  /** The 1-4 source colors, in their original order. */
  swatches: Swatch[]
  /** Near-black derived from the darkest hue (page text). */
  ink: string
  /** Near-white derived from the lightest hue (page surface). */
  paper: string
  /** Tinted page background, a touch more saturated than paper. */
  bg: string
  onBg: string
  /** A bold, saturated stage color for the hero block. */
  hero: string
  onHero: string
  /** The most chromatic color — used for drop caps, shapes, accents. */
  accent: string
  onAccent: string
  /** A palette color guaranteed to read against `hero` — the hero drop cap. */
  heroCap: string
  /** A second accent (next most chromatic, distinct hue). */
  accent2: string
  onAccent2: string
  /** CSS custom properties to spread onto a wrapper element. */
  vars: Record<string, string>
}

function parse(css: string): Oklch {
  const o = toOklch(css)
  if (!o) return { mode: "oklch", l: 0.5, c: 0, h: 0 }
  return { mode: "oklch", l: o.l ?? 0.5, c: o.c ?? 0, h: o.h ?? 0 }
}

function fmt(o: Oklch): string {
  return formatCss({ ...o, mode: "oklch" })
}

/** Pick ink or paper, whichever reads better over the given color. */
function pickOn(css: string, ink: string, paper: string): string {
  return wcagContrast(css, paper) >= wcagContrast(css, ink) ? paper : ink
}

export type ReadableText = { color: string }

export type ReadablePair = {
  /** Text style to lay over the color (a solid light or dark color). */
  text: ReadableText
  /** A solid high-contrast color (light or dark) tuned to the hue. */
  onSolid: string
  /** The opposite solid — useful as a hairline against `onSolid`. */
  offSolid: string
}

/**
 * Decide on a fixed light or dark text color for any swatch. Dark colors get a
 * tonal near-white, light colors a tonal near-black — whichever reads with more
 * contrast against the swatch wins.
 */
export function readablePair(css: string): ReadablePair {
  const o = parse(css)
  const dark = fmt({
    mode: "oklch",
    l: 0.17,
    c: Math.min(0.04, (o.c ?? 0) * 0.3 + 0.006),
    h: o.h ?? 0,
  })
  const light = fmt({
    mode: "oklch",
    l: 0.985,
    c: Math.min(0.025, (o.c ?? 0) * 0.15 + 0.003),
    h: o.h ?? 0,
  })
  const useLight = wcagContrast(css, light) >= wcagContrast(css, dark)
  const onSolid = useLight ? light : dark
  const offSolid = useLight ? dark : light
  return { text: { color: onSolid }, onSolid, offSolid }
}

export function buildTheme(palette: SanzoColor[]): PaletteTheme {
  // Guard against an empty palette.
  const source = palette.length ? palette : []
  const parsed = source.map((p) => ({ color: p, o: parse(p.oklch) }))

  const byLight = [...parsed].sort((a, b) => a.o.l - b.o.l)
  const darkest = byLight[0]?.o ?? { mode: "oklch", l: 0.25, c: 0.03, h: 60 }
  const lightest =
    byLight[byLight.length - 1]?.o ?? { mode: "oklch", l: 0.92, c: 0.02, h: 90 }
  const byChroma = [...parsed].sort((a, b) => (b.o.c ?? 0) - (a.o.c ?? 0))

  // Ink: take the darkest hue, drive lightness down and keep a whisper of its
  // chroma so black still belongs to this palette.
  const ink = fmt({
    mode: "oklch",
    l: Math.min(0.21, (darkest.o?.l ?? 0.25) * 0.55 + 0.07),
    c: Math.min(0.045, (darkest.o?.c ?? 0) * 0.35 + 0.008),
    h: darkest.o?.h ?? 60,
  })

  // Paper + bg: lift the lightest hue near white, keeping a faint tint.
  const paper = fmt({
    mode: "oklch",
    l: 0.97,
    c: Math.min(0.03, (lightest.o?.c ?? 0) * 0.18 + 0.004),
    h: lightest.o?.h ?? 90,
  })
  const bg = fmt({
    mode: "oklch",
    l: 0.945,
    c: Math.min(0.05, (lightest.o?.c ?? 0) * 0.35 + 0.01),
    h: lightest.o?.h ?? 90,
  })

  const swatches: Swatch[] = parsed.map(({ color, o }) => {
    const css = color.oklch
    return {
      id: color.id,
      name: color.name,
      css,
      on: pickOn(css, ink, paper),
      l: o.l,
      isDark: o.l < 0.62,
    }
  })

  // Hero stage: prefer the most chromatic color that is not too pale, so the
  // headline block always reads as a bold field of color.
  const heroPick =
    byChroma.find((p) => p.o.l < 0.82) ?? byChroma[0] ?? darkest
  const hero = heroPick?.color.oklch ?? bg
  const onHero = pickOn(hero, ink, paper)

  const accentColor = byChroma[0]?.color.oklch ?? hero
  const accent2Color = byChroma[1]?.color.oklch ?? accentColor

  // Hero drop cap: must always be a *different*, readable color from the hero
  // field behind it. Prefer the most chromatic other swatch that reads against
  // the hero; if the palette has nothing distinct (e.g. a single color), derive
  // a vivid tone by flipping the hero's lightness while keeping its chroma.
  const heroO = heroPick?.o
  const heroCap =
    byChroma.find(
      (p) => p.color.oklch !== hero && wcagContrast(p.color.oklch, hero) >= 1.4,
    )?.color.oklch ??
    fmt({
      mode: "oklch",
      l: (heroO?.l ?? 0.5) > 0.5 ? 0.2 : 0.96,
      c: Math.max(0.12, heroO?.c ?? 0),
      h: heroO?.h ?? 0,
    })

  const vars: Record<string, string> = {
    "--p-ink": ink,
    "--p-paper": paper,
    "--p-bg": bg,
    "--p-on-bg": pickOn(bg, ink, paper),
    "--p-hero": hero,
    "--p-on-hero": onHero,
    "--p-accent": accentColor,
    "--p-on-accent": pickOn(accentColor, ink, paper),
    "--p-hero-cap": heroCap,
    "--p-accent-2": accent2Color,
    "--p-on-accent-2": pickOn(accent2Color, ink, paper),
  }
  swatches.forEach((s, i) => {
    vars[`--p-c${i}`] = s.css
    vars[`--p-c${i}-on`] = s.on
  })
  vars["--p-count"] = String(swatches.length)

  return {
    swatches,
    ink,
    paper,
    bg,
    onBg: vars["--p-on-bg"],
    hero,
    onHero,
    accent: accentColor,
    onAccent: vars["--p-on-accent"],
    heroCap,
    accent2: accent2Color,
    onAccent2: vars["--p-on-accent-2"],
    vars,
  }
}
