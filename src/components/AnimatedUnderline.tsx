import {
  type MotionValue,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react"
import { useRef } from "react"

/**
 * A draw-on-hover bottom border, modeled on the marcebollin-website link
 * underline: it wipes in left → right on hover/focus, and on leave either slides
 * out to the right (if it finished drawing) or retracts back to the left (if the
 * pointer left mid-draw). When `active` is true the border stays fully drawn —
 * used for the selected navigation route.
 */

type UnderlinePhase = "idle" | "drawing" | "complete"
type UnderlineControls = ReturnType<typeof useAnimationControls>

const drawEase = [0.22, 1, 0.36, 1] as const
const clearEase = [0.4, 0, 0.2, 1] as const

export function useAnimatedUnderline(active = false) {
  const controls = useAnimationControls()
  const reduce = useReducedMotion()
  const phaseRef = useRef<UnderlinePhase>("idle")
  const runRef = useRef(0)
  const hoveredRef = useRef(false)
  const activeRef = useRef(active)
  activeRef.current = active

  const dur = (d: number) => (reduce ? 0 : d)

  const start = () => {
    // The selected route keeps its border drawn — never animate it on hover.
    if (activeRef.current) return
    hoveredRef.current = true
    const run = ++runRef.current

    controls.stop()
    controls.set({ x: "0%", scaleX: 0 })
    phaseRef.current = "drawing"

    void controls
      .start({
        x: "0%",
        scaleX: 1,
        transition: { duration: dur(0.26), ease: drawEase },
      })
      .then(() => {
        if (runRef.current !== run || !hoveredRef.current) return
        phaseRef.current = "complete"
      })
  }

  const end = () => {
    if (activeRef.current) return
    hoveredRef.current = false
    controls.stop()

    if (phaseRef.current === "complete") {
      // Fully drawn: slide the whole bar off to the right, then snap back to 0.
      const run = ++runRef.current
      phaseRef.current = "idle"
      void controls
        .start({
          x: "100%",
          scaleX: 1,
          transition: { duration: dur(0.2), ease: clearEase },
        })
        .then(() => {
          if (runRef.current !== run) return
          controls.set({ x: "0%", scaleX: 0 })
        })
      return
    }

    // Interrupted mid-draw: retract back toward the left edge.
    phaseRef.current = "idle"
    void controls.start({
      x: "0%",
      scaleX: 0,
      transition: { duration: dur(0.16), ease: clearEase },
    })
  }

  const handlers = {
    onMouseEnter: start,
    onMouseLeave: end,
    onFocus: start,
    onBlur: end,
  }

  return {
    controls,
    handlers,
    initial: { x: "0%", scaleX: active ? 1 : 0 },
  }
}

type AnimatedUnderlineProps = {
  controls: UnderlineControls
  initial: { x: string; scaleX: number }
  /** Bar color — pass the same tone as the active text (the title drop cap). */
  color: string | MotionValue<string>
}

export function AnimatedUnderline({
  controls,
  initial,
  color,
}: AnimatedUnderlineProps) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] overflow-hidden"
    >
      <motion.span
        className="block h-[2px] w-full rounded-[1px]"
        style={{ backgroundColor: color, transformOrigin: "0% 50%" }}
        initial={initial}
        animate={controls}
      />
    </span>
  )
}
