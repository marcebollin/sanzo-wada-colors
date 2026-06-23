import { oklch as toOklch } from "culori"
import { motion, useTransform } from "motion/react"
import { getColor, getCombinationColors } from "../data"
import { rolesForBackground } from "../lib/palette-theme"
import {
  useAnimatedOklch,
  useAnimatedOklchArray,
} from "../lib/use-animated-oklch"
import { ColorSwatch } from "./ColorSwatch"
import {
  COPY_PALETTE_TRIGGER_CLASS,
  COPY_PALETTE_TRIGGER_TEXT,
  CopyPalettePopover,
} from "./CopyPalettePopover"
import { DropCapTitle } from "./DropCapTitle"
import { usePalette } from "./PaletteContext"

const HERO_DISPLAY_TITLE = "A Dictionary"
const HERO_MAIN_TITLE = "of Color Combinations"
const DOT_GRADIENT_SEGMENT_DECAY = 0.8

function gradientStopPositions(count: number) {
  if (count <= 1) return [0]

  const segmentCount = count - 1
  const weights = Array.from(
    { length: segmentCount },
    (_, i) => DOT_GRADIENT_SEGMENT_DECAY ** i,
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let position = 0

  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return 0
    if (i === count - 1) return 100

    position += (weights[i - 1] / total) * 100
    return Number(position.toFixed(2))
  })
}

function paletteLinearGradient(colors: string[]) {
  const gradientColors = colors.length > 1 ? colors : [colors[0], colors[0]]
  const positions = gradientStopPositions(gradientColors.length)
  const stops = gradientColors
    .map((color, i) => {
      return `${color} ${positions[i]}%`
    })
    .join(", ")

  return `linear-gradient(-20deg in oklch, ${stops})`
}

function oklchLightness(color: string) {
  return toOklch(color)?.l ?? 0.5
}

type HeroTitleProps = {
  color: string | ReturnType<typeof useAnimatedOklch>
  capColor: string | ReturnType<typeof useAnimatedOklch>
  heading?: boolean
}

function HeroTitle({ color, capColor, heading = false }: HeroTitleProps) {
  return (
    <>
      <motion.p
        className="font-display text-[clamp(3rem,11vw,9rem)] uppercase leading-[0.82] tracking-tight"
        style={{ color }}
      >
        {HERO_DISPLAY_TITLE}
      </motion.p>
      <DropCapTitle
        as={heading ? "h1" : "div"}
        capColor={capColor}
        className="-mt-2 max-w-4xl text-[clamp(2rem,6.5vw,5rem)] sm:-mt-3"
        style={{ color }}
      >
        {HERO_MAIN_TITLE}
      </DropCapTitle>
    </>
  )
}

export function Hero() {
  const { theme, combination, colorFilterId } = usePalette()
  const palette = getCombinationColors(combination)
  const filterColor =
    colorFilterId != null ? getColor(colorFilterId) : undefined
  const heroRoles = filterColor
    ? rolesForBackground(theme, filterColor.oklch)
    : { bg: theme.hero, on: theme.onHero, highlight: theme.heroCap }

  // Spring-animated OKLCH values. Each bound motion element is kept in sync by
  // the motion runtime at 60fps — no React re-render per frame.
  const heroBg = useAnimatedOklch(heroRoles.bg)
  const onHero = useAnimatedOklch(heroRoles.on)
  const heroCap = useAnimatedOklch(heroRoles.highlight)
  const dotColors = palette
    .filter((color) => color.oklch !== heroRoles.bg)
    .slice()
    .sort((a, b) => oklchLightness(a.oklch) - oklchLightness(b.oklch))
    .map((c) => c.oklch)
  const dotColorMvs = useAnimatedOklchArray(
    dotColors.length ? dotColors : [heroRoles.highlight],
  )
  const paletteMvs = useAnimatedOklchArray(palette.map((c) => c.oklch))
  const heroDotGradient = useTransform(dotColorMvs, (colors) =>
    paletteLinearGradient(colors as string[]),
  )

  return (
    <motion.header
      className="hero-field relative overflow-hidden"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      {/* strong background shapes built from the palette */}
      <motion.div
        className="hero-dot pointer-events-none absolute rounded-full"
        style={{ backgroundColor: heroCap, backgroundImage: heroDotGradient }}
        aria-hidden="true"
      />

      {/* knockout overlay: duplicate title in the hero bg color, clipped to
          the dot so the overlapping letters punch through to the background */}
      <div
        className="hero-dot-overlay hero-title-knockout pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pt-20">
          <HeroTitle color={heroBg} capColor={heroBg} />
          <div className="mt-10 flex justify-end">
            <motion.span
              className={COPY_PALETTE_TRIGGER_CLASS}
              style={{ color: heroBg }}
            >
              {COPY_PALETTE_TRIGGER_TEXT}
            </motion.span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pt-20">
        {/* oversized bold display line + aligned drop-cap serif title */}
        <HeroTitle color={onHero} capColor={heroCap} heading />

        {/* the active palette, shown big — same tile as the grid, so clicking
            a block filters the carousel too */}
        <div className="mt-10 flex justify-end">
          <CopyPalettePopover
            combination={combination}
            colors={palette}
            theme={theme}
            triggerColor={onHero}
          />
        </div>
        <div className="mt-3 grid auto-cols-fr grid-flow-row gap-1 sm:grid-flow-col sm:gap-1.5">
          {palette.map((c, i) => (
            <motion.div
              key={c.id}
              className="h-40 sm:h-64"
              whileHover={{ x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ColorSwatch
                color={c}
                index={i}
                variant="feature"
                bgColor={paletteMvs[i]}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  )
}
