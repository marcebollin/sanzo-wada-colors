import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
  /** The text written to the clipboard. */
  value: string
  /** Accessible label, e.g. "Copy Ocher Red as OKLCH". */
  label: string
  className?: string
  /** Foreground color for the icon/label. */
  color?: string
  children?: React.ReactNode
}

/** A compact copy-to-clipboard control with a transient "copied" state. */
export function CopyButton({ value, label, className, color, children }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for environments without the async clipboard API.
      const ta = document.createElement("textarea")
      ta.value = value
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1300)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest transition-opacity hover:opacity-70 focus:outline-none focus-visible:opacity-70",
        className,
      )}
      style={{ color }}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {children != null && <span>{copied ? "Copied" : children}</span>}
    </button>
  )
}

function ClipboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
