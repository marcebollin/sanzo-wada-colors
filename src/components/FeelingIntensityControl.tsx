import { ShapeRange } from "./ShapeRange"

type Props = {
  hue: number
  intensity: number
  onChange: (intensity: number) => void
  paper: string
  labelColor: string
  highlight: string
}

export function FeelingIntensityControl({
  hue,
  intensity,
  onChange,
  paper,
  labelColor,
  highlight,
}: Props) {
  return (
    <div className="flex w-full max-w-[28rem] items-center gap-3 sm:gap-5">
      <span className="w-16 shrink-0 text-center font-mono text-sm font-bold uppercase tracking-[0.12em] opacity-75">
        Subtle
      </span>

      <ShapeRange
        value={intensity}
        onChange={onChange}
        hue={hue}
        paper={paper}
        labelColor={labelColor}
        highlight={highlight}
        ariaLabel="Feeling intensity"
        ariaValueText={`${intensity} percent intensity`}
        className="min-w-0 flex-1"
      />

      <span className="w-16 shrink-0 text-center font-mono text-sm font-bold uppercase tracking-[0.12em] opacity-75">
        Strong
      </span>
    </div>
  )
}
