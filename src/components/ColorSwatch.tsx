import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
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
 *
 * By default the index and both names are shown, with the English name pinned to
 * the bottom. On hover/focus the color code and copy control rise in from the
 * bottom, pushing the English name upward via a Motion layout animation.
 */
export function ColorSwatch({ color, index = 0, variant = "grid", className }: Props) {
  const { colorFilterId, setColorFilter } = usePalette()
  const active = colorFilterId === color.id
  const feature = variant === "feature"
  const [revealed, setRevealed] = useState(false)

  // Fast, smooth, near-critically-damped spring shared by the reveal motions.
  const spring = { type: "spring", stiffness: 600, damping: 38, mass: 0.6 } as const

  const { text, light, dark } = readablePair(color.oklch)

  return (
    <motion.article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden text-left",
        feature ? "h-full w-full p-4 sm:p-5" : "aspect-[4/5] w-full p-3",
        className,
      )}
      style={{ backgroundColor: color.oklch, animationDelay: `${index * 24}ms` }}
      data-active={active || undefined}
      onHoverStart={() => setRevealed(true)}
      onHoverEnd={() => setRevealed(false)}
      onFocusCapture={() => setRevealed(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setRevealed(false)
      }}
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

        <div className={cn("flex flex-col", !feature && "mt-auto", feature && "pr-8")}>
          {feature ? (
            <motion.h3
              layout
              transition={spring}
              className="font-serif text-xl font-semibold leading-tight text-balance sm:text-2xl"
            >
              {color.name}
            </motion.h3>
          ) : (
            <span className="font-serif text-lg leading-none" lang="ja">
              {color.nameJa}
            </span>
          )}
          {feature && (
            <AnimatePresence initial={false}>
              {revealed && (
                <motion.dl
                  key="code"
                  initial={{ opacity: 0, height: 0, marginTop: 0, y: 8 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 4, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, y: 8 }}
                  transition={spring}
                  className="overflow-hidden font-mono uppercase leading-relaxed tracking-wide text-xs"
                >
                  <div className="flex gap-1">
                    <dt className="sr-only">CMYK</dt>
                    <dd>{formatCmyk(color.cmyk)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="sr-only">OKLCH</dt>
                    <dd className="break-all normal-case">{color.oklch}</dd>
                  </div>
                </motion.dl>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* copy control — rises in from the bottom, above the filter trigger */}
      {feature && (
        <AnimatePresence>
          {revealed && (
            <motion.div
              key="copy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={spring}
              className="absolute bottom-2 right-2 z-20"
            >
              <CopyButton
                value={color.oklch}
                label={`Copy ${color.name} as OKLCH`}
                color={text.color}
                className="rounded-md p-1.5"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

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
