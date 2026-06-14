import { usePalette } from "./PaletteContext"
import { DropCapTitle, Eyebrow } from "./DropCapTitle"
import { getCombinationColors, formatCmyk } from "../data"

// Bento spans per palette size, so 1-4 colors always fill a strong grid.
const SPANS: Record<number, string[]> = {
  1: ["col-span-12 row-span-2"],
  2: ["col-span-7 row-span-2", "col-span-5 row-span-2"],
  3: ["col-span-7 row-span-2", "col-span-5", "col-span-5"],
  4: ["col-span-7 row-span-2", "col-span-5", "col-span-5", "col-span-12 sm:col-span-7"],
}

export function PaletteMatrix() {
  const { combination, theme } = usePalette()
  const palette = getCombinationColors(combination)
  const spans = SPANS[palette.length] ?? SPANS[4]

  return (
    <section
      id="palette"
      className="relative px-5 py-16 sm:py-24"
      style={{ backgroundColor: theme.bg, color: theme.ink }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Eyebrow style={{ color: theme.ink }}>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
              The Selected Palette
            </Eyebrow>
            <DropCapTitle
              capColor={theme.accent}
              className="text-[clamp(2.5rem,6vw,4.5rem)]"
              style={{ color: theme.ink }}
            >
              {combination.name}
            </DropCapTitle>
            <p
              className="mt-4 max-w-lg text-pretty text-base leading-relaxed"
              style={{ color: theme.ink, opacity: 0.78 }}
            >
              {combination.note}
            </p>
          </div>
          <div
            className="shrink-0 self-start border-2 px-4 py-3 font-display text-5xl uppercase leading-none sm:self-end"
            style={{ borderColor: theme.accent, color: theme.accent }}
          >
            {String(palette.length).padStart(2, "0")}
            <span
              className="ml-2 align-top font-mono text-[0.55rem] tracking-widest"
              style={{ color: theme.ink, opacity: 0.7 }}
            >
              {palette.length === 1 ? "color" : "colors"}
            </span>
          </div>
        </div>

        <div className="grid auto-rows-[10rem] grid-cols-12 gap-2 sm:auto-rows-[12rem]">
          {palette.map((c, i) => {
            const sw = theme.swatches.find((s) => s.id === c.id)
            const on = sw?.on ?? theme.ink
            return (
              <article
                key={c.id}
                className={`group relative flex flex-col justify-between overflow-hidden p-4 sm:p-5 ${spans[i] ?? "col-span-6"}`}
                style={{ backgroundColor: c.oklch, color: on }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs tracking-widest" style={{ opacity: 0.8 }}>
                    {String(c.id).padStart(3, "0")}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ opacity: 0.8 }}>
                    {formatCmyk(c.cmyk)}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                    {c.name}
                  </h3>
                  <p className="mt-1 font-mono text-[0.65rem] tracking-wide" style={{ opacity: 0.8 }}>
                    {c.oklch}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
