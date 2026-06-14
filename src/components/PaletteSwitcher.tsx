import { usePalette } from "./PaletteContext"
import { getCombinationColors } from "../data"

/**
 * A fixed dock that drives the entire page theme. Selecting a combination
 * re-skins every section through the OKLCH theme engine.
 */
export function PaletteSwitcher() {
  const { combination, combinations, theme, select } = usePalette()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        className="pointer-events-auto flex w-full max-w-4xl flex-col gap-3 border-2 p-3 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur sm:flex-row sm:items-center sm:gap-4"
        style={{
          backgroundColor: theme.ink,
          color: theme.paper,
          borderColor: theme.accent,
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* current palette swatches */}
          <div
            className="flex h-10 shrink-0 overflow-hidden border"
            style={{ borderColor: `color-mix(in oklch, ${theme.paper} 30%, transparent)` }}
            aria-hidden="true"
          >
            {theme.swatches.map((s) => (
              <span key={s.id} className="h-full w-4 sm:w-5" style={{ backgroundColor: s.css }} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] opacity-70">
              Palette {String(combination.id).padStart(2, "0")} / {combinations.length}
            </p>
            <p className="truncate font-serif text-lg font-semibold leading-tight">
              {combination.name}
            </p>
          </div>
        </div>

        {/* combination chips */}
        <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1 sm:justify-end sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {combinations.map((c) => {
            const active = c.id === combination.id
            const chip = getCombinationColors(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c.id)}
                aria-pressed={active}
                title={c.name}
                className="group flex h-9 shrink-0 items-center gap-px overflow-hidden border-2 px-px transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:-translate-y-0.5"
                style={{
                  borderColor: active ? theme.accent : "transparent",
                  outline: active ? "none" : undefined,
                  opacity: active ? 1 : 0.85,
                }}
              >
                {chip.map((sc) => (
                  <span
                    key={sc.id}
                    className="h-full w-3.5 sm:w-4"
                    style={{ backgroundColor: sc.oklch }}
                  />
                ))}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
