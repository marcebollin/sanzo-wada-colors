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
    // All 338 cells make a horizontal 26 × 13 grid on mobile and a vertical
    // 26 × 13 grid at xl. At lg, the final two cells hide so 336 cells make a
    // complete 28 × 12 grid in the narrower desktop column.
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
      className="mt-8 grid w-full grid-cols-[repeat(26,minmax(0,1fr))] place-items-center gap-x-0.5 gap-y-0 sm:mt-10 lg:mt-0 lg:h-full lg:w-fit lg:grid-cols-[repeat(12,1.25rem)] lg:content-between lg:justify-self-end xl:grid-cols-[repeat(13,1.75rem)]"
    >
      {members.map((member) => (
        <svg
          key={member.id}
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`aspect-square w-full overflow-visible lg:size-5 xl:size-[1.7rem] ${
            member.id >= members.length - 2 ? "lg:hidden xl:block" : ""
          }`}
        >
          <FeelingShapePath hue={hue} amount={intensity} fill={member.color} />
        </svg>
      ))}
    </div>
  )
}
