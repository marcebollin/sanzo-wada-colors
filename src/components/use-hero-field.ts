import { useMotionValue, useTransform } from "motion/react"
import { useCallback, useEffect } from "react"
import { getColor, getCombinationColors } from "../data"
import {
  dotGradientColors,
  paletteLinearGradient,
  rotateGradientColors,
} from "../lib/palette-gradient"
import { readableForeground, rolesForBackground } from "../lib/palette-theme"
import {
  useAnimatedOklch,
  useAnimatedOklchArray,
} from "../lib/use-animated-oklch"
import { usePalette } from "./PaletteContext"

/**
 * The animated "hero field" derived from the active palette: the stage
 * background + foreground, the dot/About gradient, and a per-slot spring of the
 * palette colors. Shared by the Hero and the About page so both render the same
 * colored field and their swatches can morph into one another across routes.
 *
 * Every returned value is a spring-animated `MotionValue`, so a palette swap
 * cross-fades in lockstep on whichever route is mounted — no React re-render
 * per frame.
 */
export function useHeroField() {
  const { theme, combination, colorFilterId } = usePalette()
  const palette = getCombinationColors(combination)
  const filterColor =
    colorFilterId != null ? getColor(colorFilterId) : undefined
  const heroRoles = filterColor
    ? rolesForBackground(theme, filterColor.oklch)
    : { bg: theme.hero, on: theme.onHero, highlight: theme.heroCap }

  const heroBg = useAnimatedOklch(heroRoles.bg)
  const onHero = useAnimatedOklch(heroRoles.on)
  const heroCap = useAnimatedOklch(heroRoles.highlight)
  const onHeroCap = useAnimatedOklch(readableForeground(heroRoles.highlight))

  const dotColors = dotGradientColors(palette, heroRoles.bg)
  const dotColorMvs = useAnimatedOklchArray(
    dotColors.length ? dotColors : [heroRoles.highlight],
  )
  const dotGradientRotation = useMotionValue("0")
  const paletteMvs = useAnimatedOklchArray(palette.map((c) => c.oklch))
  const dotGradient = useTransform(
    [dotGradientRotation, ...dotColorMvs],
    ([rotation, ...colors]) =>
      paletteLinearGradient(
        rotateGradientColors(colors as string[], Number(rotation)),
      ),
  )

  useEffect(() => {
    if (combination.id > 0) dotGradientRotation.set("0")
  }, [combination.id, dotGradientRotation])

  const rotateDotGradient = useCallback(() => {
    dotGradientRotation.set(String(Number(dotGradientRotation.get()) + 1))
  }, [dotGradientRotation])

  return {
    theme,
    combination,
    palette,
    heroBackgroundColor: heroRoles.bg,
    heroBg,
    onHero,
    heroCap,
    onHeroCap,
    dotGradient,
    rotateDotGradient,
    paletteMvs,
  }
}
