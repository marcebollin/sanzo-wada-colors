import { motion, type MotionStyle, type MotionValue } from "motion/react"

type Props = {
  children: string
  /**
   * Color for the oversized first character. May be a `MotionValue<string>`
   * (e.g. a spring-animated OKLCH value) so the cap cross-fades with the
   * active palette.
   */
  capColor: string | MotionValue<string>
  className?: string
  /** Extra styles for the wrapping (motion) title element. */
  style?: MotionStyle
  as?: "h1" | "h2" | "h3" | "div"
}

/** Motion component for each allowed wrapper tag. */
const MOTION_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  div: motion.div,
} as const

/**
 * A traditional serif title whose first character is enlarged and tinted —
 * "the color as the first character" from the brief. The big letter stays
 * inline and shares the baseline with the rest of the line, so it reads as
 * one continuous title rather than a floated drop cap.
 */
export function DropCapTitle({
  children,
  capColor,
  className = "",
  style,
  as: Tag = "h2",
}: Props) {
  const text = children.trim()
  const first = text.slice(0, 1)
  const rest = text.slice(1)
  const MotionTag = MOTION_TAGS[Tag]

  return (
    <MotionTag
      className={`font-serif font-semibold leading-[0.95] tracking-tight ${className}`}
      style={style}
    >
      <motion.span
        className="font-serif font-bold"
        style={{ color: capColor, fontSize: "1.5em" }}
      >
        {first}
      </motion.span>
      {rest}
    </MotionTag>
  )
}
