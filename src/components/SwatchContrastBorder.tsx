import { readablePair } from "../lib/palette-theme"

export function SwatchContrastBorder({ color }: { color: string }) {
  const { text } = readablePair(color)

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 border opacity-50"
      style={{ borderColor: text.color }}
    />
  )
}
