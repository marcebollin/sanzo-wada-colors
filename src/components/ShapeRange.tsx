import { type KeyboardEvent, type PointerEvent, useRef } from "react"
import { FeelingShapePath } from "./FeelingShapePath"

type Props = {
  value: number
  onChange: (value: number) => void
  hue: number
  paper: string
  labelColor: string
  highlight: string
  ariaLabel: string
  ariaValueText?: string
  min?: number
  max?: number
  step?: number
  handleSize?: "default" | "compact"
  className?: string
}

function clampAndSnap(value: number, min: number, max: number, step: number) {
  const snapped = min + Math.round((value - min) / step) * step
  return Math.min(max, Math.max(min, snapped))
}

export function ShapeRange({
  value,
  onChange,
  hue,
  paper,
  labelColor,
  highlight,
  ariaLabel,
  ariaValueText,
  min = 0,
  max = 100,
  step = 1,
  handleSize = "default",
  className = "",
}: Props) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const range = Math.max(step, max - min)
  const percentage = ((value - min) / range) * 100
  const position = Math.min(100, Math.max(0, percentage))
  const handleSizeClassName =
    handleSize === "compact" ? "size-4" : "size-8 sm:size-10"
  const sliderHeightClassName = handleSize === "compact" ? "h-7" : "h-12"

  const commit = (next: number) => {
    onChange(clampAndSnap(next, min, max, step))
  }

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const slider = sliderRef.current
    if (!slider) return

    const rect = slider.getBoundingClientRect()
    const pointerPosition = (event.clientX - rect.left) / rect.width
    commit(min + pointerPosition * (max - min))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keyboardStep = event.shiftKey ? step * 5 : step
    let next = value

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      next += keyboardStep
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      next -= keyboardStep
    } else if (event.key === "PageUp") {
      next += step * 10
    } else if (event.key === "PageDown") {
      next -= step * 10
    } else if (event.key === "Home") {
      next = min
    } else if (event.key === "End") {
      next = max
    } else {
      return
    }

    event.preventDefault()
    commit(next)
  }

  return (
    <div className={`relative ${sliderHeightClassName} ${className}`}>
      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={ariaValueText}
        className={`absolute inset-x-6 top-1/2 -translate-y-1/2 cursor-ew-resize touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${sliderHeightClassName}`}
        style={{ outlineColor: highlight }}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event)
          }
        }}
        onKeyDown={onKeyDown}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-35"
          style={{ backgroundColor: labelColor }}
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2"
          style={{ width: `${position}%`, backgroundColor: highlight }}
        />
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible ${handleSizeClassName}`}
          style={{
            left: `${position}%`,
            filter: "drop-shadow(0 5px 10px oklch(0.12 0.01 0 / 0.24))",
          }}
        >
          <FeelingShapePath
            hue={hue}
            amount={position}
            fill={highlight}
            stroke={paper}
            strokeWidth={3}
          />
        </svg>
      </div>
    </div>
  )
}
