import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CopyButton } from "./CopyButton"
import type { SanzoColor, SanzoCombination } from "../data"
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

/** Turn a color name into a CSS custom-property-safe slug. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Build a :root block of OKLCH custom properties for the palette. */
function paletteCss(combination: SanzoCombination, colors: SanzoColor[]): string {
  const id = String(combination.id).padStart(2, "0")
  const used = new Set<string>()
  const lines = colors.map((c) => {
    let key = slug(c.name)
    while (used.has(key)) key += "-2"
    used.add(key)
    return `  --${key}: ${c.oklch};`
  })
  return `:root {\n  /* Palette ${id} \u2014 ${combination.name} */\n${lines.join("\n")}\n}`
}

export function CopyPalettePopover({
  combination,
  colors,
  theme,
  className,
  triggerColor,
}: Props) {
  const css = paletteCss(combination, colors)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors focus:outline-none " +
            (className ?? "")
          }
          style={{ borderColor: triggerColor, color: triggerColor }}
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
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] opacity-70">
            CSS · OKLCH
          </p>
          <CopyButton
            value={css}
            label={`Copy palette ${combination.name} as CSS`}
            color={theme.paper}
          >
            Copy CSS
          </CopyButton>
        </div>
        <pre
          className="max-h-60 overflow-auto px-4 py-3 font-mono text-[0.7rem] leading-relaxed"
          style={{ color: theme.paper }}
        >
          <code>{css}</code>
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
