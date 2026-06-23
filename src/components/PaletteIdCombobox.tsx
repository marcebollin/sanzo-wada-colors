import { useEffect, useMemo, useRef, useState } from "react"
import { getCombinationColors, type SanzoCombination } from "../data"
import type { PaletteTheme } from "../lib/palette-theme"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type Props = {
  combination: SanzoCombination
  /** Palettes currently visible in the carousel (after filters). */
  palettes: SanzoCombination[]
  theme: PaletteTheme
  onSelect: (id: number) => void
}

export function PaletteIdCombobox({
  combination,
  palettes,
  theme,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)

  const sorted = useMemo(
    () => [...palettes].sort((a, b) => a.id - b.id),
    [palettes],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (c) => String(c.id).includes(q) || c.name.toLowerCase().includes(q),
    )
  }, [sorted, query])

  useEffect(() => {
    if (!open) return
    setQuery("")
    const t = window.setTimeout(() => {
      searchRef.current?.focus()
      activeItemRef.current?.scrollIntoView({ block: "center" })
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  function handleSelect(id: number) {
    onSelect(id)
    setOpen(false)
  }

  const subtle = `color-mix(in oklch, ${theme.paper} 22%, transparent)`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Jump to palette by ID"
          className="group hidden min-w-0 cursor-pointer leading-none transition-opacity hover:opacity-80 focus:outline-none focus-visible:opacity-80 sm:block"
        >
          <p className="font-display text-3xl">
            {String(combination.id).padStart(2, "0")}
            <span className="ml-0.5 inline-flex align-top font-mono text-[0.85rem] opacity-70">
              <span className="mx-1.5">/</span>
              <span>{palettes.length}</span>
            </span>
          </p>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={10}
        className="palette-id-popover w-72 rounded-xl border-2 p-0"
        style={
          {
            backgroundColor: theme.ink,
            color: theme.paper,
            borderColor: theme.accent,
            "--p-accent": theme.accent,
            "--p-paper": theme.paper,
            "--p-ink": theme.ink,
          } as React.CSSProperties
        }
      >
        <div
          className="flex items-center gap-2 border-b-2 px-2.5 py-2"
          style={{ borderColor: subtle }}
        >
          <SearchIcon />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by number"
            aria-label="Search palettes by ID"
            className="w-full bg-transparent text-base font-mono uppercase tracking-widest placeholder:opacity-50 focus:outline-none"
            style={{ color: theme.paper }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                searchRef.current?.focus()
              }}
              aria-label="Clear search"
              className="shrink-0 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        <div className="palette-id-scroll max-h-72 overflow-y-auto p-1.5">
          {filtered.length > 0 ? (
            filtered.map((c) => {
              const active = c.id === combination.id
              const chip = getCombinationColors(c)
              return (
                <button
                  key={c.id}
                  ref={active ? activeItemRef : undefined}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  aria-pressed={active}
                  title={`Palette ${String(c.id).padStart(2, "0")} · ${chip.length} colors`}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-md border-2 px-2 py-1.5 text-left transition-colors last:mb-0 focus:outline-none"
                  style={{
                    borderColor: active ? theme.accent : "transparent",
                    backgroundColor: active
                      ? `color-mix(in oklch, ${theme.accent} 18%, transparent)`
                      : undefined,
                  }}
                >
                  <span
                    className="w-6 shrink-0 font-mono text-xs tabular-nums tracking-widest"
                    style={{ color: active ? theme.accent : theme.paper }}
                  >
                    {String(c.id).padStart(2, "0")}
                  </span>
                  <span className="flex h-4 flex-1 items-stretch overflow-hidden rounded-sm">
                    {chip.map((sc) => (
                      <span
                        key={sc.id}
                        className="h-full flex-1"
                        style={{ backgroundColor: sc.oklch }}
                      />
                    ))}
                  </span>
                </button>
              )
            })
          ) : (
            <p className="px-2 py-4 text-center font-mono text-xs uppercase tracking-widest opacity-70">
              No palettes match "{query}".
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-70"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}
