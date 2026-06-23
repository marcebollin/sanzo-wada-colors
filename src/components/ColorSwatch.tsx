import { motion, type MotionValue } from "motion/react"
import { type SanzoColor } from "../data"
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
  /**
   * Optional animated background color. When provided, the swatch binds its
   * background to this MotionValue (e.g. a spring-animated OKLCH value)
   * instead of the static `color.oklch`. Used by the Hero to cross-fade the
   * active palette tile-by-tile while the rest of the swatch metadata stays.
   */
  bgColor?: MotionValue<string>
}

/**
 * A single hue tile. Clicking anywhere filters the palette carousel to
 * combinations that include this color; a dedicated button copies the color as
 * OKLCH. Text uses a fixed light or dark color chosen for contrast, falling
 * back to a difference blend only for ambiguous mid-tones.
 *
 * By default the index and both names are shown, with the English name, OKLCH
 * value, and copy control pinned near the bottom.
 */
export function ColorSwatch({ color, index = 0, variant = "grid", className, bgColor }: Props) {
  const { colorFilterId, setColorFilter } = usePalette()
  const active = colorFilterId === color.id
  const feature = variant === "feature"

  const { text, light, dark } = readablePair(color.oklch)

  return (
    <motion.article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden text-left",
        feature ? "h-full w-full p-4 sm:p-5" : "aspect-[4/5] w-full p-3",
        className,
      )}
      style={{
        backgroundColor: bgColor ?? color.oklch,
        animationDelay: `${index * 24}ms`,
      }}
      data-active={active || undefined}
    >
      {/* full-area filter trigger sits behind the content */}
      <button
        type="button"
        onClick={() => setColorFilter(color.id)}
        aria-pressed={active}
        aria-label={`Show palettes with ${color.name}`}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
      />

      {/* content layer — non-interactive so clicks reach the filter button */}
      <div
        className="pointer-events-none relative z-10 flex h-full flex-col justify-between"
        style={text}
      >
        {feature && (
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-sm tabular-nums tracking-widest">
              {String(color.id).padStart(3, "0")}
            </span>
            <span className="font-serif text-lg leading-none" lang="ja">
              {color.nameJa}
            </span>
          </div>
        )}

        <div className="flex flex-col mt-auto">
          {feature ? (
            <h3 className="font-serif text-xl font-semibold leading-tight text-balance sm:text-2xl">
              {color.name}
            </h3>
          ) : (
            <span className="font-serif text-lg leading-none" lang="ja">
              {color.nameJa}
            </span>
          )}
          {feature && (
            <dl className="mt-1 font-mono uppercase leading-relaxed tracking-wide text-xs">
              <div className="flex items-start gap-2">
                <dt className="sr-only">OKLCH</dt>
                <dd className="min-w-0 flex-1 break-all normal-case">{color.oklch}</dd>
                <CopyButton
                  value={color.oklch}
                  label={`Copy ${color.name} as OKLCH`}
                  color={text.color}
                  className="pointer-events-auto -mr-0.5 mt-px shrink-0 rounded-md p-0.5 opacity-75 hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* fixed two-tone ring (single inset element = no corner gap) */}
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{ boxShadow: `inset 0 0 0 3px ${light}, inset 0 0 0 5px ${dark}` }}
        />
      )}
    </motion.article>
  )
}
