import { createRoute } from "@tanstack/react-router"
import { motion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { CopyPalettePopover } from "../components/CopyPalettePopover"
import { DesignEngineerExport } from "../components/DesignEngineerExport"
import { FeelingBannerExport } from "../components/FeelingBannerExport"
import { FeelingPopulation } from "../components/FeelingPopulation"
import { FeelingWheel } from "../components/FeelingWheel"
import { usePalette } from "../components/PaletteContext"
import { useHeroField } from "../components/use-hero-field"
import {
  emotionForHue,
  FEELING_LIGHTNESS_MAX,
  FEELING_LIGHTNESS_MIN,
  type FeelingTarget,
  rankFeelingPalettes,
  targetOklch,
} from "../lib/feeling-match"
import { rootRoute } from "./root"

export const feelingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feeling",
  component: FeelingPage,
})

function randomInitialTarget(): FeelingTarget {
  // Square-rooting the radius distributes initial positions evenly across
  // the wheel's area instead of clustering them around its center.
  const radius = Math.sqrt(Math.random())
  return {
    hue: Math.random() * 360,
    lightness:
      FEELING_LIGHTNESS_MAX -
      radius * (FEELING_LIGHTNESS_MAX - FEELING_LIGHTNESS_MIN),
    intensity: 50,
  }
}

function formatChannel(value: number, digits = 3) {
  return value.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "")
}

function feelingTitleFontSize(value: string) {
  const estimatedWidthPerCharacter = 0.55
  const availableWidth = 14.5
  return `${Math.min(
    6,
    availableWidth / (Math.max(value.length, 1) * estimatedWidthPerCharacter),
  )}rem`
}

function FeelingPage() {
  const { combination, combinations, theme, select, sizeFilter } = usePalette()
  const { heroBackgroundColor, heroBg, onHero, heroCap } = useHeroField()
  const [target, setTarget] = useState(randomInitialTarget)
  const targetColor = useMemo(() => targetOklch(target), [target])
  const allPaletteColors = useMemo(
    () => theme.swatches.map((swatch) => swatch.css),
    [theme.swatches],
  )
  const paletteColors = useMemo(
    () => allPaletteColors.filter((color) => color !== heroBackgroundColor),
    [allPaletteColors, heroBackgroundColor],
  )
  const emotion = emotionForHue(target.hue)
  const feelingCandidates = useMemo(
    () =>
      combinations.filter(
        (candidate) =>
          sizeFilter == null || candidate.colorIds.length === sizeFilter,
      ),
    [combinations, sizeFilter],
  )
  const matches = useMemo(
    () => rankFeelingPalettes(target, 8, feelingCandidates),
    [feelingCandidates, target],
  )
  const bestMatch = matches[0]?.combination
  const previousTarget = useRef<FeelingTarget | null>(null)

  // A header swatch remains the visual focus while it belongs to the selected
  // palette. Feeling changes still choose the closest palette normally; when
  // that palette does not contain the focused color, the color filter clears.
  useEffect(() => {
    const targetChanged = previousTarget.current !== target
    previousTarget.current = target
    if (targetChanged && bestMatch != null) select(bestMatch.id)
  }, [bestMatch, select, target])

  return (
    <motion.main
      className="min-h-dvh overflow-x-clip pb-44"
      style={{ backgroundColor: heroBg, color: onHero }}
    >
      <section className="mx-auto max-w-6xl px-6 pt-8 sm:px-8 sm:pt-10">
        <div>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
            <div className="min-w-0">
              <header className="max-w-2xl pb-0 pt-2 text-left leading-none sm:pt-3">
                <motion.h1
                  className="whitespace-nowrap font-display text-[clamp(2rem,4.2vw,4.5rem)] font-bold uppercase leading-[0.95] tracking-[0.02em]"
                  style={{ color: onHero }}
                >
                  How do you{" "}
                  <motion.span style={{ color: heroCap }}>feel</motion.span>
                  {"?"}
                </motion.h1>
                <p className="mt-2 max-w-xl font-serif text-base sm:text-lg">
                  Play with the feeling picker and adjust its intensity to find
                  a palette that matches your mood.
                </p>
              </header>

              <div className="flex min-w-0 justify-center md:justify-start">
                <FeelingWheel
                  target={target}
                  onChange={setTarget}
                  ink={theme.ink}
                  paper={theme.paper}
                  labelColor={theme.onHero}
                  highlight={theme.heroCap}
                  backgroundColor={heroBg}
                />
              </div>
            </div>

            <FeelingPopulation
              hue={target.hue}
              intensity={target.intensity}
              colors={paletteColors}
              paletteId={combination.id}
            />
          </div>

          <div className="min-w-0 pb-10 pt-12 sm:pb-12 sm:pt-16 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-20">
            <section
              aria-labelledby="current-feeling-title"
              className="lg:sticky lg:top-8 lg:w-fit lg:max-w-[15rem] lg:self-start"
            >
              <h2
                id="current-feeling-title"
                className="min-w-0 whitespace-nowrap font-display font-semibold leading-[0.82] tracking-tight"
                style={{ fontSize: feelingTitleFontSize(emotion.name) }}
              >
                {emotion.name}
              </h2>

              <dl className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-8">
                <ChannelValue
                  label="Light"
                  value={formatChannel(target.lightness)}
                />
                <ChannelValue
                  label="Chroma"
                  value={formatChannel(targetColor.chroma)}
                />
                <ChannelValue
                  label="Hue"
                  value={`${Math.round(target.hue)}°`}
                />
              </dl>
            </section>

            <div className="mt-16 grid min-w-0 gap-14 sm:mt-20 lg:mt-0">
              <section aria-labelledby="palette-matches-title">
                <h2
                  id="palette-matches-title"
                  className="text-right font-display text-4xl font-bold sm:text-5xl"
                >
                  Palette matches
                </h2>

                <ol className="mt-8 grid gap-2">
                  {matches.map((match) => {
                    const selected = match.combination.id === combination.id
                    return (
                      <li
                        key={match.combination.id}
                        className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-stretch gap-7 py-2 text-right"
                      >
                        <button
                          type="button"
                          onClick={() => select(match.combination.id)}
                          aria-pressed={selected}
                          aria-label={`Select palette ${match.combination.id}, ${match.similarity}% match`}
                          className="relative z-0 flex h-full min-w-0 cursor-pointer overflow-hidden rounded-sm transition-transform duration-200 hover:z-10 hover:scale-[1.025] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                          style={{ outlineColor: theme.accent }}
                        >
                          {match.colors.map((color) => (
                            <span
                              key={color.id}
                              className="h-full min-w-0 flex-1"
                              style={{ backgroundColor: color.oklch }}
                            />
                          ))}
                        </button>

                        <span className="flex w-full flex-col items-end justify-between gap-2 text-right">
                          <span className="flex items-center justify-end gap-2">
                            <span className="font-serif text-2xl font-semibold leading-none">
                              No. {match.combination.id}
                            </span>
                            <CopyPalettePopover
                              combination={match.combination}
                              colors={match.colors}
                              theme={theme}
                              triggerColor={theme.onHero}
                              triggerLabel={`Copy combination ${match.combination.name}`}
                              triggerContent={<PaletteCopyIcon />}
                              className="mt-px size-5 shrink-0 self-center items-center justify-center p-0 text-base opacity-65 transition-opacity hover:opacity-100"
                            />
                          </span>
                          <motion.span
                            className="font-serif text-2xl font-semibold leading-none"
                            style={{ color: heroCap }}
                          >
                            {match.similarity}%
                          </motion.span>
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </section>

              <FeelingBannerExport
                feeling={emotion.name}
                hue={target.hue}
                intensity={target.intensity}
                colors={paletteColors}
                paletteId={combination.id}
                backgroundColor={heroBackgroundColor}
                highlightColor={theme.heroCap}
              />

              <DesignEngineerExport
                feeling={emotion.name}
                hue={target.hue}
                intensity={target.intensity}
                colors={allPaletteColors}
                paletteId={combination.id}
                highlightColor={theme.heroCap}
                paperColor={theme.paper}
                labelColor={theme.onHero}
              />
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  )
}

function ChannelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] opacity-55">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-[clamp(1.75rem,4vw,3.75rem)] font-semibold leading-none tracking-tight">
        {value}
      </dd>
    </div>
  )
}

function PaletteCopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}
