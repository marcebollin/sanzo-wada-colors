import { motion } from "motion/react"
import { useMemo } from "react"
import { EMOTIONS, type Emotion, normalizeHue } from "../lib/feeling-match"

const SHAPE_RADIUS = 42.5
const SHAPE_POINTS = 96
const SHAPE_MORPH_WIDTH = 14

type ShapePoint = { x: number; y: number }

type Props = {
  hue: number
  /** Amount of emotional deformation, from a calm circle at 0 to full at 100. */
  amount: number
  fill: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function signedCircularDistance(value: number, boundary: number) {
  return ((value - boundary + 540) % 360) - 180
}

function emotionalPoint(
  name: Emotion["name"],
  angle: number,
  energy: number,
): ShapePoint {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const circle = { x: cosine * SHAPE_RADIUS, y: sine * SHAPE_RADIUS }
  let target = circle

  if (name === "Anger") {
    const spike = Math.max(0, Math.cos(angle * 8)) ** 6
    const radius = 37.5 + spike * 10.2
    target = { x: cosine * radius, y: sine * radius }
  } else if (name === "Fear") {
    const tremor =
      Math.sin(angle * 5 + 0.7) * 1.7 + Math.sin(angle * 9 - 0.4) * 0.8
    const radius = 41.5 + tremor
    target = {
      x: cosine * radius * 0.76 + sine * sine * 1.2,
      y: sine * radius * 1.08,
    }
  } else if (name === "Disgust") {
    const radius =
      41 +
      Math.sin(angle * 3 + 0.55) * 3.1 +
      Math.sin(angle * 5 - 1.1) * 1.9 +
      Math.cos(angle * 2 + 0.3) * 1.1
    target = {
      x: cosine * radius + 1.3,
      y: sine * radius - 0.8,
    }
  } else if (name === "Sadness") {
    const downwardPull = Math.max(0, sine) ** 5
    const radius = 39.5 + downwardPull * 7
    target = {
      x: cosine * radius * (1 - Math.max(0, sine) * 0.18),
      y: sine * radius + 1.5,
    }
  } else if (name === "Joy") {
    const petal = (1 + Math.cos(angle * 6)) / 2
    const radius = 40 + petal * 6
    target = { x: cosine * radius, y: sine * radius - 1 }
  }

  return {
    x: 50 + lerp(circle.x, target.x, energy),
    y: 50 + lerp(circle.y, target.y, energy),
  }
}

function shapeMixForHue(hue: number): {
  from: Emotion["name"]
  to: Emotion["name"]
  amount: number
} {
  const normalized = normalizeHue(hue)
  const index = EMOTIONS.findIndex(
    (item) => normalized >= item.start && normalized < item.end,
  )
  const currentIndex = Math.max(0, index)
  const current = EMOTIONS[currentIndex]
  const previous =
    EMOTIONS[(currentIndex - 1 + EMOTIONS.length) % EMOTIONS.length]
  const next = EMOTIONS[(currentIndex + 1) % EMOTIONS.length]
  const fromStart = signedCircularDistance(normalized, current.start)
  const fromEnd = signedCircularDistance(normalized, current.end)

  if (Math.abs(fromStart) <= SHAPE_MORPH_WIDTH) {
    return {
      from: previous.name,
      to: current.name,
      amount: smoothstep(
        (fromStart + SHAPE_MORPH_WIDTH) / (SHAPE_MORPH_WIDTH * 2),
      ),
    }
  }

  if (Math.abs(fromEnd) <= SHAPE_MORPH_WIDTH) {
    return {
      from: current.name,
      to: next.name,
      amount: smoothstep(
        (fromEnd + SHAPE_MORPH_WIDTH) / (SHAPE_MORPH_WIDTH * 2),
      ),
    }
  }

  return { from: current.name, to: current.name, amount: 0 }
}

export function feelingShapePath(hue: number, amount: number) {
  const mix = shapeMixForHue(hue)
  const energy = Math.min(100, Math.max(0, amount)) / 100
  const points = Array.from({ length: SHAPE_POINTS }, (_, index) => {
    const angle = (index / SHAPE_POINTS) * Math.PI * 2 - Math.PI / 2
    const from = emotionalPoint(mix.from, angle, energy)
    const to = emotionalPoint(mix.to, angle, energy)
    return {
      x: lerp(from.x, to.x, mix.amount),
      y: lerp(from.y, to.y, mix.amount),
    }
  })

  return `${points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ")} Z`
}

/** A reusable, animated contour shared by the feeling wheel and intensity controls. */
export function FeelingShapePath({
  hue,
  amount,
  fill,
  stroke = "none",
  strokeWidth = 0,
  opacity = 1,
}: Props) {
  const path = useMemo(() => feelingShapePath(hue, amount), [hue, amount])

  return (
    <motion.path
      initial={false}
      animate={{ d: path }}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}
