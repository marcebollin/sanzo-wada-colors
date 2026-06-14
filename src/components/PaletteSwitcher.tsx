import { useEffect, useMemo, useRef, useState } from "react"
import { usePalette } from "./PaletteContext"
import { getCombinationColors, getColor } from "../data"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "./ui/carousel"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const SIZES = [2, 3, 4] as const

export function PaletteSwitcher() {
  const {
    combination,
    combinations,
    filtered,
    theme,
    select,
    sizeFilter,
    setSizeFilter,
    colorFilterId,
    setColorFilter,
  } = usePalette()

  const [api, setApi] = useState<CarouselApi>()
  const opts = useMemo(
    () => ({ align: "start" as const, dragFree: true, containScroll: "trimSnaps" as const }),
    [],
  )

  const subtle = `color-mix(in oklch, ${theme.paper} 22%, transparent)`
  const filterColor = colorFilterId != null ? getColor(colorFilterId) : undefined

  // Keep the latest active id in a ref so the scroll listener stays mounted
  // (no resubscribe churn) even as the theme changes during a fast flick.
  const activeIdRef = useRef(combination.id)
  activeIdRef.current = combination.id

  // The start-aligned (leftmost) slide is the single source of truth for the
  // active palette. We commit on embla's "select" event — which fires once per
  // palette crossed, even during a momentum flick — instead of on every scroll
  // frame, so rapid re-themes never interrupt a smooth scrollTo animation.
  useEffect(() => {
    if (!api) return
    const update = () => {
      const i = api.selectedScrollSnap()
      const combo = filtered[i]
      if (combo && combo.id !== activeIdRef.current) select(combo.id)
    }
    update()
    api.on("select", update)
    api.on("reInit", update)
    return () => {
      api.off("select", update)
      api.off("reInit", update)
    }
  }, [api, filtered, select])

  // Snap back to the start whenever the filtered set changes.
  useEffect(() => {
    if (api) api.scrollTo(0, true)
  }, [api, sizeFilter, colorFilterId])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        className="pointer-events-auto w-full max-w-4xl overflow-hidden rounded-2xl border-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur"
        style={{ backgroundColor: theme.ink, color: theme.paper, borderColor: theme.accent }}
      >
        {/* color-filter banner (only one color at a time) */}
        {filterColor && (
          <div
            className="flex items-center gap-3 px-3 py-2 sm:px-4"
            style={{ backgroundColor: theme.accent, color: theme.onAccent }}
          >
            <span
              className="h-5 w-5 shrink-0 rounded-sm border border-black/20"
              style={{ backgroundColor: filterColor.oklch }}
              aria-hidden="true"
            />
            <p className="min-w-0 flex-1 truncate font-mono text-[0.7rem] uppercase tracking-[0.18em]">
              Palettes with{" "}
              <span className="font-semibold">{filterColor.name}</span>
              <span className="opacity-70"> · {filtered.length} found</span>
            </p>
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-current px-2 font-mono text-[0.65rem] uppercase tracking-widest transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70"
            >
              <CloseIcon /> Clear
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 sm:gap-4">
          {/* active palette readout */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="flex h-12 overflow-hidden rounded-md border"
              style={{ borderColor: subtle }}
              aria-hidden="true"
            >
              {theme.swatches.map((s) => (
                <span
                  key={s.id}
                  className="h-full w-3.5 sm:w-4"
                  style={{ backgroundColor: s.css }}
                />
              ))}
            </div>
            <div className="hidden min-w-0 leading-none sm:block">
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] opacity-60">
                配色 · Palette
              </p>
              <p className="font-display text-3xl">
                {String(combination.id).padStart(2, "0")}
                <span className="ml-1 align-top font-mono text-[0.6rem] opacity-60">
                  / {combinations.length}
                </span>
              </p>
            </div>
          </div>

          {/* scrollable palette carousel — the leftmost slide is the source of
              truth for the active palette; clicking scrolls it to the left */}
          <div className="min-w-0 flex-1">
            {filtered.length > 0 ? (
              <Carousel opts={opts} setApi={setApi} className="w-full">
                <CarouselContent className="-ml-2 py-1">
                  {filtered.map((c, idx) => {
                    const active = c.id === combination.id
                    const chip = getCombinationColors(c)
                    return (
                      <CarouselItem key={c.id} className="basis-auto pl-2">
                        <button
                          type="button"
                          onClick={() => (api ? api.scrollTo(idx) : select(c.id))}
                          aria-pressed={active}
                          title={`Palette ${String(c.id).padStart(2, "0")} · ${chip.length} colors`}
                          className={
                            "group flex h-12 items-stretch overflow-hidden rounded-md border-2 transition-[opacity,border-color] duration-200 hover:opacity-100 focus:outline-none focus-visible:opacity-100 " +
                            (active ? "opacity-100" : "opacity-70")
                          }
                          style={{ borderColor: active ? theme.accent : "transparent" }}
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
            ) : (
              <p className="font-mono text-xs uppercase tracking-widest opacity-70">
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
              style={{ backgroundColor: theme.ink, color: theme.paper, borderColor: theme.accent }}
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
        </div>
      </div>
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
        borderColor: active ? theme.accent : `color-mix(in oklch, ${theme.paper} 22%, transparent)`,
      }}
    >
      {children}
    </button>
  )
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
      <circle cx="16" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="13" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
