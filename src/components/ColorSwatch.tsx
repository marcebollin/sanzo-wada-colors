import { type SanzoColor, formatCmyk } from "../data"
import { usePalette } from "./PaletteContext"
import { readablePair } from "../lib/palette-theme"
import { CopyButton } from "./CopyButton"
import { cn } from "@/lib/utils"

type Props = {
  color: SanzoColor
  /** Render index for the appearance animation delay. */
  index?: number
  /** "grid" = compact tile, "feature" = large hero block that fills its parent. */
  variant?: "grid" | "feature"
  className?: string
}

/**
 * A single hue tile. Clicking anywhere filters the palette carousel to
 * combinations that include this color; a dedicated button copies the color as
 * OKLCH. Text uses a fixed light or dark color chosen for contrast, falling
 * back to a difference blend only for ambiguous mid-tones.
 */
export function ColorSwatch({ color, index = 0, variant = "grid", className }: Props) {
  const { colorFilterId, setColorFilter } = usePalette()
  const active = colorFilterId === color.id
  const feature = variant === "feature"

  const { text, onSolid, offSolid } = readablePair(color.oklch)

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden text-left",
        feature ? "h-full w-full p-4 sm:p-5" : "aspect-[4/5] w-full p-3",
        className,
      )}
      style={{ backgroundColor: color.oklch, animationDelay: `${index * 24}ms` }}
    >
      {/* full-area filter trigger sits behind the content */}
      <button
        type="button"
        onClick={() => setColorFilter(color.id)}
        aria-pressed={active}
        aria-label={`Show palettes with ${color.name}`}
        className="absolute inset-0 z-0 cursor-pointer transition-transform duration-300 ease-out focus:outline-none"
      />

      {/* content layer — non-interactive so clicks reach the filter button */}
      <div
        className="pointer-events-none relative z-10 flex h-full flex-col justify-between"
        style={text}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("font-mono tabular-nums tracking-widest", feature ? "text-sm" : "text-xs")}>
            {String(color.id).padStart(3, "0")}
          </span>
          <span className={cn("font-serif leading-none", feature ? "text-lg" : "text-sm")} lang="ja">
            {color.nameJa}
          </span>
        </div>

        <div className="flex flex-col gap-1 pr-8">
          <h3
            className={cn(
              "font-serif font-semibold leading-tight text-balance",
              feature ? "text-2xl sm:text-3xl" : "text-base",
            )}
          >
            {color.name}
          </h3>
          <dl className={cn("font-mono uppercase leading-relaxed tracking-wide", feature ? "text-xs" : "text-[0.6rem]")}>
            <div className="flex gap-1">
              <dt className="sr-only">CMYK</dt>
              <dd>{formatCmyk(color.cmyk)}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">OKLCH</dt>
              <dd className="break-all normal-case">{color.oklch}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* copy control — above the filter trigger */}
      <CopyButton
        value={color.oklch}
        label={`Copy ${color.name} as OKLCH`}
        color={text.color}
        className="absolute bottom-2 right-2 z-20 rounded-md p-1.5"
      />

      {/* fixed two-tone ring (single inset element = no corner gap) */}
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{ boxShadow: `inset 0 0 0 3px ${onSolid}, inset 0 0 0 5px ${offSolid}` }}
        />
      )}

      {active && (
        <span
          className="absolute right-2 top-2 z-30 rounded-full px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest"
          style={{ backgroundColor: onSolid, color: offSolid }}
        >
          Filtering
        </span>
      )}
    </article>
  )
}
