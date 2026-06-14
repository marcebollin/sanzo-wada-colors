import { colors } from "../data"
import { usePalette } from "./PaletteContext"
import { DropCapTitle, Eyebrow } from "./DropCapTitle"
import { ColorSwatch } from "./ColorSwatch"

export function ColorGrid() {
  const { theme } = usePalette()

  return (
    <section id="colors" style={{ backgroundColor: theme.ink, color: theme.paper }}>
      {/* full-bleed marquee band of every hue */}
      <div className="relative overflow-hidden border-y" style={{ borderColor: theme.accent }}>
        <div className="marquee-track flex w-max">
          {[...colors, ...colors].map((c, i) => (
            <span
              key={`${c.id}-${i}`}
              className="h-8 w-10 shrink-0 sm:h-10 sm:w-14"
              style={{ backgroundColor: c.oklch }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow style={{ color: theme.paper }}>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
              The Complete Archive
            </Eyebrow>
            <DropCapTitle
              capColor={theme.accent}
              className="text-[clamp(2.5rem,6vw,4.5rem)]"
              style={{ color: theme.paper }}
            >
              {`Every Hue, Catalogued`}
            </DropCapTitle>
          </div>
          <p
            className="max-w-xs text-pretty font-mono text-xs uppercase tracking-widest sm:text-right"
            style={{ color: theme.paper, opacity: 0.7 }}
          >
            {colors.length} colors · CMYK source · OKLCH render
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {colors.map((c, i) => (
            <ColorSwatch key={c.id} color={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
