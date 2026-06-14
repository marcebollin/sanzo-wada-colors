import { combinations, getCombinationColors, type SanzoCombination } from "../data"
import { SectionHeading } from "./SectionHeading"

export function PaletteShowcase() {
  return (
    <section id="combinations" className="border-t border-ink/15 bg-paper-deep">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionHeading
          index="02"
          title="Combinations"
          subtitle="Curated harmonies built from the dictionary. Each palette references colors by their id."
        />

        <div className="mt-10 grid gap-2 md:grid-cols-2">
          {combinations.map((combo) => (
            <PaletteCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PaletteCard({ combo }: { combo: SanzoCombination }) {
  const swatches = getCombinationColors(combo)

  return (
    <article className="group flex flex-col overflow-hidden border border-ink/15 bg-paper paper-edge transition-transform duration-300 hover:-translate-y-1">
      {/* the palette strip */}
      <div className="flex h-40 w-full">
        {swatches.map((color) => (
          <div
            key={color.id}
            className="relative flex-1 transition-[flex] duration-500 ease-out group-hover:[&:hover]:flex-[2.2]"
            style={{ backgroundColor: color.oklch }}
            title={`${color.name} · ${color.oklch}`}
          >
            <span className="absolute bottom-2 left-2 font-mono text-[0.6rem] tabular-nums text-paper mix-blend-difference">
              {String(color.id).padStart(3, "0")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-xl text-balance">{combo.name}</h3>
          <span className="font-mono text-xs text-ink-soft">
            {swatches.length} colors
          </span>
        </div>
        <p className="text-pretty text-sm leading-relaxed text-ink-soft">{combo.note}</p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.65rem] uppercase tracking-wide text-ink-soft">
          {swatches.map((color) => (
            <li key={color.id} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-ink/20"
                style={{ backgroundColor: color.oklch }}
              />
              {color.name}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
