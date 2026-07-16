import { createRoute, Link } from "@tanstack/react-router"
import { ArrowUpRight } from "lucide-react"
import { motion, useAnimationControls } from "motion/react"
import { useRef } from "react"
import { useHeroField } from "../components/use-hero-field"
import { rootRoute } from "./root"

type FillPhase = "idle" | "drawing" | "complete"

const drawEase = [0.22, 1, 0.36, 1] as const
const clearEase = [0.4, 0, 0.2, 1] as const

export const explorationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explorations",
  component: ExplorationsPage,
})

function ExplorationsPage() {
  const { heroBg, onHero, heroCap } = useHeroField()
  const fillControls = useAnimationControls()
  const phaseRef = useRef<FillPhase>("idle")
  const runRef = useRef(0)
  const hoveredRef = useRef(false)

  const startFill = () => {
    // A pointer click focuses the link after mouseenter. Do not restart the
    // already-running fill from 0 when that second interaction event fires.
    if (hoveredRef.current) {
      return
    }

    hoveredRef.current = true
    const run = ++runRef.current

    fillControls.stop()
    fillControls.set({ x: "0%", scaleX: 0 })
    phaseRef.current = "drawing"

    void fillControls
      .start({
        x: "0%",
        scaleX: 1,
        transition: { duration: 0.26, ease: drawEase },
      })
      .then(() => {
        if (runRef.current !== run || !hoveredRef.current) {
          return
        }

        phaseRef.current = "complete"
      })
  }

  const resetFill = () => {
    phaseRef.current = "idle"
    void fillControls.start({
      x: "0%",
      scaleX: 0,
      transition: { duration: 0.16, ease: clearEase },
    })
  }

  const clearFillForward = () => {
    const run = ++runRef.current
    phaseRef.current = "idle"

    void fillControls
      .start({
        x: "100%",
        scaleX: 1,
        transition: { duration: 0.2, ease: clearEase },
      })
      .then(() => {
        if (runRef.current !== run) {
          return
        }

        fillControls.set({ x: "0%", scaleX: 0 })
      })
  }

  const endFill = () => {
    hoveredRef.current = false
    fillControls.stop()

    if (phaseRef.current === "complete") {
      clearFillForward()
      return
    }

    resetFill()
  }

  return (
    <motion.main
      className="min-h-[calc(100dvh-8rem)] overflow-hidden pb-40 sm:min-h-[calc(100dvh-11rem)]"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="pt-4 sm:pt-6">
          <Link
            to="/feeling"
            viewTransition
            onMouseEnter={startFill}
            onMouseLeave={endFill}
            onFocus={startFill}
            onBlur={endFill}
            className="relative flex items-center justify-between gap-8 overflow-hidden border-y py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 sm:py-8"
            style={{
              borderColor: "var(--p-on-hero)",
              outlineColor: "var(--p-hero-cap)",
            }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ x: "0%", scaleX: 0 }}
              animate={fillControls}
              style={{ backgroundColor: heroCap, transformOrigin: "0% 50%" }}
            />
            <span className="relative translate-x-2 font-serif text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-[1] tracking-tight">
              Feeling
            </span>
            <ArrowUpRight
              className="relative size-8 -translate-x-2 shrink-0 sm:size-12"
              strokeWidth={1.25}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </motion.main>
  )
}
