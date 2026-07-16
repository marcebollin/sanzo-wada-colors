import { Link, useRouterState } from "@tanstack/react-router"
import { type MotionValue, motion } from "motion/react"
import { useState } from "react"

export const HOME_NAV_LABEL = "HOME"
export const ABOUT_NAV_LABEL = "ABOUT"
export const EXPLORATIONS_NAV_LABEL = "EXPLORATIONS"
export const NAV_HOME_VT_NAME = "nav-home"
export const NAV_ABOUT_VT_NAME = "nav-about"
export const NAV_EXPLORATIONS_VT_NAME = "nav-explorations"

/** Shared typography so nav links match the COPY COMBINATION trigger. */
const NAV_LINK_TYPO =
  "font-display text-[clamp(0.95rem,2.1vw,1.5rem)] uppercase leading-none tracking-[0.08em]"

type Props = {
  to: "/" | "/about" | "/explorations"
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
}

/**
 * A navigation link using the same type treatment as COPY COMBINATION. The label
 * is a single full-opacity span whose color swaps from the hero foreground to the
 * drop-cap color on hover, and stays there while the route is active — no opacity
 * cross-fade, so nothing brightens through the colored field behind it.
 */
export function NavLink({
  to,
  label,
  color,
  activeColor,
  viewTransitionName,
}: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = pathname === to
  const [interacting, setInteracting] = useState(false)
  const showActive = interacting || isActive

  return (
    <Link
      to={to}
      viewTransition
      activeOptions={{ exact: true }}
      className="relative inline-flex cursor-pointer items-baseline focus:outline-none"
      style={{ viewTransitionName }}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
    >
      <motion.span
        className={NAV_LINK_TYPO}
        style={{ color: showActive ? activeColor : color }}
      >
        {label}
      </motion.span>
    </Link>
  )
}
