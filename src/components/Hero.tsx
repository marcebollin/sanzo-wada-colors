import { motion } from "motion/react"
import { usePalette } from "./PaletteContext"
import { DropCapTitle } from "./DropCapTitle"
import { ColorSwatch } from "./ColorSwatch"
import { CopyPalettePopover } from "./CopyPalettePopover"
import { getCombinationColors } from "../data"
import {
  useAnimatedOklch,
  useAnimatedOklchArray,
} from "../lib/use-animated-oklch"

const HERO_DISPLAY_TITLE = "A Dictionary"
const HERO_MAIN_TITLE = "of Color Combinations"

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
  const { theme, combination } = usePalette()
  const palette = getCombinationColors(combination)

  // Spring-animated OKLCH values. Each bound motion element is kept in sync by
  // the motion runtime at 60fps — no React re-render per frame.
  const heroBg = useAnimatedOklch(theme.hero)
  const onHero = useAnimatedOklch(theme.onHero)
  const heroCap = useAnimatedOklch(theme.heroCap)
  const paletteMvs = useAnimatedOklchArray(palette.map((c) => c.oklch))

  return (
    <motion.header
      className="hero-field relative overflow-hidden"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      {/* strong background shapes built from the palette */}
      <motion.div
        className="hero-dot pointer-events-none absolute rounded-full"
        style={{ backgroundColor: heroCap }}
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
            triggerColor={theme.onHero}
          />
        </div>
        <div className="mt-3 grid auto-cols-fr grid-flow-row gap-1 sm:grid-flow-col sm:gap-1.5">
          {palette.map((c, i) => (
            <motion.div
              key={i}
              className="h-40 sm:h-64"
              whileHover={{ x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ColorSwatch color={c} index={i} variant="feature" bgColor={paletteMvs[i]} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  )
}
