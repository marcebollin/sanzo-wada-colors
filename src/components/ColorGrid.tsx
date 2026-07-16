import { motion } from "motion/react"
import { colors } from "../data"
import { useAnimatedOklch } from "../lib/use-animated-oklch"
import { ColorSwatch } from "./ColorSwatch"
import { usePalette } from "./PaletteContext"

export function ColorGrid() {
  const { theme } = usePalette()
  const marqueeColors = [
    ...colors.map((color) => ({ color, key: `${color.id}-start` })),
    ...colors.map((color) => ({ color, key: `${color.id}-end` })),
  ]
  // Spring-animate the section surface + marquee band alongside the Hero so
  // the whole viewport reads as one palette swap.
  const ink = useAnimatedOklch(theme.ink)
  const paper = useAnimatedOklch(theme.paper)
  const accent = useAnimatedOklch(theme.accent)

  return (
    <motion.section style={{ backgroundColor: ink, color: paper }}>
      {/* decorative marquee band of every hue */}
      <motion.div
        className="relative overflow-hidden pt-1"
        style={{ borderColor: accent }}
      >
        <div className="marquee-track flex w-max" data-color-marquee>
          {marqueeColors.map(({ color: c, key }) => (
            <span
              key={key}
              className="h-8 w-10 shrink-0 sm:h-10 sm:w-14"
              style={{ backgroundColor: c.oklch }}
              aria-hidden="true"
            />
          ))}
        </div>
      </motion.div>

      {/* dense, flexible grid of the full color set — tiles flow side by side */}
      <div
        className="color-grid grid gap-1 p-1 pb-44"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))",
        }}
      >
        {colors.map((c, i) => (
          <ColorSwatch key={c.id} color={c} index={i} />
        ))}
      </div>
    </motion.section>
  )
}
