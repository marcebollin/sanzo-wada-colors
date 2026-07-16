import { useMemo } from "react"
import { shuffledBalancedColors } from "../lib/feeling-grid"
import { FeelingShapePath } from "./FeelingShapePath"

type Props = {
  hue: number
  intensity: number
  colors: string[]
  paletteId: number
}

function populationColors(total: number, colors: string[], paletteId: number) {
  if (colors.length === 0)
    return Array.from({ length: total }, () => "currentColor")

  // The lg grid uses the shared cells; xl adds two final cells. Those extras
  // use the least-represented colors so both complete grids remain balanced.
  const sharedCount = Math.max(0, total - 2)
  const sharedColors = shuffledBalancedColors(sharedCount, colors, paletteId)
  const leastUsedColor = (painted: string[]) => {
    const counts = new Map(colors.map((color) => [color, 0]))
    for (const color of painted) counts.set(color, (counts.get(color) ?? 0) + 1)
    return colors.reduce((least, color) =>
      (counts.get(color) ?? 0) < (counts.get(least) ?? 0) ? color : least,
    )
  }
  const firstExtraLargeColor = leastUsedColor(sharedColors)
  const secondExtraLargeColor = leastUsedColor([
    ...sharedColors,
    firstExtraLargeColor,
  ])

  return Array.from({ length: total }, (_, index) => {
    if (index === total - 2) return firstExtraLargeColor
    if (index === total - 1) return secondExtraLargeColor
    return sharedColors[index]
  })
}

export function FeelingPopulation({
  hue,
  intensity,
  colors,
  paletteId,
}: Props) {
  const members = useMemo(() => {
    // The final two cells are xl-only: 336 cells make 28 × 12 at lg, while all
    // 338 cells make 26 × 13 at xl, adding another complete responsive row.
    const count = 338
    return populationColors(count, colors, paletteId).map((color, id) => ({
      id,
      color,
    }))
  }, [colors, paletteId])

  const colorCount = useMemo(() => new Set(colors).size, [colors])

  return (
    <div
      role="img"
      aria-label={`Population painted evenly with ${colorCount} colors from selected palette ${paletteId}`}
      className="hidden h-full w-fit grid-cols-[repeat(12,1.25rem)] place-items-center content-between justify-self-end gap-x-0.5 gap-y-0 lg:grid xl:grid-cols-[repeat(13,1.75rem)]"
    >
      {members.map((member) => (
        <svg
          key={member.id}
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`size-5 overflow-visible xl:size-[1.7rem] ${
            member.id >= members.length - 2 ? "hidden xl:block" : ""
          }`}
        >
          <FeelingShapePath hue={hue} amount={intensity} fill={member.color} />
        </svg>
      ))}
    </div>
  )
}
