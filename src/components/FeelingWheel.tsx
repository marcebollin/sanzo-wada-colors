import { type MotionValue, motion } from "motion/react"
import { type KeyboardEvent, type PointerEvent, useId, useRef } from "react"
import {
  EMOTIONS,
  emotionForHue,
  FEELING_LIGHTNESS_MAX,
  FEELING_LIGHTNESS_MIN,
  type FeelingTarget,
  normalizeHue,
} from "../lib/feeling-match"
import { FeelingIntensityControl } from "./FeelingIntensityControl"
import { FeelingShapePath } from "./FeelingShapePath"

type Props = {
  target: FeelingTarget
  onChange: (target: FeelingTarget) => void
  ink: string
  paper: string
  labelColor: string
  highlight: string
  backgroundColor: string | MotionValue<string>
}

const EMOTION_LABEL_RADIUS = 55.25
const WHEEL_ROTATION = 180

function polarPoint(hue: number, radius: number) {
  const radians = ((hue - 90) * Math.PI) / 180
  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  }
}

function wheelPoint(hue: number, radius: number) {
  return polarPoint(hue + WHEEL_ROTATION, radius)
}

function arcPath(start: number, end: number) {
  const from = wheelPoint(start + 1.5, 48.2)
  const to = wheelPoint(end - 1.5, 48.2)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${from.x} ${from.y} A 48.2 48.2 0 ${largeArc} 1 ${to.x} ${to.y}`
}

function labelArcPath(start: number, end: number) {
  const inset = 4
  const midpoint = (start + end) / 2
  const visualMidpoint = normalizeHue(midpoint + WHEEL_ROTATION)
  const reverse = visualMidpoint > 90 && visualMidpoint < 270
  const fromHue = reverse ? end - inset : start + inset
  const toHue = reverse ? start + inset : end - inset
  const from = wheelPoint(fromHue, EMOTION_LABEL_RADIUS)
  const to = wheelPoint(toHue, EMOTION_LABEL_RADIUS)

  return `M ${from.x} ${from.y} A ${EMOTION_LABEL_RADIUS} ${EMOTION_LABEL_RADIUS} 0 0 ${reverse ? 0 : 1} ${to.x} ${to.y}`
}

export function FeelingWheel({
  target,
  onChange,
  ink,
  paper,
  labelColor,
  highlight,
  backgroundColor,
}: Props) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const emotion = emotionForHue(target.hue)

  const radius =
    (FEELING_LIGHTNESS_MAX - target.lightness) /
    (FEELING_LIGHTNESS_MAX - FEELING_LIGHTNESS_MIN)
  const handle = wheelPoint(target.hue, Math.max(2, radius * 47))

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const wheel = wheelRef.current
    if (!wheel) return
    const rect = wheel.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const wheelRadius = rect.width / 2
    const distance = Math.min(Math.hypot(dx, dy), wheelRadius)
    const visualHue =
      distance < 4
        ? target.hue
        : normalizeHue((Math.atan2(dy, dx) * 180) / Math.PI + 90)
    const hue =
      distance < 4 ? target.hue : normalizeHue(visualHue - WHEEL_ROTATION)
    const lightness =
      FEELING_LIGHTNESS_MAX -
      (distance / wheelRadius) * (FEELING_LIGHTNESS_MAX - FEELING_LIGHTNESS_MIN)

    onChange({ ...target, hue, lightness })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = target
    const hueStep = event.shiftKey ? 10 : 2
    const lightnessStep = event.shiftKey ? 0.05 : 0.015

    if (event.key === "ArrowLeft") {
      next = { ...target, hue: normalizeHue(target.hue - hueStep) }
    } else if (event.key === "ArrowRight") {
      next = { ...target, hue: normalizeHue(target.hue + hueStep) }
    } else if (event.key === "ArrowUp") {
      next = {
        ...target,
        lightness: Math.min(
          FEELING_LIGHTNESS_MAX,
          target.lightness + lightnessStep,
        ),
      }
    } else if (event.key === "ArrowDown") {
      next = {
        ...target,
        lightness: Math.max(
          FEELING_LIGHTNESS_MIN,
          target.lightness - lightnessStep,
        ),
      }
    } else {
      return
    }

    event.preventDefault()
    onChange(next)
  }

  return (
    <div className="mx-auto w-full max-w-[52rem] md:mx-0">
      <div className="w-full max-w-[38rem] px-14 pb-10 pt-16 sm:px-20 md:max-w-[28rem] md:px-0">
        <div className="relative aspect-square">
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible"
          >
            <defs>
              {EMOTIONS.map((item) => (
                <path
                  key={item.name}
                  id={`${labelId}-${item.name.toLowerCase()}`}
                  d={labelArcPath(item.start, item.end)}
                />
              ))}
            </defs>
            {EMOTIONS.map((item) => {
              const active = item.name === emotion.name

              return (
                <text
                  key={item.name}
                  className="select-none font-serif uppercase"
                  dominantBaseline="central"
                  fill="currentColor"
                  fontSize={5.15}
                  fontWeight={700}
                  letterSpacing={0.38}
                  paintOrder="stroke fill"
                  stroke="currentColor"
                  strokeWidth={0.18}
                  style={{
                    color: active
                      ? highlight
                      : `color-mix(in oklch, ${labelColor} 58%, oklch(0 0 0 / 0))`,
                  }}
                >
                  <textPath
                    href={`#${labelId}-${item.name.toLowerCase()}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {item.name}
                  </textPath>
                </text>
              )
            })}
          </svg>

          {EMOTIONS.map((item) => {
            const midpoint = (item.start + item.end) / 2
            const label = wheelPoint(midpoint, EMOTION_LABEL_RADIUS)
            const active = item.name === emotion.name

            return (
              <button
                key={item.name}
                type="button"
                aria-label={`Choose ${item.name}`}
                aria-pressed={active}
                className="absolute z-30 h-14 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  left: `${label.x}%`,
                  top: `${label.y}%`,
                  outlineColor: highlight,
                }}
                onClick={() =>
                  onChange({
                    ...target,
                    hue: midpoint,
                    lightness: item.lightness,
                  })
                }
              />
            )
          })}

          <div
            ref={wheelRef}
            role="slider"
            tabIndex={0}
            aria-label="Feeling hue and lightness"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(target.hue)}
            aria-valuetext={`${emotion.name}, hue ${Math.round(target.hue)} degrees, lightness ${Math.round(target.lightness * 100)} percent`}
            className="absolute inset-0 cursor-crosshair overflow-visible rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8"
            style={{
              outlineColor: ink,
              touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateFromPointer(event)
              }
            }}
            onKeyDown={onKeyDown}
          >
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r="48.2"
                fill={highlight}
                fillOpacity={0.18}
                stroke={labelColor}
                strokeOpacity={0.28}
                strokeWidth={0.45}
              />
              <FeelingShapePath
                hue={target.hue}
                amount={target.intensity}
                fill={highlight}
              />
              {EMOTIONS.map((item) => (
                <path
                  key={item.name}
                  d={arcPath(item.start, item.end)}
                  stroke={paper}
                  strokeLinecap="round"
                  strokeWidth={item.name === emotion.name ? 1.4 : 0.55}
                  opacity={item.name === emotion.name ? 1 : 0.5}
                />
              ))}
            </svg>

            <motion.span
              className="pointer-events-none absolute z-10 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] sm:size-10"
              style={{
                left: `${handle.x}%`,
                top: `${handle.y}%`,
                backgroundColor,
                borderColor: paper,
                boxShadow: `0 0 0 1px ${ink}, 0 5px 20px oklch(0.12 0.01 0 / 0.3)`,
              }}
            />
          </div>
        </div>
      </div>

      <FeelingIntensityControl
        hue={target.hue}
        intensity={target.intensity}
        onChange={(intensity) => onChange({ ...target, intensity })}
        paper={paper}
        labelColor={labelColor}
        highlight={highlight}
      />
    </div>
  )
}
