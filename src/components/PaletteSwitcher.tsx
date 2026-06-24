import { motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getColor, getCombinationColors } from "../data"
import { readablePair, rolesForBackground } from "../lib/palette-theme"
import {
  useAnimatedOklch,
  useAnimatedOklchArray,
} from "../lib/use-animated-oklch"
import { usePalette } from "./PaletteContext"
import { PaletteIdCombobox } from "./PaletteIdCombobox"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const SIZES = [2, 3, 4] as const

export function PaletteSwitcher() {
  const {
    combination,
    filtered,
    theme,
    select,
    sizeFilter,
    setSizeFilter,
    colorFilterId,
    setColorFilter,
  } = usePalette()

  // Traditional selected-element model: `combination.id` is the source of truth.
  // Selection is driven ONLY by clicking a chip or pressing an arrow — the
  // carousel is freely draggable (mouse/touch) via Embla, but scroll/drag alone
  // never changes the selection. The selected slide is scrolled into view
  // whenever the selection changes.
  const [api, setApi] = useState<CarouselApi>()
  // Drag-free keeps touch and mouse swipes fluid; selection still only changes
  // by clicking a chip or pressing an arrow.
  const opts = useMemo(
    () => ({
      align: "start" as const,
      containScroll: "trimSnaps" as const,
      dragFree: true,
      skipSnaps: true,
    }),
    [],
  )

  const subtle = `color-mix(in oklch, ${theme.paper} 22%, transparent)`
  const filterColor =
    colorFilterId != null ? getColor(colorFilterId) : undefined
  const banner =
    filterColor != null ? rolesForBackground(theme, filterColor.oklch) : null
  const bannerBgMv = useAnimatedOklch(banner?.bg ?? theme.accent)
  const bannerOnMv = useAnimatedOklch(banner?.on ?? theme.onAccent)
  const bannerHighlightMv = useAnimatedOklch(banner?.highlight ?? theme.heroCap)

  // Spring-animated roles so the switcher cross-fades in lockstep with the
  // Hero when the active palette changes.
  const inkMv = useAnimatedOklch(theme.ink)
  const paperMv = useAnimatedOklch(theme.paper)
  const accentMv = useAnimatedOklch(theme.accent)
  const swatchMvs = useAnimatedOklchArray(theme.swatches.map((s) => s.css))

  const activeIndex = filtered.findIndex((c) => c.id === combination.id)
  const canPrev = activeIndex > 0
  const canNext = activeIndex >= 0 && activeIndex < filtered.length - 1

  const step = useCallback(
    (dir: -1 | 1) => {
      const next = filtered[activeIndex + dir]
      if (next) select(next.id)
    },
    [activeIndex, filtered, select],
  )

  // Scroll the carousel to the selected slide whenever the selection changes
  // (via click or arrow). We never listen to embla's "select" event — dragging
  // the carousel does not commit a selection. When a filter changes the
  // selection (active palette hidden → first of filtered), `activeIndex`
  // updates and this same effect brings it into view.
  useEffect(() => {
    if (!api || activeIndex < 0) return
    api.scrollTo(activeIndex, true)
  }, [api, activeIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
      ) {
        return
      }

      if (event.key === "ArrowLeft" && canPrev) {
        event.preventDefault()
        step(-1)
      }

      if (event.key === "ArrowRight" && canNext) {
        event.preventDefault()
        step(1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [canNext, canPrev, step])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <motion.div
        className="pointer-events-auto w-full max-w-4xl overflow-hidden rounded-2xl border-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur"
        style={{ color: paperMv, borderColor: accentMv }}
      >
        {/* color-filter banner (only one color at a time) */}
        {filterColor && banner && (
          <motion.div
            className="flex items-center gap-3 px-3 py-2 sm:px-4"
            style={{ backgroundColor: bannerBgMv, color: bannerOnMv }}
          >
            <motion.span
              className="h-5 w-5 shrink-0 rounded-sm border border-black/20"
              style={{
                backgroundColor: bannerBgMv,
                borderColor: bannerHighlightMv,
              }}
              aria-hidden="true"
            />
            <p className="min-w-0 flex-1 truncate font-mono text-[0.7rem] uppercase tracking-[0.18em]">
              {`${filtered.length} palettes with `}
              <motion.span
                className="font-black"
                style={{ color: bannerHighlightMv }}
              >
                {filterColor.name}
              </motion.span>
            </p>
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-current px-2 font-mono text-[0.65rem] uppercase tracking-widest transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70"
            >
              <CloseIcon /> Clear
            </button>
          </motion.div>
        )}

        <motion.div
          className="flex items-center gap-3 p-3 sm:gap-4"
          style={{ backgroundColor: inkMv }}
        >
          {/* active palette readout */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="flex h-12 overflow-hidden rounded-md"
              aria-hidden="true"
            >
              {theme.swatches.map((s, i) => (
                <motion.span
                  key={s.id}
                  className="h-full w-3.5 sm:w-4"
                  style={{ backgroundColor: swatchMvs[i] }}
                />
              ))}
            </div>
            {/* active palette readout — click the ID to open a searchable
              combobox that jumps the carousel to any palette. */}
            <PaletteIdCombobox
              combination={combination}
              palettes={filtered}
              theme={theme}
              onSelect={select}
            />
          </div>

          {/* palette carousel — freely draggable (mouse/touch) via Embla, but selection
              is driven only by clicking a chip or pressing an arrow. The
              selected slide is scrolled into view whenever the selection changes. */}
          <div className="flex min-h-12 min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            {filtered.length > 0 ? (
              <>
                <ArrowButton
                  dir="prev"
                  disabled={!canPrev}
                  onClick={() => step(-1)}
                  theme={theme}
                  subtle={subtle}
                />
                <Carousel
                  opts={opts}
                  setApi={setApi}
                  className="min-w-0 flex-1 cursor-pointer active:cursor-grabbing"
                >
                  <CarouselContent className="-ml-2">
                    {filtered.map((c) => {
                      const active = c.id === combination.id
                      const chip = getCombinationColors(c)
                      return (
                        <CarouselItem key={c.id} className="basis-auto pl-2">
                          <button
                            type="button"
                            onClick={() => select(c.id)}
                            aria-pressed={active}
                            title={`Palette ${String(c.id).padStart(2, "0")} · ${chip.length} colors`}
                            className={
                              "group flex h-12 cursor-pointer items-stretch overflow-hidden rounded-md border-2 transition-[opacity,border-color] duration-200 hover:opacity-100 focus:outline-none focus-visible:opacity-100 " +
                              (active ? "opacity-100" : "opacity-70")
                            }
                            style={{
                              borderColor: active
                                ? readablePair(theme.accent).light
                                : "transparent",
                            }}
                          >
                            {chip.map((sc) => (
                              <span
                                key={sc.id}
                                className="h-full w-4 sm:w-5"
                                style={{ backgroundColor: sc.oklch }}
                              />
                            ))}
                          </button>
                        </CarouselItem>
                      )
                    })}
                  </CarouselContent>
                </Carousel>
                <ArrowButton
                  dir="next"
                  disabled={!canNext}
                  onClick={() => step(1)}
                  theme={theme}
                  subtle={subtle}
                />
              </>
            ) : (
              <p className="w-full text-center font-mono text-xs uppercase tracking-widest opacity-70">
                No palettes match this filter.
              </p>
            )}
          </div>

          {/* size filter popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Filter palettes by color count"
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-md border-2 px-2.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors focus:outline-none sm:px-3"
                style={{
                  borderColor: sizeFilter != null ? theme.accent : subtle,
                  color: theme.paper,
                }}
              >
                <SlidersIcon />
                <span className="hidden sm:inline">
                  {sizeFilter != null ? `${sizeFilter} colors` : "Filter"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 rounded-xl border-2 p-3"
              style={{
                backgroundColor: theme.ink,
                color: theme.paper,
                borderColor: theme.accent,
              }}
            >
              <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.25em] opacity-70">
                Colors per palette
              </p>
              <div className="flex gap-1.5">
                <FilterPill
                  active={sizeFilter == null}
                  onClick={() => setSizeFilter(null)}
                  theme={theme}
                >
                  All
                </FilterPill>
                {SIZES.map((n) => (
                  <FilterPill
                    key={n}
                    active={sizeFilter === n}
                    onClick={() => setSizeFilter(n)}
                    theme={theme}
                  >
                    {n}
                  </FilterPill>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      </motion.div>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  theme,
  children,
}: {
  active: boolean
  onClick: () => void
  theme: ReturnType<typeof usePalette>["theme"]
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex h-9 flex-1 items-center justify-center rounded-md border-2 font-mono text-sm transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:-translate-y-0.5"
      style={{
        backgroundColor: active ? theme.accent : "transparent",
        color: active ? theme.onAccent : theme.paper,
        borderColor: active
          ? theme.accent
          : `color-mix(in oklch, ${theme.paper} 22%, transparent)`,
      }}
    >
      {children}
    </button>
  )
}

function ArrowButton({
  dir,
  disabled,
  onClick,
  theme,
  subtle,
}: {
  dir: "prev" | "next"
  disabled: boolean
  onClick: () => void
  theme: ReturnType<typeof usePalette>["theme"]
  subtle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous palette" : "Next palette"}
      className="flex h-12 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100 disabled:cursor-default disabled:opacity-25 sm:w-8"
      style={{
        borderColor: subtle,
        color: theme.paper,
        opacity: disabled ? undefined : 0.7,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === "next" ? "rotate(180deg)" : undefined }}
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  )
}

function CloseIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
      <circle cx="16" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="13" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
