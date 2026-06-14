import type { CSSProperties, ReactNode } from "react"

type Props = {
  children: string
  /** Color for the oversized first character. */
  capColor: string
  className?: string
  /** Extra styles for the wrapping heading. */
  style?: CSSProperties
  as?: "h1" | "h2" | "h3"
}

/**
 * A traditional serif title whose first character is dramatically enlarged
 * and tinted — "the color as the first character" from the brief.
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
      className={`font-serif font-semibold leading-[0.86] tracking-tight ${className}`}
      style={style}
    >
      <span
        className="float-left mr-[0.06em] font-serif font-bold leading-[0.7]"
        style={{
          color: capColor,
          fontSize: "1.72em",
          // optical alignment of the cap against the rest of the line
          marginTop: "-0.06em",
        }}
      >
        {first}
      </span>
      <span>{rest}</span>
    </Tag>
  )
}

export function Eyebrow({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <p
      className="mb-4 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.28em]"
      style={style}
    >
      {children}
    </p>
  )
}
