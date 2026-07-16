import { formatHex, rgb as toRgb } from "culori"
import { useEffect, useMemo, useRef, useState } from "react"
import { ShapeRange } from "./ShapeRange"

const PROFILE_IMAGE_SIZE = 1200
const PREVIEW_SIZE = 600

type GradientType = "mesh" | "linear" | "conic" | "halo"
type BlendMode = "source-over" | "screen" | "soft-light"

type Tuning = {
  type: GradientType
  colorOffset: number
  reversed: boolean
  positionX: number
  positionY: number
  rotation: number
  spread: number
  blur: number
  blend: BlendMode
  vignette: boolean
}

const DEFAULT_TUNING: Tuning = {
  type: "mesh",
  colorOffset: 0,
  reversed: false,
  positionX: 50,
  positionY: 50,
  rotation: 0,
  spread: 62,
  blur: 10,
  blend: "source-over",
  vignette: false,
}

const GRADIENT_TYPES: Array<{ id: GradientType; label: string }> = [
  { id: "mesh", label: "Mesh" },
  { id: "linear", label: "Linear" },
  { id: "conic", label: "Conic" },
  { id: "halo", label: "Halo" },
]

const BLEND_MODES: Array<{ id: BlendMode; label: string }> = [
  { id: "source-over", label: "Normal" },
  { id: "screen", label: "Screen" },
  { id: "soft-light", label: "Soft" },
]

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<Item>(items: Item[]) {
  return items[randomInteger(0, items.length - 1)] ?? items[0]
}

function randomTuning(colorCount: number): Tuning {
  return {
    type: randomItem(GRADIENT_TYPES)?.id ?? DEFAULT_TUNING.type,
    colorOffset: randomInteger(0, Math.max(0, colorCount - 1)),
    reversed: Math.random() >= 0.5,
    positionX: randomInteger(10, 90),
    positionY: randomInteger(10, 90),
    rotation: randomInteger(0, 360),
    spread: randomInteger(25, 100),
    blur: randomInteger(0, 40),
    blend: randomItem(BLEND_MODES)?.id ?? DEFAULT_TUNING.blend,
    vignette: Math.random() >= 0.5,
  }
}

type Props = {
  feeling: string
  hue: number
  intensity: number
  colors: string[]
  paletteId: number
  highlightColor: string
  paperColor: string
  labelColor: string
}

type GradientSpot = {
  color: string
  x: number
  y: number
  radius: number
}

function orderedPalette(colors: string[], tuning: Tuning) {
  const source = tuning.reversed ? [...colors].reverse() : [...colors]
  if (source.length === 0) return ["oklch(0.5 0 0)"]
  const offset =
    ((tuning.colorOffset % source.length) + source.length) % source.length
  return [...source.slice(offset), ...source.slice(0, offset)]
}

function gradientSpots(
  colors: string[],
  hue: number,
  intensity: number,
  tuning: Tuning,
): GradientSpot[] {
  const energy = intensity / 100
  const orbit = 0.06 + (tuning.spread / 100) * 0.33
  const radius = 0.82 - (tuning.spread / 100) * 0.36 + (1 - energy) * 0.08
  const centerX = tuning.positionX / 100
  const centerY = tuning.positionY / 100
  const count = Math.max(1, colors.length)

  return colors.map((color, index) => {
    const angle =
      ((hue - 90 + tuning.rotation + (index * 360) / count) * Math.PI) / 180
    return {
      color,
      x: centerX + Math.cos(angle) * orbit,
      y: centerY + Math.sin(angle) * orbit,
      radius,
    }
  })
}

function rgba(css: string, alpha: number) {
  const color = toRgb(css)
  if (!color) return `rgba(0, 0, 0, ${alpha})`
  const channel = (value: number | undefined) =>
    Math.round(Math.min(1, Math.max(0, value ?? 0)) * 255)
  return `rgba(${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}, ${alpha})`
}

function canvasColor(css: string) {
  return formatHex(css) ?? css
}

function addPaletteStops(
  gradient: CanvasGradient,
  colors: string[],
  start = 0,
  end = 1,
) {
  if (colors.length === 1) {
    gradient.addColorStop(start, canvasColor(colors[0]))
    gradient.addColorStop(end, canvasColor(colors[0]))
    return
  }

  colors.forEach((color, index) => {
    const position = start + (index / (colors.length - 1)) * (end - start)
    gradient.addColorStop(position, canvasColor(color))
  })
}

function drawGradient(
  canvas: HTMLCanvasElement,
  size: number,
  colors: string[],
  hue: number,
  intensity: number,
  tuning: Tuning,
) {
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) return

  const palette = orderedPalette(colors, tuning)
  const baseColor = palette[0]
  context.fillStyle = canvasColor(baseColor)
  context.fillRect(0, 0, size, size)

  const blurPixels = (tuning.blur / 1000) * size
  const layerPadding = Math.ceil(Math.max(size * 0.08, blurPixels * 4))
  const layerSize = size + layerPadding * 2
  const layer = document.createElement("canvas")
  layer.width = layerSize
  layer.height = layerSize
  const layerContext = layer.getContext("2d")
  if (!layerContext) return

  const centerX = layerPadding + (tuning.positionX / 100) * size
  const centerY = layerPadding + (tuning.positionY / 100) * size
  const rotation = ((hue + tuning.rotation) * Math.PI) / 180
  const spread = tuning.spread / 100

  if (tuning.type === "mesh") {
    const spots = gradientSpots(palette, hue, intensity, tuning)
    for (const spot of spots) {
      const x = layerPadding + spot.x * size
      const y = layerPadding + spot.y * size
      const radius = spot.radius * size
      const gradient = layerContext.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, rgba(spot.color, 1))
      gradient.addColorStop(0.34, rgba(spot.color, 0.9))
      gradient.addColorStop(1, rgba(spot.color, 0))
      layerContext.fillStyle = gradient
      layerContext.fillRect(0, 0, layerSize, layerSize)
    }
  } else if (tuning.type === "linear") {
    const radius = size * 0.8
    const dx = Math.cos(rotation) * radius
    const dy = Math.sin(rotation) * radius
    const gradient = layerContext.createLinearGradient(
      centerX - dx,
      centerY - dy,
      centerX + dx,
      centerY + dy,
    )
    const range = 0.4 + spread * 0.6
    addPaletteStops(gradient, palette, (1 - range) / 2, (1 + range) / 2)
    layerContext.fillStyle = gradient
    layerContext.fillRect(0, 0, layerSize, layerSize)
  } else if (tuning.type === "conic") {
    const gradient = layerContext.createConicGradient(
      rotation,
      centerX,
      centerY,
    )
    palette.forEach((color, index) => {
      gradient.addColorStop(index / palette.length, canvasColor(color))
    })
    gradient.addColorStop(1, canvasColor(palette[0]))
    layerContext.fillStyle = gradient
    layerContext.fillRect(0, 0, layerSize, layerSize)
  } else {
    const radius = size * (0.45 + spread * 0.55)
    const gradient = layerContext.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    )
    addPaletteStops(gradient, palette)
    layerContext.fillStyle = gradient
    layerContext.fillRect(0, 0, layerSize, layerSize)
  }

  context.save()
  context.globalCompositeOperation = tuning.blend
  context.filter = `blur(${blurPixels}px)`
  context.drawImage(layer, -layerPadding, -layerPadding)
  context.restore()

  if (tuning.vignette) {
    const dark = palette[palette.length - 1]
    const vignette = context.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.28,
      size / 2,
      size / 2,
      size * 0.72,
    )
    vignette.addColorStop(0, rgba(dark, 0))
    vignette.addColorStop(1, rgba(dark, 0.48))
    context.fillStyle = vignette
    context.fillRect(0, 0, size, size)
  }
}

function fileSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function DesignEngineerExport({
  feeling,
  hue,
  intensity,
  colors,
  paletteId,
  highlightColor,
  paperColor,
  labelColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tuning, setTuning] = useState<Tuning>(DEFAULT_TUNING)
  const [exporting, setExporting] = useState(false)
  const palette = useMemo(
    () => orderedPalette(colors, tuning),
    [colors, tuning],
  )

  useEffect(() => {
    if (!canvasRef.current) return
    drawGradient(
      canvasRef.current,
      PREVIEW_SIZE,
      colors,
      hue,
      intensity,
      tuning,
    )
  }, [colors, hue, intensity, tuning])

  function updateTuning<Key extends keyof Tuning>(
    key: Key,
    value: Tuning[Key],
  ) {
    setTuning((current) => ({ ...current, [key]: value }))
  }

  async function downloadProfileImage() {
    setExporting(true)

    try {
      const canvas = document.createElement("canvas")
      drawGradient(canvas, PROFILE_IMAGE_SIZE, colors, hue, intensity, tuning)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      })
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${fileSlug(feeling)}-palette-${paletteId}-design-engineer-profile.jpg`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section aria-labelledby="design-engineer-title">
      <h2
        id="design-engineer-title"
        className="text-right font-display text-4xl font-bold sm:text-5xl"
      >
        Be a Design Engineer
      </h2>
      <a
        href="https://t.co/jZhjBkiMaE"
        target="_blank"
        rel="noreferrer"
        className="mt-2 block text-right font-mono text-xs font-semibold uppercase tracking-[0.14em] opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
      >
        https://t.co/jZhjBkiMaE
      </a>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)] xl:items-start xl:gap-12">
        <div className="grid min-w-0 gap-8">
          <div>
            <TuneHeading>Color order</TuneHeading>
            <div className="mt-2 flex h-5 w-full overflow-hidden rounded-sm">
              {palette.map((color) => (
                <span
                  key={color}
                  className="h-full min-w-0 flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <TuneAction
                onClick={() =>
                  updateTuning("colorOffset", tuning.colorOffset - 1)
                }
              >
                Rotate left
              </TuneAction>
              <TuneAction
                active={tuning.reversed}
                color={highlightColor}
                onClick={() => updateTuning("reversed", !tuning.reversed)}
              >
                Reverse
              </TuneAction>
              <TuneAction
                onClick={() =>
                  updateTuning("colorOffset", tuning.colorOffset + 1)
                }
              >
                Rotate right
              </TuneAction>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-[minmax(9rem,0.75fr)_minmax(12rem,1fr)] sm:gap-10">
            <div className="flex flex-col items-start gap-4">
              <TuneOptions
                label="Gradient"
                options={GRADIENT_TYPES}
                value={tuning.type}
                onChange={(value) => updateTuning("type", value)}
                highlightColor={highlightColor}
              />
              <TuneOptions
                label="Blend"
                options={BLEND_MODES}
                value={tuning.blend}
                onChange={(value) => updateTuning("blend", value)}
                highlightColor={highlightColor}
              />
              <div>
                <TuneHeading>Modes</TuneHeading>
                <div className="mt-2 flex flex-wrap gap-4">
                  <TuneAction
                    active={tuning.vignette}
                    color={highlightColor}
                    onClick={() => updateTuning("vignette", !tuning.vignette)}
                  >
                    Vignette
                  </TuneAction>
                </div>
              </div>
              <div>
                <TuneHeading>Other actions</TuneHeading>
                <div className="mt-2 flex flex-wrap gap-4">
                  <TuneAction
                    onClick={() => setTuning(randomTuning(colors.length))}
                  >
                    Randomize
                  </TuneAction>
                  <TuneAction onClick={() => setTuning(DEFAULT_TUNING)}>
                    Reset
                  </TuneAction>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-5">
              <RangeTune
                label="Position X"
                value={tuning.positionX}
                onChange={(value) => updateTuning("positionX", value)}
                hue={hue}
                paper={paperColor}
                labelColor={labelColor}
                highlight={highlightColor}
              />
              <RangeTune
                label="Position Y"
                value={tuning.positionY}
                onChange={(value) => updateTuning("positionY", value)}
                hue={hue}
                paper={paperColor}
                labelColor={labelColor}
                highlight={highlightColor}
              />
              <RangeTune
                label="Rotation"
                value={tuning.rotation}
                max={360}
                suffix="°"
                onChange={(value) => updateTuning("rotation", value)}
                hue={hue}
                paper={paperColor}
                labelColor={labelColor}
                highlight={highlightColor}
              />
              <RangeTune
                label="Spread"
                value={tuning.spread}
                suffix="%"
                onChange={(value) => updateTuning("spread", value)}
                hue={hue}
                paper={paperColor}
                labelColor={labelColor}
                highlight={highlightColor}
              />
              <RangeTune
                label="Blur"
                value={tuning.blur}
                max={40}
                suffix="%"
                onChange={(value) => updateTuning("blur", value)}
                hue={hue}
                paper={paperColor}
                labelColor={labelColor}
                highlight={highlightColor}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end xl:sticky xl:top-8">
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            aria-label={`${feeling} gradient profile image preview`}
            className="block aspect-square w-full max-w-sm rounded-full border-2 border-white/80"
          />
          <button
            type="button"
            onClick={() => void downloadProfileImage()}
            disabled={exporting}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 font-display text-xl uppercase leading-none tracking-[0.08em] transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70 disabled:cursor-wait disabled:opacity-50"
            style={{ color: highlightColor }}
          >
            <DownloadIcon />
            {exporting ? "Preparing" : "Download it"}
          </button>
        </div>
      </div>
    </section>
  )
}

function TuneHeading({ children }: { children: string }) {
  return (
    <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] opacity-65">
      {children}
    </p>
  )
}

function TuneOptions<Option extends string>({
  label,
  options,
  value,
  onChange,
  highlightColor,
}: {
  label: string
  options: Array<{ id: Option; label: string }>
  value: Option
  onChange: (value: Option) => void
  highlightColor: string
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="font-mono text-sm font-semibold uppercase tracking-[0.16em] opacity-65">
        {label}
      </legend>
      <div className="mt-2 flex max-w-full flex-wrap gap-x-5 gap-y-3">
        {options.map((option) => {
          const active = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className="cursor-pointer font-display text-base font-bold uppercase leading-none tracking-[0.1em] transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70"
              style={{ color: active ? highlightColor : undefined }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function TuneAction({
  children,
  onClick,
  active = false,
  color,
}: {
  children: string
  onClick: () => void
  active?: boolean
  color?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      onClick={onClick}
      className="cursor-pointer font-display text-base font-bold uppercase leading-none tracking-[0.1em] transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70"
      style={{ color: active ? color : undefined }}
    >
      {children}
    </button>
  )
}

function RangeTune({
  label,
  value,
  onChange,
  hue,
  paper,
  labelColor,
  highlight,
  max = 100,
  suffix = "",
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hue: number
  paper: string
  labelColor: string
  highlight: string
  max?: number
  suffix?: string
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center justify-between gap-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] opacity-65">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </span>
      <ShapeRange
        value={value}
        onChange={onChange}
        hue={hue}
        paper={paper}
        labelColor={labelColor}
        highlight={highlight}
        ariaLabel={label}
        ariaValueText={`${value}${suffix}`}
        max={max}
        handleSize="compact"
        className="w-full"
      />
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}
