/**
 * CMYK (Japanese print format) -> OKLCH fallback converter.
 *
 * Sanzo Wada's "A Dictionary of Color Combinations" records each color as CMYK
 * percentages in the Japanese print convention (0-100 per channel). This script
 * is a FALLBACK: the canonical data lives in src/data/colors.json where you can
 * provide an authored `oklch` string per color. When a color has no `oklch`
 * value (or you pass --force), we derive one from its `cmyk`.
 *
 * Why this matters: Japanese CMYK separations are heavier in the K (black)
 * plate and use total-ink limits closer to ~320-350%, so a naive
 * "RGB = (1-C)(1-K)" conversion comes out too bright. We apply a small
 * ink-gain (dot-gain) correction so the on-screen color reads closer to how the
 * 1930s plates actually print, then convert through sRGB into OKLCH with culori
 * and clamp any out-of-gamut chroma (per the OKLCH skill guidance).
 *
 * Usage:
 *   node scripts/cmyk-to-oklch.mjs          # fill in only missing oklch values
 *   node scripts/cmyk-to-oklch.mjs --force  # recompute every oklch value
 *   node scripts/cmyk-to-oklch.mjs --dry    # print results, do not write file
 */

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { converter, clampChroma, formatCss } from "culori"

const __dirname = dirname(fileURLToPath(import.meta.url))
const COLORS_PATH = resolve(__dirname, "../src/data/colors.json")

// Dot gain / ink-gain factor used to approximate the heavier Japanese print
// separations. 0 = naive conversion, higher = darker/denser midtones.
const INK_GAIN = 0.18

const toOklch = converter("oklch")

/**
 * Convert a single CMYK channel set (0-100 Japanese format) to an sRGB triplet
 * in the 0-1 range, applying a perceptual ink-gain correction.
 */
function cmykToRgb({ c, m, y, k }) {
  // normalize 0-100 -> 0-1
  let C = c / 100
  let M = m / 100
  let Y = y / 100
  let K = k / 100

  // Apply ink gain: midtone dots spread on press, so effective coverage is
  // higher than the nominal percentage. gain(x) pushes mid values up slightly.
  const gain = (x) => x + INK_GAIN * x * (1 - x)
  C = gain(C)
  M = gain(M)
  Y = gain(Y)
  K = gain(K)

  const r = (1 - C) * (1 - K)
  const g = (1 - M) * (1 - K)
  const b = (1 - Y) * (1 - K)

  return { mode: "rgb", r, g, b }
}

/** Round to a sensible number of decimals for OKLCH output (per skill: L/C 3dp, H up to 3dp). */
function formatOklch(color) {
  const inGamut = clampChroma(color, "oklch")
  return formatCss({
    mode: "oklch",
    l: Number(inGamut.l.toFixed(3)),
    c: Number(inGamut.c.toFixed(3)),
    h: Number((inGamut.h ?? 0).toFixed(3)),
  })
}

export function cmykToOklch(cmyk) {
  const rgb = cmykToRgb(cmyk)
  const oklch = toOklch(rgb)
  return formatOklch(oklch)
}

async function main() {
  const force = process.argv.includes("--force")
  const dry = process.argv.includes("--dry")

  const raw = await readFile(COLORS_PATH, "utf8")
  const colors = JSON.parse(raw)

  let changed = 0
  for (const color of colors) {
    if (!color.cmyk) {
      console.warn(`[skip] id ${color.id} (${color.name}) has no cmyk`)
      continue
    }
    if (color.oklch && !force) continue

    const next = cmykToOklch(color.cmyk)
    if (next !== color.oklch) {
      console.log(
        `[convert] #${String(color.id).padStart(2, "0")} ${color.name}: ` +
          `cmyk(${color.cmyk.c} ${color.cmyk.m} ${color.cmyk.y} ${color.cmyk.k}) -> ${next}`,
      )
      color.oklch = next
      changed++
    }
  }

  if (dry) {
    console.log(`\n[dry run] ${changed} value(s) would change. No file written.`)
    return
  }

  await writeFile(COLORS_PATH, JSON.stringify(colors, null, 2) + "\n", "utf8")
  console.log(`\n[done] Updated ${changed} oklch value(s) in colors.json`)
}

// Only run when invoked directly (so the converter can also be imported).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
