/**
 * CMYK (Japanese print format) -> OKLCH fallback converter.
 *
 * Sanzo Wada's "A Dictionary of Color Combinations" records each color as CMYK
 * percentages in the Japanese print convention (0-100 per channel). This script
 * is a FALLBACK: the canonical data lives in src/data/colors.json where you can
 * provide an authored `oklch` string per color. When a color has no `oklch`
 * value (or you pass --force), we derive one from its `cmyk`.
 *
 * Fidelity note: the source data does not include an ICC profile or measured
 * LAB/spectral swatches. The most faithful digital path would use those. This
 * fallback is therefore intentionally explicit and deterministic: apply a small
 * ink-gain (dot-gain) correction, convert to sRGB, convert to OKLCH with culori,
 * then clamp any out-of-gamut chroma per the OKLCH skill guidance.
 *
 * Usage:
 *   node scripts/cmyk-to-oklch.mjs          # fill in only missing oklch values
 *   node scripts/cmyk-to-oklch.mjs --force  # recompute every oklch value
 *   node scripts/cmyk-to-oklch.mjs --dry    # print results, do not write file
 *   node scripts/cmyk-to-oklch.mjs --audit  # report stored-vs-derived drift
 */

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { converter, clampChroma, differenceCiede2000, formatCss, formatHex } from "culori"

const __dirname = dirname(fileURLToPath(import.meta.url))
const COLORS_PATH = resolve(__dirname, "../src/data/colors.json")

const CHANNELS = ["c", "m", "y", "k"]

/**
 * The historical source only gives CMYK percentages, not an output profile.
 * Keep the fallback profile named and centralized so future measured/reference
 * data can replace the heuristic without hunting through conversion code.
 */
export const PRINT_PROFILE = Object.freeze({
  name: "japanese-process-fallback",
  inkGain: 0.18,
  maxTotalInk: 350,
})

const toOklch = converter("oklch")
const deltaE = differenceCiede2000()

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg !== "--"))
  const known = new Set(["--force", "--dry", "--audit", "--help"])
  const unknown = [...flags].filter((arg) => arg.startsWith("--") && !known.has(arg))

  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(", ")}`)
  }

  return {
    audit: flags.has("--audit"),
    dry: flags.has("--dry"),
    force: flags.has("--force"),
    help: flags.has("--help"),
  }
}

function printHelp() {
  console.log(`Usage: node scripts/cmyk-to-oklch.mjs [--force] [--dry] [--audit]

Options:
  --force  Recompute every OKLCH value, not only missing values.
  --dry    Print changes without writing src/data/colors.json.
  --audit  Print stored-vs-derived color drift and profile warnings.
  --help   Show this message.
`)
}

function assertCmyk(cmyk, label = "CMYK") {
  if (!cmyk || typeof cmyk !== "object") {
    throw new TypeError(`${label} must be an object with c, m, y, and k channels`)
  }

  for (const channel of CHANNELS) {
    const value = cmyk[channel]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(`${label}.${channel} must be a finite number from 0 to 100`)
    }
  }
}

function sumInk(cmyk) {
  return CHANNELS.reduce((total, channel) => total + cmyk[channel], 0)
}

function round(value, decimals = 3) {
  const rounded = Number(value.toFixed(decimals))
  return Object.is(rounded, -0) ? 0 : rounded
}

function gain(value, amount = PRINT_PROFILE.inkGain) {
  return value + amount * value * (1 - value)
}

/**
 * Convert a single CMYK channel set (0-100 Japanese format) to an sRGB triplet
 * in the 0-1 range, applying a perceptual ink-gain correction.
 */
export function cmykToRgb(cmyk, profile = PRINT_PROFILE) {
  assertCmyk(cmyk)

  // normalize 0-100 -> 0-1
  const C = gain(cmyk.c / 100, profile.inkGain)
  const M = gain(cmyk.m / 100, profile.inkGain)
  const Y = gain(cmyk.y / 100, profile.inkGain)
  const K = gain(cmyk.k / 100, profile.inkGain)

  const r = (1 - C) * (1 - K)
  const g = (1 - M) * (1 - K)
  const b = (1 - Y) * (1 - K)

  return { mode: "rgb", r, g, b }
}

function convertCmyk(cmyk, profile = PRINT_PROFILE) {
  const rgb = cmykToRgb(cmyk, profile)
  const rawOklch = toOklch(rgb)
  const clampedOklch = clampChroma(rawOklch, "oklch", "rgb")

  return { rgb, rawOklch, clampedOklch }
}

/**
 * Round to a sensible number of decimals for OKLCH output:
 * L/C at 3dp, H up to 3dp, and no negative zero.
 */
function formatOklch(color) {
  const c = round(color.c)

  return formatCss({
    mode: "oklch",
    l: round(color.l),
    c,
    h: c === 0 ? 0 : round(color.h ?? 0),
  })
}

export function cmykToOklch(cmyk, profile = PRINT_PROFILE) {
  return formatOklch(convertCmyk(cmyk, profile).clampedOklch)
}

function auditColor(color, derived) {
  const inkTotal = sumInk(color.cmyk)
  const current = color.oklch
  const drift = current ? deltaE(current, derived.css) : undefined
  const chromaClamp = Math.max(0, derived.rawOklch.c - derived.clampedOklch.c)
  const warnings = []

  if (!current) warnings.push("missing oklch")
  if (inkTotal > PRINT_PROFILE.maxTotalInk) warnings.push(`total ink ${inkTotal}%`)
  if (chromaClamp > 0.001) warnings.push(`clamped C by ${chromaClamp.toFixed(3)}`)
  if (drift !== undefined && drift > 0.1) warnings.push(`stored drift dE ${drift.toFixed(2)}`)

  return {
    id: color.id,
    name: color.name,
    inkTotal,
    rgb: formatHex(derived.rgb),
    current,
    derived: derived.css,
    drift,
    warnings,
  }
}

function printAudit(rows) {
  console.log(`\n[audit] Profile: ${PRINT_PROFILE.name} (ink gain ${PRINT_PROFILE.inkGain})`)
  console.log("[audit] CMYK source has no ICC profile; treat these OKLCH values as deterministic screen fallbacks.")

  for (const row of rows) {
    const drift = row.drift === undefined ? "n/a" : row.drift.toFixed(2)
    const warnings = row.warnings.length > 0 ? ` | ${row.warnings.join("; ")}` : ""
    console.log(
      `[audit] #${String(row.id).padStart(2, "0")} ${row.name}: ` +
        `ink ${row.inkTotal}% | ${row.rgb} | dE ${drift}${warnings}`,
    )
  }

  const warnings = rows.reduce((count, row) => count + row.warnings.length, 0)
  const maxDrift = rows.reduce((max, row) => Math.max(max, row.drift ?? 0), 0)
  console.log(`[audit] ${rows.length} color(s), ${warnings} warning(s), max stored drift dE ${maxDrift.toFixed(2)}.`)
}

async function main() {
  const { audit, dry, force, help } = parseArgs(process.argv.slice(2))

  if (help) {
    printHelp()
    return
  }

  const raw = await readFile(COLORS_PATH, "utf8")
  const colors = JSON.parse(raw)

  let changed = 0
  const auditRows = []

  for (const color of colors) {
    if (!color.cmyk) {
      console.warn(`[skip] id ${color.id} (${color.name}) has no cmyk`)
      continue
    }

    assertCmyk(color.cmyk, `color #${color.id} ${color.name} cmyk`)

    const conversion = convertCmyk(color.cmyk)
    const next = formatOklch(conversion.clampedOklch)

    if (audit) {
      auditRows.push(auditColor(color, { ...conversion, css: next }))
    }

    if (color.oklch && !force) continue

    if (next !== color.oklch) {
      console.log(
        `[convert] #${String(color.id).padStart(2, "0")} ${color.name}: ` +
          `cmyk(${color.cmyk.c} ${color.cmyk.m} ${color.cmyk.y} ${color.cmyk.k}) -> ${next}`,
      )
      color.oklch = next
      changed++
    }
  }

  if (audit) printAudit(auditRows)

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
