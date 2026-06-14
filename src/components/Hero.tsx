import { usePalette } from "./PaletteContext"
import { DropCapTitle, Eyebrow } from "./DropCapTitle"
import { colors } from "../data"

export function Hero() {
  const { theme, combination } = usePalette()
  const swatches = theme.swatches

  return (
    <header
      className="relative overflow-hidden"
      style={{ backgroundColor: theme.hero, color: theme.onHero }}
    >
      {/* ---- strong background shapes built from the palette ---- */}
      {/* oversized disc, top-right */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full sm:h-[34rem] sm:w-[34rem]"
        style={{ backgroundColor: theme.accent2 }}
        aria-hidden="true"
      />
      {/* thick quarter-arc, bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-40 -left-28 h-[24rem] w-[24rem] rounded-full"
        style={{
          backgroundColor: theme.accent,
          opacity: 0.9,
        }}
        aria-hidden="true"
      />

      {/* color spine: a full-height stack of the active palette on the right */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 flex-col lg:flex"
        aria-hidden="true"
      >
        {swatches.map((s) => (
          <div key={s.id} className="flex-1" style={{ backgroundColor: s.css }} />
        ))}
      </div>

      {/* giant ghost word = the live combination name */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-2 select-none px-4 text-center font-display uppercase leading-[0.8] text-outline opacity-[0.16]"
        style={{ color: theme.onHero, fontSize: "clamp(4rem, 18vw, 16rem)" }}
        aria-hidden="true"
      >
        {combination.name}
      </div>

      {/* vertical label, pinned so it never inflates the layout */}
      <span
        className="text-vertical absolute right-12 top-14 hidden font-mono text-[0.65rem] uppercase tracking-[0.3em] opacity-70 lg:block"
        style={{ color: theme.onHero }}
        aria-hidden="true"
      >
        配色 / Combination {String(combination.id).padStart(2, "0")}
      </span>

      {/* ---- foreground content ---- */}
      <div className="relative mx-auto max-w-6xl px-5 pb-40 pt-12 sm:pt-16 lg:pb-48">
        <Eyebrow style={{ color: theme.onHero }}>
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          Wada Sanzo · Haishoku Soukan · 1930
        </Eyebrow>

        {/* oversized bold display line */}
        <p
          className="mt-5 font-display text-[clamp(3.5rem,13vw,11rem)] uppercase leading-[0.82] tracking-tight"
          style={{ color: theme.onHero }}
        >
          A Dictionary
        </p>

        {/* serif title with the enlarged, colored first character */}
        <DropCapTitle
          as="h1"
          capColor={theme.accent}
          className="mt-2 max-w-4xl text-[clamp(2.25rem,7vw,5.5rem)]"
          style={{ color: theme.onHero }}
        >
          of Color Combinations
        </DropCapTitle>

        <p
          className="mt-8 max-w-xl text-pretty text-base leading-relaxed sm:text-lg"
          style={{ color: theme.onHero, opacity: 0.92 }}
        >
          {colors.length} hues from Sanzo Wada&apos;s historic archive — each kept
          in its original Japanese CMYK formula and rendered on screen through the
          perceptual OKLCH color space. Choose a palette below and watch the whole
          page recolor itself.
        </p>

        {/* the active palette as bold, labeled blocks */}
        <div className="mt-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {swatches.map((s) => (
            <div
              key={s.id}
              className="flex min-w-[8.5rem] flex-1 flex-col justify-between gap-6 p-3 sm:min-w-[10rem]"
              style={{ backgroundColor: s.css, color: s.on }}
            >
              <span className="font-mono text-[0.6rem] tracking-widest opacity-80">
                {String(s.id).padStart(3, "0")}
              </span>
              <span className="font-serif text-base font-semibold leading-tight">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
