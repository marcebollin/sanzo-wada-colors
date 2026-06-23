import { Link, useRouterState } from "@tanstack/react-router"
import { type MotionValue, motion } from "motion/react"
import { useState } from "react"
import { AnimatedUnderline, useAnimatedUnderline } from "./AnimatedUnderline"

export const HOME_NAV_LABEL = "HOME"
export const ABOUT_NAV_LABEL = "ABOUT"
export const NAV_HOME_VT_NAME = "nav-home"
export const NAV_ABOUT_VT_NAME = "nav-about"

/** Shared typography so nav links match the COPY COMBINATION trigger. */
const NAV_LINK_TYPO =
  "font-display text-[clamp(0.95rem,2.1vw,1.55rem)] uppercase leading-none tracking-[0.08em]"

type Props = {
  to: "/" | "/about"
  label: string
  /** Solid resting color (matches the surrounding hero foreground). */
  color: string | MotionValue<string>
  /**
   * Color for the hover / active state — the same tone as the title drop cap
   * (the "O" of "of Color Combinations").
   */
  activeColor: string | MotionValue<string>
  /** `view-transition-name` so the link morphs across routes. */
  viewTransitionName?: string
  /**
   * Two-color palettes draw the animated underline on hover/active; palettes
   * with more colors rely on the color swap alone.
   */
  animatedUnderline?: boolean
}

/**
 * A navigation link using the same type treatment as COPY COMBINATION. The label
 * is a single full-opacity span whose color swaps from the hero foreground to the
 * drop-cap color on hover, and stays there while the route is active — no opacity
 * cross-fade, so nothing brightens through the colored field behind it.
 *
 * For two-color palettes an animated underline draws in left → right on top of
 * the color swap; richer palettes use the color swap on its own.
 */
export function NavLink({
  to,
  label,
  color,
  activeColor,
  viewTransitionName,
  animatedUnderline = false,
}: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = pathname === to
  const underline = useAnimatedUnderline(isActive)
  const [interacting, setInteracting] = useState(false)
  const showActive = interacting || isActive

  const enter = () => {
    setInteracting(true)
    if (animatedUnderline) underline.handlers.onMouseEnter()
  }
  const leave = () => {
    setInteracting(false)
    if (animatedUnderline) underline.handlers.onMouseLeave()
  }

  return (
    <Link
      to={to}
      viewTransition
      activeOptions={{ exact: true }}
      className="relative inline-flex cursor-pointer items-baseline focus:outline-none"
      style={{ viewTransitionName }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <motion.span
        className={NAV_LINK_TYPO}
        style={{ color: showActive ? activeColor : color }}
      >
        {label}
      </motion.span>
      {animatedUnderline && (
        <AnimatedUnderline
          controls={underline.controls}
          initial={underline.initial}
          color={activeColor}
        />
      )}
    </Link>
  )
}
