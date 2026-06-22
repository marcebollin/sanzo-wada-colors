import type { CSSProperties } from "react"

type Props = {
  children: string
  /** Color for the oversized first character. */
  capColor: string
  className?: string
  /** Extra styles for the wrapping title element. */
  style?: CSSProperties
  as?: "h1" | "h2" | "h3" | "div"
}

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

  return (
    <Tag
      className={`font-serif font-semibold leading-[0.95] tracking-tight ${className}`}
      style={style}
    >
      <span
        className="font-serif font-bold"
        style={{ color: capColor, fontSize: "1.5em" }}
      >
        {first}
      </span>
      {rest}
    </Tag>
  )
}
