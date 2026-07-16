import { useEffect, useRef } from "react"

const EDGE_GAP = 10
const FALLBACK_SPEED = 84

function randomInwardVelocity() {
  // Start in the top-right corner and choose a varied down-left diagonal.
  const angle = Math.PI * (0.62 + Math.random() * 0.2)
  return {
    x: Math.cos(angle) * FALLBACK_SPEED,
    y: Math.sin(angle) * FALLBACK_SPEED,
  }
}

export function useBouncingHeroDot(onBounce?: () => void) {
  const fieldRef = useRef<HTMLElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const onBounceRef = useRef(onBounce)

  useEffect(() => {
    onBounceRef.current = onBounce
  }, [onBounce])

  useEffect(() => {
    const field = fieldRef.current
    const dot = dotRef.current
    if (!field || !dot) return

    const marquee = document.querySelector<HTMLElement>("[data-color-marquee]")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const velocity = randomInwardVelocity()
    let x = 0
    let y = 0
    let minX = 0
    let maxX = 0
    let minY = 0
    let maxY = 0
    let initialized = false
    let frame = 0
    let previousTime = 0
    let running = false

    const render = () => {
      field.style.setProperty("--hero-dot-center-x", `${x}px`)
      field.style.setProperty("--hero-dot-center-y", `${y}px`)
    }

    const measure = () => {
      if (marquee) {
        const duration = Number.parseFloat(
          getComputedStyle(marquee).animationDuration,
        )
        const speed = marquee.scrollWidth / 2 / duration
        const currentSpeed = Math.hypot(velocity.x, velocity.y)

        if (Number.isFinite(speed) && speed > 0 && currentSpeed > 0) {
          velocity.x = (velocity.x / currentSpeed) * speed
          velocity.y = (velocity.y / currentSpeed) * speed
        }
      }

      const radius = dot.offsetWidth / 2
      minX = radius + EDGE_GAP
      maxX = Math.max(minX, field.clientWidth - radius - EDGE_GAP)
      minY = radius + EDGE_GAP
      maxY = Math.max(minY, field.clientHeight - radius - EDGE_GAP)

      if (!initialized) {
        x = maxX
        y = minY
        initialized = true
      } else {
        x = Math.min(maxX, Math.max(minX, x))
        y = Math.min(maxY, Math.max(minY, y))
      }

      render()
    }

    const tick = (time: number) => {
      if (!running) return

      const elapsed = Math.min((time - previousTime) / 1000, 0.05)
      previousTime = time
      x += velocity.x * elapsed
      y += velocity.y * elapsed
      let bounced = false

      if (x <= minX) {
        x = minX
        velocity.x = Math.abs(velocity.x)
        bounced = true
      } else if (x >= maxX) {
        x = maxX
        velocity.x = -Math.abs(velocity.x)
        bounced = true
      }

      if (y <= minY) {
        y = minY
        velocity.y = Math.abs(velocity.y)
        bounced = true
      } else if (y >= maxY) {
        y = maxY
        velocity.y = -Math.abs(velocity.y)
        bounced = true
      }

      if (bounced) onBounceRef.current?.()
      render()
      frame = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const start = () => {
      stop()
      if (reducedMotion.matches) return
      running = true
      previousTime = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        stop()
        x = maxX
        y = minY
        render()
        return
      }

      start()
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(field)
    resizeObserver.observe(dot)
    if (marquee) resizeObserver.observe(marquee)
    reducedMotion.addEventListener("change", handleMotionPreference)
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      reducedMotion.removeEventListener("change", handleMotionPreference)
      field.style.removeProperty("--hero-dot-center-x")
      field.style.removeProperty("--hero-dot-center-y")
    }
  }, [])

  return { fieldRef, dotRef }
}
