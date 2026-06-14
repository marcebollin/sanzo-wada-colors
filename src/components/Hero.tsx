import { usePalette } from "./PaletteContext"
import { DropCapTitle } from "./DropCapTitle"
import { ColorSwatch } from "./ColorSwatch"
import { CopyPalettePopover } from "./CopyPalettePopover"
import { getCombinationColors } from "../data"

export function Hero() {
  const { theme, combination } = usePalette()
  const palette = getCombinationColors(combination)

  return (
    <header
      className="relative overflow-hidden"
      style={{ backgroundColor: theme.hero, color: theme.onHero }}
    >
      {/* strong background shapes built from the palette */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full sm:h-[34rem] sm:w-[34rem]"
        style={{ backgroundColor: theme.accent2 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-28 h-[24rem] w-[24rem] rounded-full"
        style={{ backgroundColor: theme.accent, opacity: 0.9 }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pt-20">
        {/* oversized bold display line + aligned drop-cap serif title */}
        <p
          className="font-display text-[clamp(3rem,11vw,9rem)] uppercase leading-[0.82] tracking-tight"
          style={{ color: theme.onHero }}
        >
          A Dictionary
        </p>
        <DropCapTitle
          as="h1"
          capColor={theme.heroCap}
          className="mt-1 max-w-4xl text-[clamp(2rem,6.5vw,5rem)]"
          style={{ color: theme.onHero }}
        >
          of Color Combinations
        </DropCapTitle>

        {/* the active palette, shown big — same tile as the grid, so clicking
            a block filters the carousel too */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p
            className="font-mono text-[0.65rem] uppercase tracking-[0.3em]"
            style={{ color: theme.onHero, opacity: 0.7 }}
          >
            The active palette
          </p>
          <CopyPalettePopover
            combination={combination}
            colors={palette}
            theme={theme}
            triggerColor={theme.onHero}
          />
        </div>
        <div className="mt-3 grid auto-cols-fr grid-flow-row gap-1 sm:grid-flow-col sm:gap-1.5">
          {palette.map((c, i) => (
            <div
              key={c.id}
              className="h-40 sm:h-64"
              style={{
                border: `1px solid color-mix(in oklch, ${theme.onHero} 28%, transparent)`,
              }}
            >
              <ColorSwatch color={c} index={i} variant="feature" />
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
