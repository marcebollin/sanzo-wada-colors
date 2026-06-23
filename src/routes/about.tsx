import { createRoute } from "@tanstack/react-router"
import { motion } from "motion/react"
import { ColorSwatch } from "../components/ColorSwatch"
import {
  COPY_PALETTE_TRIGGER_VT_NAME,
  CopyPalettePopover,
} from "../components/CopyPalettePopover"
import { DropCapTitle } from "../components/DropCapTitle"
import {
  ABOUT_NAV_LABEL,
  HOME_NAV_LABEL,
  NAV_ABOUT_VT_NAME,
  NAV_HOME_VT_NAME,
  NavLink,
} from "../components/NavLink"
import { swatchViewTransitionName } from "../components/palette-view-transition"
import { useHeroField } from "../components/use-hero-field"
import { rootRoute } from "./root"

const ABOUT_LEAD = "About this dictionary"
const ABOUT_BODY =
  "Placeholder. This space will describe Sanzo Wada's “A Dictionary of Color Combinations”, the 1930s six-volume study of color harmony that this archive is built from. Until the real copy lands, the words here only exist to prove the type stays legible against whichever palette you have selected — its color is derived from the active combination exactly like the hero title, and its measure is held to a comfortable reading width."

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
})

function AboutPage() {
  const { theme, combination, palette, heroBg, onHero, heroCap, paletteMvs } =
    useHeroField()

  return (
    <motion.main
      className="min-h-dvh"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      {/* compact navigation header: the same About + COPY COMBINATION row that
          sits above the Hero palette, with the palette itself shrunk into a
          text-less strip whose tiles still filter by color (and re-tint the
          background) exactly like the Hero swatches */}
      <header className="mx-auto max-w-6xl px-5 pt-16 sm:pt-20">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <NavLink
              to="/"
              label={HOME_NAV_LABEL}
              color={onHero}
              activeColor={heroCap}
              viewTransitionName={NAV_HOME_VT_NAME}
            />
            <NavLink
              to="/about"
              label={ABOUT_NAV_LABEL}
              color={onHero}
              activeColor={heroCap}
              viewTransitionName={NAV_ABOUT_VT_NAME}
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
        <div className="mt-3 grid auto-cols-fr grid-flow-col gap-1 sm:gap-1.5">
          {palette.map((c, i) => (
            <motion.div
              key={c.id}
              className="h-12 sm:h-16"
              style={{ viewTransitionName: swatchViewTransitionName(c.id) }}
              whileHover={{ x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ColorSwatch
                color={c}
                index={i}
                variant="feature"
                showText={false}
                bgColor={paletteMvs[i]}
              />
            </motion.div>
          ))}
        </div>
      </header>

      {/* about content — color logic mirrors the home title (foreground + cap
          tinted from the active palette), measure held to 55ch */}
      <section className="mx-auto max-w-6xl px-5 pb-32 pt-14 sm:pt-20">
        <div className="max-w-[55ch]">
          <DropCapTitle
            as="h1"
            capColor={heroCap}
            className="text-[clamp(1.75rem,5vw,3rem)]"
            style={{ color: onHero }}
          >
            {ABOUT_LEAD}
          </DropCapTitle>
          <motion.p
            className="mt-6 font-serif text-lg leading-relaxed sm:text-xl"
            style={{ color: onHero }}
          >
            {ABOUT_BODY}
          </motion.p>
        </div>
      </section>
    </motion.main>
  )
}
