import { useEffect, useRef } from "react"
import {
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react"
import { oklch as toOklch, formatCss } from "culori"

/**
 * Spring a color from one palette to the next, directly in OKLCH space.
 *
 * OKLCH interpolates perceptually, so easing L / C / H channels with a spring
 * reads as a real "color pouring into another color" — lightness and chroma
 * settle at the same pace, and hue takes the short way around the circle.
 *
 * The motion values are bound to a motion element's `style` (e.g.
 * `style={{ backgroundColor: mv }}`), so motion keeps the DOM in sync at
 * 60fps without any React re-render.
 */

/** Tunable spring for palette swaps. Slow-ish so the blend is readable. */
export type OklchSpring = { stiffness?: number; damping?: number; mass?: number }

export const PALETTE_SPRING: Required<OklchSpring> = {
  stiffness: 70,
  damping: 16,
  mass: 1,
}

type Channels = { l: number; c: number; h: number }

function parse(css: string): Channels {
  const o = toOklch(css)
  if (!o) return { l: 0.5, c: 0, h: 0 }
  return { l: o.l ?? 0.5, c: o.c ?? 0, h: o.h ?? 0 }
}

/** Pick the representation of `target` nearest to `current` on the hue circle. */
function shortestHue(target: number, current: number): number {
  let t = target
  while (t - current > 180) t -= 360
  while (current - t > 180) t += 360
  return t
}

function toCss(l: number, c: number, h: number): string {
  const hh = ((h % 360) + 360) % 360
  return formatCss({ mode: "oklch", l, c, h: hh })
}

/** Shared `useTransform` chain for an (l, c, h) triple -> an oklch() string. */
function useOklchString(
  l: MotionValue<number>,
  c: MotionValue<number>,
  h: MotionValue<number>,
): MotionValue<string> {
  return useTransform([l, c, h], ([L, C, H]) =>
    toCss(L as number, C as number, H as number),
  )
}

/**
 * Spring-animate a single OKLCH color from its previous value toward `target`.
 *
 * On the first mount the motion values are already at `target`, so nothing
 * animates; every later change springs from the previous color to the new one.
 */
export function useAnimatedOklch(
  target: string,
  spring: OklchSpring = PALETTE_SPRING,
): MotionValue<string> {
  const l = useMotionValue(parse(target).l)
  const c = useMotionValue(parse(target).c)
  const h = useMotionValue(parse(target).h)
  const css = useOklchString(l, c, h)

  const mounted = useRef(false)
  useEffect(() => {
    const t = parse(target)
    if (!mounted.current) {
      l.set(t.l)
      c.set(t.c)
      h.set(shortestHue(t.h, h.get()))
      mounted.current = true
      return
    }
    const controls = [
      animate(l, t.l, spring),
      animate(c, t.c, spring),
      animate(h, shortestHue(t.h, h.get()), spring),
    ]
    return () => controls.forEach((ct) => ct.stop())
    // We only re-run when the target color string changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return css
}

/** The dictionary tops out at four colors per palette. */
const MAX_PALETTE = 4

/**
 * Spring-animate up to `MAX_PALETTE` OKLCH colors position-by-position.
 *
 * Each slot springs from the previous palette's color at that slot to the new
 * one; newly appearing slots (the palette grew) snap to their value rather than
 * fading in from grey, so a length change reads as a size change — not a fade.
 */
export function useAnimatedOklchArray(
  targets: string[],
  spring: OklchSpring = PALETTE_SPRING,
): MotionValue<string>[] {
  if (targets.length > MAX_PALETTE) {
    throw new Error(
      `useAnimatedOklchArray: palettes cannot exceed ${MAX_PALETTE} colors`,
    )
  }

  // Allocate MAX_PALETTE persistent channels up front so the hooks run a
  // stable number of times per render, regardless of how long `targets` is.
  const l = [
    useMotionValue(0.5),
    useMotionValue(0.5),
    useMotionValue(0.5),
    useMotionValue(0.5),
  ]
  const c = [
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
  ]
  const h = [
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
    useMotionValue(0),
  ]
  const css = l.map((lv, i) => useOklchString(lv, c[i], h[i]))

  // Per-slot "have we seen this slot before" flag. A slot that was empty last
  // palette (palette grew) snaps to its value once, then animates thereafter.
  const initialized = useRef<boolean[]>(Array(MAX_PALETTE).fill(false))

  const key = targets.join("|")
  useEffect(() => {
    const controls: ReturnType<typeof animate>[] = []
    targets.forEach((tgt, i) => {
      const t = parse(tgt)
      if (!initialized.current[i]) {
        l[i].set(t.l)
        c[i].set(t.c)
        h[i].set(shortestHue(t.h, h[i].get()))
        initialized.current[i] = true
        return
      }
      controls.push(animate(l[i], t.l, spring))
      controls.push(animate(c[i], t.c, spring))
      controls.push(animate(h[i], shortestHue(t.h, h[i].get()), spring))
    })
    return () => controls.forEach((ct) => ct.stop())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return css.slice(0, targets.length)
}