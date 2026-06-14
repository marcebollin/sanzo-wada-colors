import { useEffect, useRef } from "react"
import { usePalette } from "./PaletteContext"
import { getCombinationColors, getColor } from "../data"
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

  // Traditional selected-element model: `combination.id` is the source of truth.
  // Clicking a chip selects it, the arrows step the selection. Scrolling is never
  // user-driven — we only nudge the selected chip into view so it stays visible.
  const scrollerRef = useRef<HTMLDivElement>(null)

  const subtle = `color-mix(in oklch, ${theme.paper} 22%, transparent)`
  const filterColor = colorFilterId != null ? getColor(colorFilterId) : undefined

  const activeIndex = filtered.findIndex((c) => c.id === combination.id)
  const canPrev = activeIndex > 0
  const canNext = activeIndex >= 0 && activeIndex < filtered.length - 1

  const step = (dir: -1 | 1) => {
    const next = filtered[activeIndex + dir]
    if (next) select(next.id)
  }

  // Keep the selected chip in view whenever the selection or filtered set changes.
  // block:"nearest" avoids any vertical page scroll.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || activeIndex < 0) return
    const node = el.querySelector<HTMLElement>(`[data-palette-idx="${activeIndex}"]`)
    node?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [activeIndex])

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

          {/* palette carousel — clicking a chip selects it, the arrows step the
              selection. The selected chip is kept scrolled into view. */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            {filtered.length > 0 ? (
              <>
                <ArrowButton
                  dir="prev"
                  disabled={!canPrev}
                  onClick={() => step(-1)}
                  theme={theme}
                  subtle={subtle}
                />
                <div
                  ref={scrollerRef}
                  className="flex min-w-0 flex-1 gap-2 overflow-x-hidden py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {filtered.map((c, idx) => {
                    const active = c.id === combination.id
                    const chip = getCombinationColors(c)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        data-palette-idx={idx}
                        onClick={() => select(c.id)}
                        aria-pressed={active}
                        title={`Palette ${String(c.id).padStart(2, "0")} · ${chip.length} colors`}
                        className={
                          "group flex h-12 shrink-0 items-stretch overflow-hidden rounded-md border-2 transition-[opacity,border-color] duration-200 hover:opacity-100 focus:outline-none focus-visible:opacity-100 " +
                          (active ? "opacity-100" : "opacity-70")
                        }
                        style={{
                          borderColor: active ? theme.accent : "transparent",
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
                    )
                  })}
                  {/* spacer lets the final palettes center when selected */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none w-[80%] shrink-0 sm:w-[60%]"
                  />
                </div>
                <ArrowButton
                  dir="next"
                  disabled={!canNext}
                  onClick={() => step(1)}
                  theme={theme}
                  subtle={subtle}
                />
              </>
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
      className="flex h-12 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100 disabled:cursor-default disabled:opacity-25 sm:w-8"
      style={{ borderColor: subtle, color: theme.paper, opacity: disabled ? undefined : 0.7 }}
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
