import { colors } from "../data"
import { usePalette } from "./PaletteContext"
import { ColorSwatch } from "./ColorSwatch"

export function ColorGrid() {
  const { theme } = usePalette()

  return (
    <section style={{ backgroundColor: theme.ink, color: theme.paper }}>
      {/* decorative marquee band of every hue */}
      <div
        className="relative overflow-hidden border-y"
        style={{ borderColor: theme.accent }}
      >
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

      {/* dense, flexible grid of the full color set — tiles flow side by side */}
      <div
        className="grid gap-1 p-1 pb-28"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))" }}
      >
        {colors.map((c, i) => (
          <ColorSwatch key={c.id} color={c} index={i} />
        ))}
      </div>
    </section>
  )
}
