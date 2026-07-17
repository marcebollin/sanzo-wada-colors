import { motion } from "motion/react"
import { ColorSwatch } from "./ColorSwatch"
import {
  COPY_PALETTE_TRIGGER_VT_NAME,
  CopyPalettePopover,
} from "./CopyPalettePopover"
import {
  ABOUT_NAV_LABEL,
  EXPLORATIONS_NAV_LABEL,
  HOME_NAV_LABEL,
  NAV_ABOUT_VT_NAME,
  NAV_EXPLORATIONS_VT_NAME,
  NAV_HOME_VT_NAME,
  NavLink,
} from "./NavLink"
import { swatchViewTransitionName } from "./palette-view-transition"
import { useHeroField } from "./use-hero-field"

/**
 * The compact palette header shared by every page below the home route. Its
 * transition names mirror the Hero so navigation between the full and compact
 * headers keeps the swatch and navigation morphs intact.
 */
export function PageHeader() {
  const {
    theme,
    combination,
    palette,
    displayColor,
    heroBackgroundColor,
    heroBg,
    onHero,
    heroCap,
    paletteMvs,
  } = useHeroField()

  return (
    <motion.header
      style={{ backgroundColor: heroBg, color: onHero }}
      className="relative"
    >
      <div className="mx-auto max-w-6xl px-6 pt-8 sm:px-8 sm:pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
          <nav
            aria-label="Primary navigation"
            className="flex items-baseline gap-4 sm:gap-6"
          >
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
            <NavLink
              to="/explorations"
              label={EXPLORATIONS_NAV_LABEL}
              color={onHero}
              activeColor={heroCap}
              viewTransitionName={NAV_EXPLORATIONS_VT_NAME}
            />
          </nav>
          <CopyPalettePopover
            combination={combination}
            colors={palette}
            theme={theme}
            triggerColor={onHero}
            triggerViewTransitionName={COPY_PALETTE_TRIGGER_VT_NAME}
          />
        </div>

        <div className="mt-3 grid auto-cols-fr grid-flow-col gap-1 sm:gap-1.5">
          {palette.map((color, index) => (
            <motion.div
              key={color.id}
              className="h-16 sm:h-24"
              style={{
                viewTransitionName: swatchViewTransitionName(color.id),
              }}
              whileHover={{ x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ColorSwatch
                color={color}
                index={index}
                variant="feature"
                showText={false}
                bgColor={paletteMvs[index]}
                showContrastBorder={displayColor(color) === heroBackgroundColor}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  )
}
