import { useEffect, useState } from "react"
import { legacyOklch, type SanzoColor } from "../data"

export type DisplayGamut = "srgb" | "p3"
export type ColorConversionMode = "adapted" | "legacy"

const P3_QUERY = "(color-gamut: p3)"

function detectedGamut(): DisplayGamut {
  if (typeof window === "undefined" || !window.matchMedia) return "srgb"
  return window.matchMedia(P3_QUERY).matches ? "p3" : "srgb"
}

/** Track the widest color gamut the current browser/display can render. */
export function useDisplayGamut(): DisplayGamut {
  const [gamut, setGamut] = useState<DisplayGamut>(detectedGamut)

  useEffect(() => {
    const query = window.matchMedia(P3_QUERY)
    const update = () => setGamut(query.matches ? "p3" : "srgb")
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return gamut
}

/** Select the authored screen value without changing portable/copy data. */
export function displayColor(
  color: Pick<SanzoColor, "id" | "oklch" | "oklchP3">,
  gamut: DisplayGamut,
  conversionMode: ColorConversionMode = "adapted",
): string {
  if (conversionMode === "legacy") return legacyOklch(color)
  return gamut === "p3" ? color.oklchP3 : color.oklch
}

/** Resolve the selected conversion to its portable authored value. */
export function portableColor(
  color: Pick<SanzoColor, "id" | "oklch">,
  conversionMode: ColorConversionMode = "adapted",
): string {
  return conversionMode === "legacy" ? legacyOklch(color) : color.oklch
}
