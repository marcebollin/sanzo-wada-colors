import { type SanzoColor } from "../data"

type Props = {
  color: SanzoColor
  /** Render index for the appearance animation delay. */
  index?: number
}

/**
 * A single hue tile. Labels use mix-blend-mode: difference over a white base
 * so the id and name stay legible on top of any background color.
 */
export function ColorSwatch({ color, index = 0 }: Props) {
  const overlay: React.CSSProperties = {
    color: "#fff",
    mixBlendMode: "difference",
  }

  return (
    <article
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-3 transition-transform duration-300 ease-out hover:-translate-y-1 focus-within:-translate-y-1"
      style={{ backgroundColor: color.oklch, animationDelay: `${index * 24}ms` }}
    >
      <span
        className="font-mono text-xs tabular-nums tracking-widest"
        style={overlay}
      >
        {String(color.id).padStart(3, "0")}
      </span>
      <h3
        className="font-serif text-base font-semibold leading-tight text-balance"
        style={overlay}
      >
        {color.name}
      </h3>
    </article>
  )
}
