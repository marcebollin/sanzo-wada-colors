import { Fragment, useState } from "react"
import { formatHex, formatHsl, formatRgb } from "culori"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CopyButton } from "./CopyButton"
import type { SanzoColor, SanzoCombination } from "../data"
import { syntaxRoles } from "../lib/palette-theme"
import type { PaletteTheme } from "../lib/palette-theme"

type Props = {
  combination: SanzoCombination
  colors: SanzoColor[]
  theme: PaletteTheme
  /** Optional class for the trigger button. */
  className?: string
  /** Foreground for the trigger when shown over a colored field. */
  triggerColor?: string
}

/**
 * The color formats the popover can emit. The source of truth in the JSON is
 * always OKLCH, so every other format is converted from it on the fly.
 */
type ColorFormat = "oklch" | "hex" | "hsl" | "rgb"
const FORMAT_CYCLE: ColorFormat[] = ["oklch", "hex", "hsl", "rgb"]

/** Convert an authored OKLCH string into the requested CSS color format. */
function convert(oklch: string, format: ColorFormat): string {
  switch (format) {
    case "hex":
      return formatHex(oklch) ?? oklch
    case "hsl":
      return formatHsl(oklch) ?? oklch
    case "rgb":
      return formatRgb(oklch) ?? oklch
    default:
      return oklch
  }
}

/** Tokens are derived per-palette inside the component via `syntaxRoles`. */

/** Turn a color name into a CSS custom-property-safe slug. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

type Decl = { prop: string; value: string }

/** Build the comment + declarations for the palette in the chosen format. */
function paletteBlock(
  combination: SanzoCombination,
  colors: SanzoColor[],
  format: ColorFormat,
): { comment: string; decls: Decl[] } {
  const id = String(combination.id).padStart(2, "0")
  const used = new Set<string>()
  const decls = colors.map((c) => {
    let key = slug(c.name)
    while (used.has(key)) key += "-2"
    used.add(key)
    return { prop: `--${key}`, value: convert(c.oklch, format) }
  })
  return { comment: `Palette ${id} — ${combination.name}`, decls }
}

/** Plain-text :root block for the clipboard. */
function toCss({ comment, decls }: { comment: string; decls: Decl[] }): string {
  const lines = decls.map((d) => `  ${d.prop}: ${d.value};`)
  return `:root {\n  /* ${comment} */\n${lines.join("\n")}\n}`
}

export function CopyPalettePopover({
  combination,
  colors,
  theme,
  className,
  triggerColor,
}: Props) {
  const [format, setFormat] = useState<ColorFormat>("oklch")
  const block = paletteBlock(combination, colors, format)
  const css = toCss(block)
  const syntax = syntaxRoles(theme)

  function cycleFormat() {
    setFormat((f) => FORMAT_CYCLE[(FORMAT_CYCLE.indexOf(f) + 1) % FORMAT_CYCLE.length])
  }

  // Muted color for braces/colons/semicolons — tied to the popover foreground.
  const punct = { color: `color-mix(in oklch, ${theme.paper} 55%, transparent)` }

  // The trigger sits over an arbitrary palette field. `triggerColor` is the
  // readable neutral for that field (theme.onHero, always ink or paper), so a
  // frosted backdrop in the *opposite* neutral keeps the pill legible on any
  // color it lands on.
  const chipBackdrop = triggerColor === theme.paper ? theme.ink : theme.paper

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest backdrop-blur-sm transition-colors focus:outline-none " +
            (className ?? "")
          }
          style={{
            borderColor: triggerColor,
            color: triggerColor,
            backgroundColor: `color-mix(in oklch, ${chipBackdrop} 70%, transparent)`,
          }}
        >
          <SwatchIcon />
          Copy palette
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-2 shadow-2xl"
        style={{ backgroundColor: theme.ink, color: theme.paper, borderColor: theme.accent }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid color-mix(in oklch, ${theme.paper} 18%, transparent)` }}
        >
          <button
            type="button"
            onClick={cycleFormat}
            title="Click to switch color format"
            className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.25em] opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
          >
            <CycleIcon />
            {format}
          </button>
          <CopyButton
            value={css}
            label={`Copy palette ${combination.name} as ${format.toUpperCase()}`}
            color={theme.paper}
          >
            Copy CSS
          </CopyButton>
        </div>
        <pre
          className="max-h-60 overflow-auto px-4 py-3 font-mono text-[0.7rem] leading-relaxed"
          style={{ color: theme.paper }}
        >
          <code>
            <span style={{ color: syntax.selector }}>:root</span>{" "}
            <span style={punct}>{"{"}</span>
            {"\n  "}
            <span style={{ color: syntax.comment }}>{`/* ${block.comment} */`}</span>
            {block.decls.map((d, i) => (
              <Fragment key={i}>
                {"\n  "}
                <span style={{ color: syntax.prop }}>{d.prop}</span>
                <span style={punct}>:</span>{" "}
                <span style={{ color: syntax.value }}>{d.value}</span>
                <span style={punct}>;</span>
              </Fragment>
            ))}
            {"\n"}
            <span style={punct}>{"}"}</span>
          </code>
        </pre>
      </PopoverContent>
    </Popover>
  )
}

function SwatchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CycleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3" />
      <path d="M21 3v5h-5" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
