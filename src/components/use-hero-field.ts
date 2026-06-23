import { useTransform } from "motion/react"
import { getColor, getCombinationColors } from "../data"
import {
  dotGradientColors,
  paletteLinearGradient,
} from "../lib/palette-gradient"
import { rolesForBackground } from "../lib/palette-theme"
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

  const dotColors = dotGradientColors(palette, heroRoles.bg)
  const dotColorMvs = useAnimatedOklchArray(
    dotColors.length ? dotColors : [heroRoles.highlight],
  )
  const paletteMvs = useAnimatedOklchArray(palette.map((c) => c.oklch))
  const dotGradient = useTransform(dotColorMvs, (colors) =>
    paletteLinearGradient(colors as string[]),
  )

  return {
    theme,
    combination,
    palette,
    heroBg,
    onHero,
    heroCap,
    dotGradient,
    paletteMvs,
  }
}
