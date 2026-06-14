import { colors } from "../data"
import { ColorSwatch } from "./ColorSwatch"
import { SectionHeading } from "./SectionHeading"

export function ColorGrid() {
  return (
    <section id="colors" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <SectionHeading
        index="01"
        title="The Colors"
        subtitle={`${colors.length} hues, each catalogued by its natural name, Japanese CMYK formula, and OKLCH value.`}
      />

      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {colors.map((color, i) => (
          <ColorSwatch key={color.id} color={color} index={i} />
        ))}
      </div>
    </section>
  )
}
