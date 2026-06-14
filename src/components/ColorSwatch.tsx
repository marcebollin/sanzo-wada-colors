import { type SanzoColor, formatCmyk } from "../data"
import { usePalette } from "./PaletteContext"

type Props = {
  color: SanzoColor
  /** Render index for the appearance animation delay. */
  index?: number
}

/**
 * A single hue tile. Clicking it filters the palette carousel to combinations
 * that include this color. Labels use mix-blend-mode: difference over a white
 * base so the id and name stay legible on top of any background color.
 */
export function ColorSwatch({ color, index = 0 }: Props) {
  const { colorFilterId, setColorFilter } = usePalette()
  const active = colorFilterId === color.id

  const overlay: React.CSSProperties = {
    color: "#fff",
    mixBlendMode: "difference",
  }

  return (
    <button
      type="button"
      onClick={() => setColorFilter(color.id)}
      aria-pressed={active}
      title={`Show palettes with ${color.name}`}
      className="group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden p-3 text-left transition-transform duration-300 ease-out hover:-translate-y-1 focus:outline-none focus-visible:-translate-y-1"
      style={{
        backgroundColor: color.oklch,
        animationDelay: `${index * 24}ms`,
        boxShadow: active
          ? "inset 0 0 0 3px #fff, inset 0 0 0 6px rgba(0,0,0,0.55)"
          : undefined,
      }}
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

      {active && (
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest"
          style={{ backgroundColor: "#fff", color: "#000" }}
        >
          Filtering
        </span>
      )}
    </button>
  )
}
