import { createRoute } from "@tanstack/react-router"
import { motion } from "motion/react"
import { ColorSwatch } from "../components/ColorSwatch"
import {
  COPY_PALETTE_TRIGGER_VT_NAME,
  CopyPalettePopover,
} from "../components/CopyPalettePopover"
import { DropCapTitle } from "../components/DropCapTitle"
import { InlinePreviewCard } from "../components/InlinePreviewCard"
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
const ABOUT_BODY = [
  "A Dictionary of Color Combinations is drawn from Haishoku Soukan, Sanzo Wada's six-volume study of color harmony published in 1933 and 1934. This archive follows its collection of 348 palettes: small, deliberate combinations made at a moment when treating color relationships as a design system was still unusual.",
  "Wada (1883-1967) was a Japanese artist, teacher, costume designer, kimono and fashion designer whose work moved between fine art, theater, film, and visual research. Across those fields, he studied how color, perception, and form could shape modern design.",
  "The palettes here preserve that practical curiosity. Each combination can be read as both a historical artifact and a working tool: a compact lesson in contrast, balance, and atmosphere.",
]
const WEBSITE_LEAD = "About this website"
const WEBSITE_BODY = [
  {
    id: "santander",
    content: (
      <>
        I found this book during a trip to Santander, Spain, at the{" "}
        <InlinePreviewCard
          previewLabel="Preview Centro Botin museum"
          preview={
            <img
              src="/centro-botin.jpeg"
              alt="Centro Botin museum in Santander, Spain"
              className="aspect-[4/3] w-full object-cover"
            />
          }
        >
          Centro Botin museum
        </InlinePreviewCard>
        . As someone who has wrestled with color for a long time, I bought it
        without hesitation.
      </>
    ),
  },
  {
    id: "oklch",
    content: (
      <>
        After coming back from the trip, I wanted to experiment with OKLCH
        thanks to{" "}
        <a
          href="https://oklch.fyi/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-current/35 underline-offset-4 transition hover:decoration-current"
        >
          Jakub Krehel's guide
        </a>
        . I immediately thought of making a digital version of Wada's book:
        something I could reach for whenever I needed a quick color combination
        to use in a project.
      </>
    ),
  },
  {
    id: "color-first",
    content:
      "To let color become the true protagonist of the page, I wanted to avoid lines, figures, or decorative graphics.",
  },
]

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
      <header className="mx-auto max-w-6xl px-6 pt-8 sm:px-8 sm:pt-10">
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
              className="h-16 sm:h-24"
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
      <section className="mx-auto max-w-6xl px-6 pb-40 pt-12 sm:px-8 sm:pb-48 sm:pt-16">
        <div className="flex flex-wrap justify-center gap-14 sm:gap-16 lg:gap-20">
          <div className="w-fit max-w-full flex-none sm:max-w-[50ch]">
            <DropCapTitle
              as="h1"
              capColor={heroCap}
              className="whitespace-nowrap text-[1.55rem] sm:text-4xl xl:text-5xl"
              style={{ color: onHero }}
            >
              {ABOUT_LEAD}
            </DropCapTitle>
            <div className="mt-6 space-y-5 font-serif text-lg leading-relaxed sm:text-xl">
              {ABOUT_BODY.map((paragraph) => (
                <motion.p key={paragraph} style={{ color: onHero }}>
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>

          <div className="w-fit max-w-full flex-none sm:max-w-[50ch]">
            <DropCapTitle
              as="h2"
              capColor={heroCap}
              className="whitespace-nowrap text-[1.55rem] sm:text-4xl xl:text-5xl"
              style={{ color: onHero }}
            >
              {WEBSITE_LEAD}
            </DropCapTitle>
            <div className="mt-6 space-y-5 font-serif text-lg leading-relaxed sm:text-xl">
              {WEBSITE_BODY.map((paragraph) => (
                <motion.p key={paragraph.id} style={{ color: onHero }}>
                  {paragraph.content}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  )
}
