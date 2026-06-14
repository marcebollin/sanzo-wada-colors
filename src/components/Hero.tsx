import { colors } from "../data"

export function Hero() {
  // A ribbon of every color across the top — the archive at a glance.
  return (
    <header className="relative overflow-hidden border-b border-ink/15">
      {/* color ribbon */}
      <div className="flex h-3 w-full md:h-4" aria-hidden="true">
        {colors.map((c) => (
          <div key={c.id} className="flex-1" style={{ backgroundColor: c.oklch }} />
        ))}
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 md:flex-row md:items-end md:justify-between md:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-vermilion" />
            Wada Sanzo · 1930
          </p>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-balance md:text-7xl">
            A Dictionary of
            <span className="mt-1 block text-vermilion">Color Combinations</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-soft md:text-lg">
            An archive of the hues and harmonies catalogued by the Japanese artist
            Sanzo Wada. Every color is preserved in its original CMYK print
            formula and rendered on screen through the perceptual OKLCH color
            space.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#colors"
              className="bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-vermilion"
            >
              Browse the colors
            </a>
            <a
              href="#combinations"
              className="border border-ink/30 px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              See combinations
            </a>
          </div>
        </div>

        <dl className="grid w-full shrink-0 grid-cols-3 gap-px overflow-hidden border border-ink/15 bg-ink/15 text-center md:w-80">
          <Stat value={String(colors.length)} label="Colors" />
          <Stat value="CMYK" label="Source" />
          <Stat value="OKLCH" label="Screen" />
        </dl>
      </div>
    </header>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-paper px-2 py-5">
      <dt className="font-serif text-lg text-ink md:text-xl">{value}</dt>
      <dd className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
        {label}
      </dd>
    </div>
  )
}
