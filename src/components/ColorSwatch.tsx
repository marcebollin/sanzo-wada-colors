import { useMemo } from "react"
import { type SanzoColor, formatCmyk } from "../data"

/**
 * Decide whether to use light or dark text over the swatch by parsing the
 * lightness from the OKLCH string. Per the OKLCH skill: L > 0.6 = light bg.
 */
function readableInkFor(oklch: string): "light" | "dark" {
  const match = oklch.match(/oklch\(\s*([0-9.]+)/i)
  const l = match ? Number(match[1]) : 0.5
  return l > 0.6 ? "dark" : "light"
}

type Props = {
  color: SanzoColor
  /** Render index for the appearance animation delay. */
  index?: number
}

export function ColorSwatch({ color, index = 0 }: Props) {
  const ink = useMemo(() => readableInkFor(color.oklch), [color.oklch])
  const isDarkText = ink === "dark"

  const textColor = isDarkText ? "oklch(0.2 0.01 60)" : "oklch(0.96 0.02 92)"
  const subColor = isDarkText
    ? "oklch(0.2 0.01 60 / 0.62)"
    : "oklch(0.96 0.02 92 / 0.72)"
  const hairline = isDarkText
    ? "oklch(0.2 0.01 60 / 0.22)"
    : "oklch(0.96 0.02 92 / 0.32)"

  return (
    <article
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-4 transition-transform duration-300 ease-out hover:-translate-y-1 focus-within:-translate-y-1"
      style={{ backgroundColor: color.oklch, color: textColor, animationDelay: `${index * 24}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs tabular-nums" style={{ color: subColor }}>
          {String(color.id).padStart(3, "0")}
        </span>
        <span
          className="h-6 w-6 rounded-full border opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ borderColor: hairline }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-lg font-semibold leading-tight text-balance">{color.name}</h3>
        <div className="flex flex-col gap-0.5 font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: subColor }}>
          <span>{formatCmyk(color.cmyk)}</span>
          <span className="truncate">{color.oklch}</span>
        </div>
      </div>
    </article>
  )
}
