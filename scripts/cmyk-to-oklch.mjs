/**
 * Seigensha CMYK -> D50 Lab -> sRGB / Display-P3-safe OKLCH converter.
 *
 * The CMYK percentages in the 2010 Seigensha edition are device-dependent:
 * they only become colors after a print condition is assigned. There is no
 * ICC profile for Wada's 1933-34 original, whose physical edition used mounted
 * color plates. For the modern Japanese reproduction we use the documented
 * Japan Color 2001 Uncoated condition as the closest defensible assumption:
 * sheet-fed offset, uncoated paper type 4, and a profile contemporary with the
 * book's 2010 production.
 *
 * An ICC conversion is only needed when refreshing the stored D50 Lab values:
 *
 *   TRANSICC_BIN=/path/to/transicc node scripts/cmyk-to-oklch.mjs \
 *     --icc-profile /path/to/JapanColor2001Uncoated.icc --force
 *
 * Normal runs derive both gamut variants from the checked-in Lab values:
 *
 *   node scripts/cmyk-to-oklch.mjs --force
 *   node scripts/cmyk-to-oklch.mjs --force --dry --audit
 */

import { spawnSync } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  clampChroma,
  converter,
  differenceCiede2000,
  formatCss,
  formatHex,
  inGamut,
} from "culori"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const COLORS_PATH = resolve(scriptDirectory, "../src/data/colors.json")
const CHANNELS = ["c", "m", "y", "k"]
const toOklch = converter("oklch")
const toRgb = converter("rgb")
const deltaE = differenceCiede2000()
const isInSrgb = inGamut("rgb")
const isInP3 = inGamut("p3")

export const PRINT_PROFILE = Object.freeze({
  name: "Japan Color 2001 Uncoated",
  reference: "JC200104",
  sourceEdition: "Seigensha revised reproduction, ISBN 978-4-86152-247-5",
  sourceEditionRelease: "2010-07-01",
  assumption:
    "Best-fit modern print condition inferred from the edition date and visibly uncoated stock; not a claimed profile for the 1933-34 original",
  printingProcess:
    "ISO 12647-2:1996 sheet-fed offset, positive plates, paper type 4 (uncoated, 105 gsm), 69/cm",
  renderingIntent: "relative-colorimetric",
  // Disabled while reading the print condition into its D50 PCS. Enabling BPC
  // against an ideal Lab destination crushes the uncoated press black point
  // and is appropriate for a later device-to-device transform, not source
  // characterization.
  blackPointCompensation: false,
  profileRegistry: "https://registry.color.org/cmyk-registry/jc200104",
  originalReference:
    "https://hdl.huntington.org/digital/collection/p16003coll14/id/21849",
  maxTotalInk: 350,
})

function parseArgs(argv) {
  const options = {
    audit: false,
    dry: false,
    force: false,
    help: false,
    iccProfile: undefined,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--") continue
    if (arg === "--audit") options.audit = true
    else if (arg === "--dry") options.dry = true
    else if (arg === "--force") options.force = true
    else if (arg === "--help") options.help = true
    else if (arg === "--icc-profile") {
      const path = argv[++index]
      if (!path || path.startsWith("--")) {
        throw new Error("--icc-profile requires a file path")
      }
      options.iccProfile = resolve(path)
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return options
}

function printHelp() {
  console.log(`Usage: node scripts/cmyk-to-oklch.mjs [options]

Options:
  --force               Recompute every OKLCH value from stored D50 Lab.
  --icc-profile <path>  Refresh D50 Lab through a CMYK ICC profile first.
  --dry                 Print changes without writing colors.json.
  --audit               Report gamut usage and stored-vs-derived drift.
  --help                Show this message.
`)
}

function assertCmyk(cmyk, label = "CMYK") {
  if (!cmyk || typeof cmyk !== "object") {
    throw new TypeError(`${label} must contain c, m, y, and k channels`)
  }

  for (const channel of CHANNELS) {
    const value = cmyk[channel]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(
        `${label}.${channel} must be a finite number from 0 to 100`,
      )
    }
  }
}

function assertLab(lab, label = "D50 Lab") {
  for (const channel of ["l", "a", "b"]) {
    if (!Number.isFinite(lab?.[channel])) {
      throw new TypeError(`${label}.${channel} must be a finite number`)
    }
  }
}

function round(value, decimals = 3) {
  const rounded = Number(value.toFixed(decimals))
  return Object.is(rounded, -0) ? 0 : rounded
}

function roundedLab(lab) {
  return { l: round(lab.l, 4), a: round(lab.a, 4), b: round(lab.b, 4) }
}

function formatOklch(color, gamut) {
  const gamutCheck = gamut === "p3" ? isInP3 : isInSrgb
  let candidate = clampChroma(color, "oklch", gamut)

  // Three-decimal authoring can round a boundary color just outside its
  // target gamut. Nudge chroma inward by one display precision step until the
  // serialized value is safely displayable.
  for (let attempts = 0; attempts < 4; attempts++) {
    const roundedChroma = round(candidate.c)
    const rounded = {
      mode: "oklch",
      l: round(candidate.l),
      c: roundedChroma,
      h: round(roundedChroma === 0 ? 0 : (candidate.h ?? 0)),
    }
    if (gamutCheck(rounded)) return formatCss(rounded)
    candidate = { ...candidate, c: Math.max(0, candidate.c - 0.001) }
  }

  throw new Error(`Could not serialize an in-${gamut} color`)
}

function deriveFromLab(labD50) {
  assertLab(labD50)
  const converted = toOklch({ mode: "lab", ...labD50 })
  if (!converted) throw new Error("Could not convert D50 Lab to OKLCH")
  const achromatic = Math.abs(converted.c) < 1e-7
  const raw = {
    ...converted,
    l:
      Math.abs(converted.l - 1) < 1e-7
        ? 1
        : Math.abs(converted.l) < 1e-7
          ? 0
          : converted.l,
    c: achromatic ? 0 : converted.c,
    h: achromatic ? 0 : converted.h,
  }

  const oklch = formatOklch(raw, "rgb")
  const oklchP3 = formatOklch(raw, "p3")
  return { raw, oklch, oklchP3 }
}

function parseLabOutput(stdout, expectedCount) {
  const rows = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) =>
      line.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/),
    )
    .filter(Boolean)
    .map((match) => ({
      l: Number(match[1]),
      a: Number(match[2]),
      b: Number(match[3]),
    }))

  if (rows.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} Lab rows from transicc, received ${rows.length}`,
    )
  }
  return rows
}

function convertCmykWithIcc(colors, profilePath) {
  const executable = process.env.TRANSICC_BIN || "transicc"
  const input = `${colors
    .map((color) => CHANNELS.map((channel) => color.cmyk[channel]).join(" "))
    .join("\n")}\n`
  const result = spawnSync(
    executable,
    [`-i${profilePath}`, "-o*Lab", "-t1", "-n"],
    { encoding: "utf8", input, maxBuffer: 1024 * 1024 },
  )

  if (result.error) {
    throw new Error(
      `Could not run ${executable}. Install LittleCMS transicc or set TRANSICC_BIN. ${result.error.message}`,
    )
  }
  if (result.status !== 0) {
    throw new Error(`transicc failed: ${result.stderr || result.stdout}`)
  }
  return parseLabOutput(result.stdout, colors.length)
}

/** Convert through a checked-in D50 Lab value. */
export function labToOklchVariants(labD50) {
  const { oklch, oklchP3 } = deriveFromLab(labD50)
  return { oklch, oklchP3 }
}

function sumInk(cmyk) {
  return CHANNELS.reduce((total, channel) => total + cmyk[channel], 0)
}

function auditColor(color, derived) {
  const rawInSrgb = isInSrgb(derived.raw)
  const rawInP3 = isInP3(derived.raw)
  const srgbChroma = toOklch(derived.oklch)?.c ?? 0
  const p3Chroma = toOklch(derived.oklchP3)?.c ?? 0
  const currentSrgbDrift = color.oklch
    ? deltaE(color.oklch, derived.oklch)
    : undefined
  const currentP3Drift = color.oklchP3
    ? deltaE(color.oklchP3, derived.oklchP3)
    : undefined
  const warnings = []
  if (sumInk(color.cmyk) > PRINT_PROFILE.maxTotalInk) {
    warnings.push(`total ink ${sumInk(color.cmyk)}%`)
  }
  if (!rawInP3) warnings.push("source exceeds Display P3")
  if ((currentSrgbDrift ?? 0) > 0.1) {
    warnings.push(`stored sRGB drift dE ${currentSrgbDrift.toFixed(2)}`)
  }
  if ((currentP3Drift ?? 0) > 0.1) {
    warnings.push(`stored P3 drift dE ${currentP3Drift.toFixed(2)}`)
  }

  return {
    id: color.id,
    name: color.name,
    rawInSrgb,
    rawInP3,
    p3ChromaGain: p3Chroma - srgbChroma,
    currentSrgbDrift,
    currentP3Drift,
    srgbHex: formatHex(toRgb(derived.oklch)),
    warnings,
  }
}

function printAudit(rows) {
  console.log(`\n[audit] Profile: ${PRINT_PROFILE.name}`)
  console.log(`[audit] Reference: ${PRINT_PROFILE.reference}`)
  console.log(`[audit] Assumption: ${PRINT_PROFILE.assumption}`)
  const p3Enhancements = rows.filter((row) => row.p3ChromaGain >= 0.001)
  const beyondP3 = rows.filter((row) => !row.rawInP3)
  console.log(
    `[audit] ${p3Enhancements.length}/${rows.length} colors gain chroma in Display P3; ${beyondP3.length} require P3 clamping.`,
  )
  for (const row of rows.filter((item) => item.warnings.length > 0)) {
    console.log(
      `[audit] #${String(row.id).padStart(3, "0")} ${row.name}: ${row.srgbHex} | ${row.warnings.join("; ")}`,
    )
  }
}

function stringifyColors(colors) {
  return `${JSON.stringify(colors, null, 2).replace(
    /"combinationIds": \[\n((?: {6}\d+,?\n)+) {4}\]/g,
    (_, body) => {
      const ids = [...body.matchAll(/\d+/g)].map(([id]) => id)
      const inline = `"combinationIds": [${ids.join(", ")}]`
      if (`    ${inline}`.length < 80) return inline

      const lines = []
      let line = "      "
      for (const [index, id] of ids.entries()) {
        const token = `${id}${index === ids.length - 1 ? "" : ","}`
        const next = line === "      " ? `${line}${token}` : `${line} ${token}`
        if (next.length > 80) {
          lines.push(line)
          line = `      ${token}`
        } else line = next
      }
      lines.push(line)
      return `"combinationIds": [\n${lines.join("\n")}\n    ]`
    },
  )}\n`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const colors = JSON.parse(await readFile(COLORS_PATH, "utf8"))
  for (const color of colors) {
    assertCmyk(color.cmyk, `color #${color.id} ${color.name} cmyk`)
  }

  const profileLabs = options.iccProfile
    ? convertCmykWithIcc(colors, options.iccProfile)
    : undefined
  let changed = 0
  const auditRows = []

  for (const [index, color] of colors.entries()) {
    const sourceLab = profileLabs?.[index] ?? color.labD50
    if (!sourceLab) {
      throw new Error(
        `Color #${color.id} ${color.name} has no stored labD50; rerun with --icc-profile`,
      )
    }
    const labD50 = roundedLab(sourceLab)
    const derived = { labD50, ...deriveFromLab(labD50) }
    if (options.audit) auditRows.push(auditColor(color, derived))

    if (!options.force && color.oklch && color.oklchP3 && color.labD50) continue
    if (
      JSON.stringify(color.labD50) !== JSON.stringify(labD50) ||
      color.oklch !== derived.oklch ||
      color.oklchP3 !== derived.oklchP3
    ) {
      console.log(
        `[convert] #${String(color.id).padStart(3, "0")} ${color.name}: ${derived.oklch} | P3 ${derived.oklchP3}`,
      )
      color.labD50 = labD50
      color.oklch = derived.oklch
      color.oklchP3 = derived.oklchP3
      changed++
    }
  }

  if (options.audit) printAudit(auditRows)
  if (options.dry) {
    console.log(
      `\n[dry run] ${changed} color(s) would change. No file written.`,
    )
    return
  }

  await writeFile(COLORS_PATH, stringifyColors(colors), "utf8")
  console.log(`\n[done] Updated ${changed} color(s) in colors.json`)
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
