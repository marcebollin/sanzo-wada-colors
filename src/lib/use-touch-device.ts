import { useEffect, useState } from "react"

function hasTouchPoints() {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0
}

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(hasTouchPoints)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      setIsTouchDevice(event.pointerType === "touch")
    }

    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    })

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      })
    }
  }, [])

  return isTouchDevice
}
