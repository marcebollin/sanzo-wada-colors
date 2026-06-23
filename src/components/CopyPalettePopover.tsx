import { formatHex, formatHsl, formatRgb } from "culori"
import { type MotionValue, motion } from "motion/react"
import { Fragment, useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { SanzoColor, SanzoCombination } from "../data"
import type { PaletteTheme } from "../lib/palette-theme"
import { syntaxRoles } from "../lib/palette-theme"
import { useTouchDevice } from "../lib/use-touch-device"
import { CopyButton, type CopyButtonHandle } from "./CopyButton"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type Props = {
  combination: SanzoCombination
  colors: SanzoColor[]
  theme: PaletteTheme
  /** Optional class for the trigger button. */
  className?: string
  /** Foreground for the trigger when shown over a colored field. */
  triggerColor?: string | MotionValue<string>
  /** Optional `view-transition-name` for the trigger, so it morphs across routes. */
  triggerViewTransitionName?: string
}

export const COPY_PALETTE_TRIGGER_TEXT = "COPY COMBINATION"
export const COPY_PALETTE_TRIGGER_VT_NAME = "nav-copy"
export const COPY_PALETTE_TRIGGER_CLASS =
  "copy-palette-trigger inline-flex cursor-pointer items-baseline font-display text-[clamp(0.95rem,2.1vw,1.5rem)] uppercase leading-none tracking-[0.08em] focus:outline-none"

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
  triggerViewTransitionName,
}: Props) {
  const [format, setFormat] = useState<ColorFormat>("oklch")
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const copyRef = useRef<CopyButtonHandle>(null)
  const isTouchDevice = useTouchDevice()
  const block = paletteBlock(combination, colors, format)
  const css = toCss(block)
  const syntax = syntaxRoles(theme)

  function openNow() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function closeSoon() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  function cycleFormat() {
    setFormat(
      (f) => FORMAT_CYCLE[(FORMAT_CYCLE.indexOf(f) + 1) % FORMAT_CYCLE.length],
    )
  }

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  // Muted color for braces/colons/semicolons — tied to the popover foreground.
  const punct = {
    color: `color-mix(in oklch, ${theme.paper} 55%, transparent)`,
  }

  const hoverProps = isTouchDevice
    ? {}
    : {
        onPointerEnter: openNow,
        onPointerLeave: closeSoon,
        onMouseEnter: openNow,
        onMouseLeave: closeSoon,
        onFocus: openNow,
        onBlur: closeSoon,
      }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          onClick={(event) => {
            if (!isTouchDevice) event.preventDefault()
            copyRef.current?.copy()
          }}
          {...hoverProps}
          className={twMerge(COPY_PALETTE_TRIGGER_CLASS, className ?? "")}
          style={{
            color: triggerColor ?? theme.paper,
            viewTransitionName: triggerViewTransitionName,
          }}
        >
          {COPY_PALETTE_TRIGGER_TEXT}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        forceMount
        aria-hidden={!open}
        align="end"
        sideOffset={12}
        {...hoverProps}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="copy-palette-popover w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border p-0 shadow-lg backdrop-blur-md"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.ink} 76%, transparent)`,
          color: theme.paper,
          borderColor: `color-mix(in oklch, ${theme.paper} 26%, ${theme.accent})`,
          boxShadow: `0 16px 36px -28px ${triggerColor ?? theme.ink}, inset 0 1px 0 color-mix(in oklch, ${theme.paper} 14%, transparent)`,
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-2.5 py-2"
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.paper} 5%, transparent)`,
            borderBottom: `1px solid color-mix(in oklch, ${theme.paper} 13%, transparent)`,
          }}
        >
          <button
            type="button"
            onClick={cycleFormat}
            title="Click to switch color format"
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[0.56rem] uppercase tracking-[0.24em] opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
            style={{
              backgroundColor: `color-mix(in oklch, ${theme.ink} 62%, transparent)`,
              borderColor: `color-mix(in oklch, ${theme.paper} 16%, transparent)`,
            }}
          >
            <CycleIcon />
            {format}
          </button>
          <CopyButton
            ref={copyRef}
            value={css}
            label={`Copy combination ${combination.name} as ${format.toUpperCase()}`}
            color={theme.paper}
          >
            Copy CSS
          </CopyButton>
        </div>
        <pre
          className="m-1.5 max-h-48 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all rounded-md border px-2.5 py-2.5 font-mono text-[0.62rem] leading-relaxed"
          style={{
            color: theme.paper,
            backgroundColor: `color-mix(in oklch, ${theme.ink} 72%, transparent)`,
            borderColor: `color-mix(in oklch, ${theme.paper} 11%, transparent)`,
          }}
        >
          <code>
            <span style={{ color: syntax.selector }}>:root</span>{" "}
            <span style={punct}>{"{"}</span>
            {"\n  "}
            <span
              style={{ color: syntax.comment }}
            >{`/* ${block.comment} */`}</span>
            {block.decls.map((d) => (
              <Fragment key={`${d.prop}:${d.value}`}>
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

function CycleIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3" />
      <path d="M21 3v5h-5" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
