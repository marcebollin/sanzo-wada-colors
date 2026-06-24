import { AnimatePresence, motion } from "motion/react"
import {
  type FocusEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { cn } from "../lib/utils"

type InlinePreviewCardProps = {
  children: ReactNode
  preview: ReactNode
  className?: string
  triggerClassName?: string
  cardClassName?: string
  previewLabel?: string
}

const previewTransition = {
  type: "spring",
  stiffness: 360,
  damping: 22,
  mass: 0.65,
} as const

export function InlinePreviewCard({
  children,
  preview,
  className,
  triggerClassName,
  cardClassName,
  previewLabel,
}: InlinePreviewCardProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const lastPointerType = useRef<string | null>(null)

  function openForMouse(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse") setOpen(true)
  }

  function closeForMouse(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse") setOpen(false)
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("pointerdown", closeOnOutsidePress)
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <span ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={previewLabel}
        onPointerEnter={openForMouse}
        onPointerLeave={closeForMouse}
        onPointerDown={(event) => {
          lastPointerType.current = event.pointerType
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onClick={() => {
          if (lastPointerType.current !== "mouse") setOpen(true)
        }}
        className={cn(
          "cursor-help appearance-none bg-transparent p-0 [font:inherit] text-inherit underline decoration-current/35 decoration-dotted underline-offset-4 focus:outline-none focus-visible:decoration-current",
          triggerClassName,
        )}
      >
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 w-max -translate-x-1/2">
            <motion.span
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={previewTransition}
              style={{ originX: 0.5, originY: 1 }}
              className={cn(
                "block w-52 overflow-hidden rounded border border-current/20 bg-black/10 p-1 shadow-2xl backdrop-blur-sm sm:w-64",
                cardClassName,
              )}
            >
              {preview}
            </motion.span>
          </span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
