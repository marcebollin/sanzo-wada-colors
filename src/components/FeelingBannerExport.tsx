import { formatHex } from "culori"
import { useMemo, useState } from "react"
import { shuffledBalancedColors } from "../lib/feeling-grid"
import { feelingShapePath } from "./FeelingShapePath"

const BANNER_ROWS = 8

const BANNER_FORMATS = [
  { id: "twitter", label: "Twitter", width: 1500, height: 500 },
  { id: "linkedin", label: "LinkedIn", width: 1584, height: 396 },
  { id: "bluesky", label: "Bluesky", width: 1500, height: 500 },
] as const

type BannerFormatId = (typeof BANNER_FORMATS)[number]["id"]
type BannerFormat = (typeof BANNER_FORMATS)[number]

type Props = {
  feeling: string
  hue: number
  intensity: number
  colors: string[]
  paletteId: number
  backgroundColor: string
  highlightColor: string
}

type BannerCell = {
  color: string
  x: number
  y: number
  size: number
}

function bannerCells(
  format: BannerFormat,
  colors: string[],
  paletteId: number,
): BannerCell[] {
  const columns = Math.round((format.width / format.height) * BANNER_ROWS)
  const inset = format.height * 0.06
  const cellWidth = (format.width - inset * 2) / columns
  const cellHeight = (format.height - inset * 2) / BANNER_ROWS
  const size = Math.min(cellWidth, cellHeight) * 0.92
  const fills = shuffledBalancedColors(columns * BANNER_ROWS, colors, paletteId)

  return fills.map((color, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return {
      color,
      x: inset + column * cellWidth + (cellWidth - size) / 2,
      y: inset + row * cellHeight + (cellHeight - size) / 2,
      size,
    }
  })
}

function canvasColor(css: string) {
  return formatHex(css) ?? css
}

function fileSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function FeelingBannerExport({
  feeling,
  hue,
  intensity,
  colors,
  paletteId,
  backgroundColor,
  highlightColor,
}: Props) {
  const [formatId, setFormatId] = useState<BannerFormatId>("twitter")
  const [exporting, setExporting] = useState(false)
  const format =
    BANNER_FORMATS.find((candidate) => candidate.id === formatId) ??
    BANNER_FORMATS[0]
  const path = useMemo(() => feelingShapePath(hue, intensity), [hue, intensity])
  const cells = useMemo(
    () => bannerCells(format, colors, paletteId),
    [colors, format, paletteId],
  )

  async function downloadBanner() {
    setExporting(true)

    try {
      const canvas = document.createElement("canvas")
      canvas.width = format.width
      canvas.height = format.height
      const context = canvas.getContext("2d")
      if (!context) return

      context.fillStyle = canvasColor(backgroundColor)
      context.fillRect(0, 0, format.width, format.height)

      const shape = new Path2D(path)
      for (const cell of cells) {
        context.save()
        context.translate(cell.x, cell.y)
        context.scale(cell.size / 100, cell.size / 100)
        context.fillStyle = canvasColor(cell.color)
        context.fill(shape)
        context.restore()
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.94)
      })
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${fileSlug(feeling)}-palette-${paletteId}-${format.id}-banner.jpg`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section aria-labelledby="banner-feeling-title">
      <h2
        id="banner-feeling-title"
        className="text-right font-display text-4xl font-bold sm:text-5xl"
      >
        Banner your feeling
      </h2>

      <svg
        viewBox={`0 0 ${format.width} ${format.height}`}
        role="img"
        aria-label={`${feeling} banner preview for ${format.label}`}
        className="mt-5 block w-full overflow-hidden rounded-sm"
      >
        <rect
          width={format.width}
          height={format.height}
          fill={backgroundColor}
        />
        {cells.map((cell) => (
          <path
            key={`${cell.x}-${cell.y}`}
            d={path}
            fill={cell.color}
            transform={`translate(${cell.x} ${cell.y}) scale(${cell.size / 100})`}
          />
        ))}
      </svg>

      <div className="mt-5 flex flex-wrap items-end justify-end gap-5 lg:justify-between">
        <fieldset
          aria-label="Social banner"
          className="m-0 flex flex-wrap justify-end gap-x-5 gap-y-3 border-0 p-0 lg:justify-start"
        >
          {BANNER_FORMATS.map((candidate) => {
            const selected = candidate.id === format.id
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFormatId(candidate.id)}
                className="cursor-pointer font-display text-base font-bold uppercase leading-none tracking-[0.1em] transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70"
                style={{ color: selected ? highlightColor : undefined }}
              >
                {candidate.label}
              </button>
            )
          })}
        </fieldset>

        <div className="ml-auto text-right">
          <button
            type="button"
            onClick={() => void downloadBanner()}
            disabled={exporting}
            className="inline-flex cursor-pointer items-center gap-2 font-display text-xl uppercase leading-none tracking-[0.08em] transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70 disabled:cursor-wait disabled:opacity-50"
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
