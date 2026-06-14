import {
  combinations,
  getCombinationColors,
  type SanzoCombination,
} from "../data"
import { usePalette } from "./PaletteContext"
import { DropCapTitle, Eyebrow } from "./DropCapTitle"

export function PaletteShowcase() {
  const { theme, combination: active, select } = usePalette()

  return (
    <section
      id="combinations"
      className="px-5 py-16 sm:py-24"
      style={{ backgroundColor: theme.paper, color: theme.ink }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <Eyebrow style={{ color: theme.ink }}>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            All Harmonies
          </Eyebrow>
          <DropCapTitle
            capColor={theme.accent}
            className="text-[clamp(2.5rem,6vw,4.5rem)]"
            style={{ color: theme.ink }}
          >
            {`Combinations to Explore`}
          </DropCapTitle>
          <p
            className="mt-4 text-pretty text-base leading-relaxed"
            style={{ color: theme.ink, opacity: 0.78 }}
          >
            Each palette references the archive by color id and can hold one to
            four hues. Select any row to recolor the entire page through the
            OKLCH theme engine.
          </p>
        </div>

        <ul className="flex flex-col">
          {combinations.map((combo) => (
            <PaletteRow
              key={combo.id}
              combo={combo}
              active={combo.id === active.id}
              ink={theme.ink}
              accent={theme.accent}
              onSelect={() => select(combo.id)}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

function PaletteRow({
  combo,
  active,
  ink,
  accent,
  onSelect,
}: {
  combo: SanzoCombination
  active: boolean
  ink: string
  accent: string
  onSelect: () => void
}) {
  const swatches = getCombinationColors(combo)

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="group flex w-full items-stretch gap-4 border-b-2 py-4 text-left transition-colors sm:gap-8"
        style={{ borderColor: `color-mix(in oklch, ${ink} 14%, transparent)` }}
      >
        {/* index drop cap */}
        <span
          className="w-12 shrink-0 font-display text-4xl leading-none sm:w-20 sm:text-6xl"
          style={{ color: active ? accent : `color-mix(in oklch, ${ink} 30%, transparent)` }}
        >
          {String(combo.id).padStart(2, "0")}
        </span>

        {/* name + note */}
        <div className="min-w-0 flex-1 self-center">
          <h3
            className="font-serif text-xl font-semibold leading-tight sm:text-3xl"
            style={{ color: ink }}
          >
            {combo.name}
          </h3>
          <p
            className="mt-0.5 line-clamp-1 text-sm leading-relaxed"
            style={{ color: ink, opacity: 0.6 }}
          >
            {combo.note}
          </p>
        </div>

        {/* the palette strip */}
        <div className="hidden h-14 w-44 shrink-0 self-center overflow-hidden sm:flex lg:w-64">
          {swatches.map((c) => (
            <span
              key={c.id}
              className="flex-1 transition-all duration-300 group-hover:flex-[1.4]"
              style={{ backgroundColor: c.oklch }}
              title={c.name}
            />
          ))}
        </div>

        {/* count + active mark */}
        <div className="flex w-10 shrink-0 flex-col items-end justify-center gap-1 sm:w-16">
          <span
            className="font-mono text-[0.6rem] uppercase tracking-widest"
            style={{ color: ink, opacity: 0.6 }}
          >
            {swatches.length} {swatches.length === 1 ? "hue" : "hues"}
          </span>
          <span
            className="h-2 w-2 rounded-full transition-transform"
            style={{
              backgroundColor: accent,
              transform: active ? "scale(1.6)" : "scale(0)",
            }}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* mobile palette strip */}
      <div className="flex h-8 w-full overflow-hidden sm:hidden">
        {swatches.map((c) => (
          <span key={c.id} className="flex-1" style={{ backgroundColor: c.oklch }} />
        ))}
      </div>
    </li>
  )
}
