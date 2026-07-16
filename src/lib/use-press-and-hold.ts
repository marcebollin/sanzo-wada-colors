import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react"

type Options = {
  onPress: () => void
  disabled?: boolean
  delay?: number
  interval?: number
}

/**
 * Turns a button into a tap-or-hold control without changing its keyboard click
 * behavior. Pointer presses fire once immediately, then repeat after a delay.
 */
export function usePressAndHold({
  onPress,
  disabled = false,
  delay = 320,
  interval = 90,
}: Options) {
  const onPressRef = useRef(onPress)
  const disabledRef = useRef(disabled)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  onPressRef.current = onPress
  disabledRef.current = disabled

  const stop = useCallback(() => {
    if (delayRef.current != null) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const trigger = useCallback(() => {
    if (!disabledRef.current) onPressRef.current()
  }, [])

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || disabledRef.current) return
      stop()
      event.currentTarget.setPointerCapture(event.pointerId)
      trigger()
      delayRef.current = setTimeout(() => {
        intervalRef.current = setInterval(trigger, interval)
      }, delay)
    },
    [delay, interval, stop, trigger],
  )

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      // Pointer clicks already fire on pointerdown. Synthetic and keyboard
      // clicks have detail 0 and still need their single activation here.
      if (event.detail === 0) trigger()
    },
    [trigger],
  )

  useEffect(() => stop, [stop])
  useEffect(() => {
    if (disabled) stop()
  }, [disabled, stop])

  return {
    onClick,
    onLostPointerCapture: stop,
    onPointerCancel: stop,
    onPointerDown,
    onPointerLeave: stop,
    onPointerUp: stop,
  }
}
