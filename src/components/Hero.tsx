import { motion } from "motion/react"
import type { useAnimatedOklch } from "../lib/use-animated-oklch"
import { ColorSwatch } from "./ColorSwatch"
import {
  COPY_PALETTE_TRIGGER_CLASS,
  COPY_PALETTE_TRIGGER_TEXT,
  COPY_PALETTE_TRIGGER_VT_NAME,
  CopyPalettePopover,
} from "./CopyPalettePopover"
import { DropCapTitle } from "./DropCapTitle"
import {
  ABOUT_NAV_LABEL,
  EXPLORATIONS_NAV_LABEL,
  NAV_ABOUT_VT_NAME,
  NAV_EXPLORATIONS_VT_NAME,
  NavLink,
} from "./NavLink"
import { swatchViewTransitionName } from "./palette-view-transition"
import { useBouncingHeroDot } from "./use-bouncing-hero-dot"
import { useHeroField } from "./use-hero-field"

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
        className="-mt-4 max-w-4xl text-[clamp(2rem,6.5vw,5rem)] sm:-mt-6"
        style={{ color }}
      >
        {HERO_MAIN_TITLE}
      </DropCapTitle>
    </>
  )
}

export function Hero() {
  const {
    theme,
    combination,
    palette,
    displayColor,
    heroBackgroundColor,
    heroBg,
    onHero,
    heroCap,
    dotGradient,
    rotateDotGradient,
    paletteMvs,
  } = useHeroField()
  const { fieldRef, dotRef } = useBouncingHeroDot(
    palette.length > 2 ? rotateDotGradient : undefined,
  )

  return (
    <motion.header
      ref={fieldRef}
      className="hero-field relative overflow-hidden"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      {/* strong background shapes built from the palette */}
      <motion.div
        ref={dotRef}
        className="hero-dot pointer-events-none absolute rounded-full"
        style={{ backgroundColor: heroCap, backgroundImage: dotGradient }}
        aria-hidden="true"
      />

      {/* knockout overlay: duplicate title in the hero bg color, clipped to
          the dot so the overlapping letters punch through to the background.
          It carries its own view-transition-name so it is lifted out of the
          root snapshot: during a route morph it stays hidden (it has no
          counterpart on other routes, where the nav items would otherwise ghost
          against this masked duplicate) and fades in only once the morph
          settles — see `::view-transition-*(hero-knockout)` in globals.css. */}
      <div
        className="hero-dot-overlay hero-title-knockout pointer-events-none absolute inset-0"
        style={{ viewTransitionName: "hero-knockout" }}
        aria-hidden="true"
      >
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pt-20">
          <HeroTitle color={heroBg} capColor={heroBg} />
          <div className="mt-10 flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-4 sm:gap-6">
              <motion.span
                className="font-display text-[clamp(0.95rem,2.1vw,1.5rem)] uppercase leading-none tracking-[0.08em]"
                style={{ color: heroBg }}
              >
                {ABOUT_NAV_LABEL}
              </motion.span>
              <motion.span
                className="font-display text-[clamp(0.95rem,2.1vw,1.5rem)] uppercase leading-none tracking-[0.08em]"
                style={{ color: heroBg }}
              >
                {EXPLORATIONS_NAV_LABEL}
              </motion.span>
            </div>
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

        {/* nav row: page links (left) + copy combination (right) sit above the
            palette — the same row mirrored by the shared compact page header */}
        <div className="mt-10 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <NavLink
              to="/about"
              label={ABOUT_NAV_LABEL}
              color={onHero}
              activeColor={heroCap}
              viewTransitionName={NAV_ABOUT_VT_NAME}
            />
            <NavLink
              to="/explorations"
              label={EXPLORATIONS_NAV_LABEL}
              color={onHero}
              activeColor={heroCap}
              viewTransitionName={NAV_EXPLORATIONS_VT_NAME}
            />
          </div>
          <CopyPalettePopover
            combination={combination}
            colors={palette}
            theme={theme}
            triggerColor={onHero}
            triggerViewTransitionName={COPY_PALETTE_TRIGGER_VT_NAME}
          />
        </div>
        <div className="mt-3 grid auto-cols-fr grid-flow-row gap-1 sm:grid-flow-col sm:gap-1.5">
          {palette.map((c, i) => (
            <motion.div
              key={c.id}
              className="h-40 sm:h-64"
              style={{ viewTransitionName: swatchViewTransitionName(c.id) }}
              whileHover={{ x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ColorSwatch
                color={c}
                index={i}
                variant="feature"
                bgColor={paletteMvs[i]}
                showContrastBorder={displayColor(c) === heroBackgroundColor}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  )
}
