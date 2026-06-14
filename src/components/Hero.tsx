import { usePalette } from "./PaletteContext"
import { DropCapTitle } from "./DropCapTitle"
import { getCombinationColors } from "../data"

export function Hero() {
  const { theme, combination } = usePalette()
  const palette = getCombinationColors(combination)

  // White text + difference blend = always legible over any swatch color.
  const overlay: React.CSSProperties = {
    color: "#fff",
    mixBlendMode: "difference",
  }

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
          capColor={theme.accent}
          className="mt-1 max-w-4xl text-[clamp(2rem,6.5vw,5rem)]"
          style={{ color: theme.onHero }}
        >
          of Color Combinations
        </DropCapTitle>

        {/* the active palette, shown big */}
        <div className="mt-10 flex flex-col gap-1 sm:flex-row sm:gap-1.5">
          {palette.map((c) => (
            <div
              key={c.id}
              className="relative flex h-40 flex-1 items-end overflow-hidden p-4 sm:h-64"
              style={{
                backgroundColor: c.oklch,
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${theme.onHero} 35%, transparent)`,
              }}
            >
              <span
                className="absolute left-4 top-4 font-mono text-xs tracking-widest"
                style={overlay}
              >
                {String(c.id).padStart(3, "0")}
              </span>
              <span
                className="font-serif text-xl font-semibold leading-tight sm:text-2xl"
                style={overlay}
              >
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
