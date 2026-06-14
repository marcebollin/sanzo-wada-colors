import { type SanzoColor, formatCmyk } from "../data"

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
      <div className="flex items-start justify-between" style={overlay}>
        <span className="font-mono text-xs tabular-nums tracking-widest">
          {String(color.id).padStart(3, "0")}
        </span>
        <span className="font-serif text-sm leading-none" lang="ja">
          {color.nameJa}
        </span>
      </div>

      <div className="flex flex-col gap-1" style={overlay}>
        <h3 className="font-serif text-base font-semibold leading-tight text-balance">
          {color.name}
        </h3>
        <dl className="font-mono text-[0.6rem] uppercase leading-relaxed tracking-wide">
          <div className="flex gap-1">
            <dt className="sr-only">CMYK</dt>
            <dd>{formatCmyk(color.cmyk)}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="sr-only">OKLCH</dt>
            <dd className="break-all normal-case">{color.oklch}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
