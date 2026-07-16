import { createRoute } from "@tanstack/react-router"
import { type MotionValue, motion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { CopyPalettePopover } from "../components/CopyPalettePopover"
import { DesignEngineerExport } from "../components/DesignEngineerExport"
import { FeelingBannerExport } from "../components/FeelingBannerExport"
import { FeelingPopulation } from "../components/FeelingPopulation"
import { FeelingShapePath } from "../components/FeelingShapePath"
import { FeelingWheel } from "../components/FeelingWheel"
import { usePalette } from "../components/PaletteContext"
import { useHeroField } from "../components/use-hero-field"
import {
  emotionForHue,
  FEELING_LIGHTNESS_MAX,
  FEELING_LIGHTNESS_MIN,
  type FeelingMatch,
  type FeelingTarget,
  feelingMatchWeights,
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

const MATCHING_SHAPE_SAMPLES = [
  { id: "anger-soft", hue: 20, amount: 35 },
  { id: "anger-strong", hue: 55, amount: 90 },
  { id: "fear-soft", hue: 105, amount: 45 },
  { id: "fear-strong", hue: 135, amount: 100 },
  { id: "disgust", hue: 180, amount: 80 },
  { id: "sadness-soft", hue: 225, amount: 45 },
  { id: "sadness-strong", hue: 255, amount: 100 },
  { id: "joy-soft", hue: 300, amount: 45 },
]

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
  const rankedMatches = useMemo(
    () =>
      rankFeelingPalettes(target, feelingCandidates.length, feelingCandidates),
    [feelingCandidates, target],
  )
  const matches = rankedMatches.slice(0, 8)
  const counterMatches = rankedMatches.slice(-5).reverse()
  const selectedMatch = useMemo(
    () => rankFeelingPalettes(target, 1, [combination])[0],
    [combination, target],
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

          <div className="min-w-0 pt-12 sm:pt-16 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-20">
            <section
              aria-labelledby="current-feeling-title"
              className="lg:sticky lg:top-8 lg:w-fit lg:max-w-[15rem] lg:self-start"
            >
              <h2
                id="current-feeling-title"
                className="min-w-0 whitespace-nowrap text-center font-display font-semibold leading-[0.82] tracking-tight lg:text-left"
                style={{ fontSize: feelingTitleFontSize(emotion.name) }}
              >
                {emotion.name}
              </h2>

              <dl className="mt-10 flex flex-wrap justify-between gap-x-4 gap-y-6 sm:mt-12 sm:gap-y-8 lg:grid lg:grid-cols-1">
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
                <ChannelValue
                  label="Intensity"
                  value={`${Math.round(target.intensity)}%`}
                />
              </dl>
            </section>

            <div className="mt-16 grid min-w-0 gap-14 sm:mt-20 lg:mt-0">
              <PaletteMatchSection
                id="palette-matches-title"
                title="Palette matches"
                matches={matches}
                selectedPaletteId={combination.id}
                select={select}
                theme={theme}
                highlight={heroCap}
              />

              <PaletteMatchSection
                id="counter-feeling-title"
                title="Counter your feeling"
                subtitle="Choose the palette that matches your feeling the least"
                matches={counterMatches}
                selectedPaletteId={combination.id}
                select={select}
                theme={theme}
                highlight={heroCap}
              />

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

          <MatchingExplainer
            target={target}
            targetColor={targetColor}
            selectedMatch={selectedMatch}
            paletteColors={paletteColors}
            ink={theme.onHero}
            highlight={theme.heroCap}
          />
        </div>
      </section>
    </motion.main>
  )
}

function PaletteMatchSection({
  id,
  title,
  subtitle,
  matches,
  selectedPaletteId,
  select,
  theme,
  highlight,
}: {
  id: string
  title: string
  subtitle?: string
  matches: FeelingMatch[]
  selectedPaletteId: number
  select: (id: number) => void
  theme: ReturnType<typeof usePalette>["theme"]
  highlight: MotionValue<string>
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="text-right font-display text-4xl font-bold sm:text-5xl"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 block text-right font-mono text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
          {subtitle}
        </p>
      ) : null}

      <ol className="mt-8 grid gap-2">
        {matches.map((match) => {
          const selected = match.combination.id === selectedPaletteId
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
                  style={{ color: highlight }}
                >
                  {match.similarity}%
                </motion.span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function MatchingExplainer({
  target,
  targetColor,
  selectedMatch,
  paletteColors,
  ink,
  highlight,
}: {
  target: FeelingTarget
  targetColor: { css: string; chroma: number }
  selectedMatch?: FeelingMatch
  paletteColors: string[]
  ink: string
  highlight: string
}) {
  const ruleColor = `color-mix(in oklch, ${ink} 24%, transparent)`
  const softHighlight = `color-mix(in oklch, ${highlight} 28%, transparent)`
  const weights = feelingMatchWeights(target.intensity)
  const availableShapeColors =
    paletteColors.length > 0 ? paletteColors : [targetColor.css]
  return (
    <section
      aria-labelledby="matching-explainer-title"
      className="mt-12 pb-4 sm:mt-16"
    >
      <header>
        <h2
          id="matching-explainer-title"
          className="w-full text-left text-pretty font-display text-[clamp(3.25rem,7.5vw,5.25rem)] font-bold uppercase leading-[0.95] tracking-tight xl:whitespace-nowrap"
        >
          Why these colors feel right
        </h2>
        <p className="mt-2.5 max-w-3xl font-serif text-lg leading-relaxed sm:text-xl">
          Your feeling is processed and compared with all 348 possible Sanzo
          Wada combinations to find the top matches.
        </p>
      </header>

      <ol className="mt-12 grid gap-10 lg:flex lg:items-stretch lg:justify-between lg:gap-12 xl:gap-16">
        <MatchingStep>
          <div
            className="grid h-11 w-full grid-cols-[repeat(8,minmax(0,1fr))] items-center gap-1"
            aria-hidden="true"
          >
            {MATCHING_SHAPE_SAMPLES.map((shape, index) => (
              <svg
                key={shape.id}
                viewBox="0 0 100 100"
                className="h-11 w-full overflow-visible"
                aria-hidden="true"
              >
                <FeelingShapePath
                  hue={shape.hue}
                  amount={shape.amount}
                  fill={
                    availableShapeColors[index % availableShapeColors.length]
                  }
                />
              </svg>
            ))}
          </div>
          <h3 className="mt-5 font-display text-3xl font-bold uppercase leading-none">
            Read your feeling
          </h3>
          <p className="mt-5 font-serif text-base leading-relaxed sm:text-lg">
            The wheel determines the{" "}
            <MatchingHighlight color={targetColor.css}>hue</MatchingHighlight> (
            {Math.round(target.hue)}°), position determines{" "}
            <MatchingHighlight color={highlight}>lightness</MatchingHighlight> (
            {Math.round(target.lightness * 100)}%), and intensity determines{" "}
            <MatchingHighlight color={ink}>chroma</MatchingHighlight>. Together,
            these values describe the requested color.
          </p>
        </MatchingStep>

        <MatchingStep>
          <div
            role="img"
            className="flex h-11 overflow-hidden rounded-sm border"
            style={{ borderColor: ruleColor }}
            aria-label={
              selectedMatch
                ? `Colors in selected palette ${selectedMatch.combination.id}`
                : "Selected palette colors"
            }
          >
            {selectedMatch?.colors.map((color) => (
              <span
                key={color.id}
                className="min-w-0 flex-1"
                style={{ backgroundColor: color.oklch }}
              />
            ))}
          </div>
          <h3 className="mt-5 font-display text-3xl font-bold uppercase leading-none">
            Read every palette
          </h3>
          <p className="mt-5 font-serif text-base leading-relaxed sm:text-lg">
            Each palette is distilled into the same three traits. Vivid swatches
            lead its{" "}
            <MatchingHighlight
              color={selectedMatch?.colors[0]?.oklch ?? highlight}
            >
              color direction
            </MatchingHighlight>
            , while pale and neutral swatches still shape its overall brightness
            and softness.
          </p>
        </MatchingStep>

        <MatchingStep>
          <div className="grid h-11 grid-cols-3 gap-1" aria-hidden="true">
            <span
              className="rounded-sm"
              style={{ backgroundColor: targetColor.css }}
            />
            <span
              className="rounded-sm"
              style={{ backgroundColor: highlight }}
            />
            <span
              className="rounded-sm border"
              style={{
                backgroundColor: softHighlight,
                borderColor: ruleColor,
              }}
            />
          </div>
          <h3 className="mt-5 font-display text-3xl font-bold uppercase leading-none">
            Measure the distance
          </h3>
          <p className="mt-5 font-serif text-base leading-relaxed sm:text-lg">
            The distance between the two recipes is measured.{" "}
            <MatchingHighlight color={targetColor.css}>
              Hue leads
            </MatchingHighlight>
            ; stronger feelings give chroma more say. That distance gives the
            selected palette a{" "}
            <MatchingHighlight color={highlight}>
              {selectedMatch?.similarity ?? 0}% match
            </MatchingHighlight>
            .
          </p>
        </MatchingStep>
      </ol>

      <div className="mt-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(13rem,0.55fr)] lg:items-start lg:gap-10">
          <div
            role="math"
            aria-label="Distance equals the square root of the weighted hue, lightness, and chroma gaps squared. Match percentage equals one minus that distance, multiplied by one hundred."
          >
            <div>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 font-serif text-[clamp(1.2rem,2.5vw,2rem)] font-semibold leading-relaxed lg:flex-nowrap lg:whitespace-nowrap">
                <span>d = √(</span>
                <MatchingHighlight color={targetColor.css}>
                  {weights.hue.toFixed(2)} ΔH²
                </MatchingHighlight>
                <span>+</span>
                <MatchingHighlight color={highlight}>
                  {weights.lightness.toFixed(2)} ΔL²
                </MatchingHighlight>
                <span>+</span>
                <MatchingHighlight color={ink}>
                  {weights.chroma.toFixed(2)} ΔC²
                </MatchingHighlight>
                <span>)</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] sm:text-sm">
                <span>Match = round(max(0, 1 − d) × 100)</span>
                <span aria-hidden="true">→</span>
                <MatchingHighlight color={highlight} shadeOffsetY={0}>
                  {selectedMatch?.similarity ?? 0}%
                </MatchingHighlight>
              </div>
            </div>

            <p className="mt-4 w-full text-left text-pretty font-mono text-[0.65rem] uppercase leading-relaxed tracking-[0.18em] opacity-60">
              A high percentage does not mean identical — it means the selected
              palette carries a similar hue, brightness, and color intensity as
              a whole.
            </p>
          </div>

          <div>
            <p className="max-w-sm font-serif text-base leading-snug opacity-80">
              Each Δ is the normalized gap between your feeling and a palette.
              Smaller gaps make a better match.
            </p>
            <dl className="mt-3 grid gap-1 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.12em] opacity-55">
              <div className="flex gap-2">
                <dt>ΔH</dt>
                <dd>= Hue gap</dd>
              </div>
              <div className="flex gap-2">
                <dt>ΔL</dt>
                <dd>= Lightness gap</dd>
              </div>
              <div className="flex gap-2">
                <dt>ΔC</dt>
                <dd>= Chroma gap</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <aside
        aria-labelledby="about-feeling-page-title"
        className="mt-16 sm:mt-20"
      >
        <h2
          id="about-feeling-page-title"
          className="w-full text-left text-pretty font-display text-[clamp(3.25rem,7.5vw,5.25rem)] font-bold uppercase leading-[0.95] tracking-tight xl:whitespace-nowrap"
        >
          About this page
        </h2>
        <div className="mt-8 max-w-2xl font-serif text-lg leading-relaxed sm:text-xl">
          <p>
            This page was born as the final exercise for the color module of the{" "}
            <a
              href="https://www.artofvisualdesign.com/"
              className="box-decoration-clone px-1 font-semibold underline decoration-1 underline-offset-4"
              style={{ backgroundColor: softHighlight }}
            >
              Art of Visual Design
            </a>{" "}
            course by the amazing{" "}
            <a
              href="https://www.lalizlabeth.com/"
              className="box-decoration-clone px-1 font-semibold underline decoration-1 underline-offset-4"
              style={{
                backgroundColor: `color-mix(in oklch, ${targetColor.css} 30%, transparent)`,
              }}
            >
              Elizabeth Lin
            </a>
            .
          </p>
        </div>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed sm:text-xl">
          I recommend that course{" "}
          <span className="font-semibold italic">con los ojos cerrados</span>.
        </p>
      </aside>
    </section>
  )
}

function MatchingStep({ children }: { children: React.ReactNode }) {
  return <li className="min-w-0 lg:flex-1">{children}</li>
}

function MatchingHighlight({
  color,
  shadeOffsetY = 1,
  children,
}: {
  color: string
  shadeOffsetY?: number
  children: React.ReactNode
}) {
  return (
    <span className="relative z-0 inline-block px-1.5 py-[0.1em] font-semibold leading-none">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundColor: `color-mix(in oklch, ${color} 30%, transparent)`,
          transform: `translateY(${shadeOffsetY}px)`,
        }}
      />
      {children}
    </span>
  )
}

function ChannelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-fit min-w-0 flex-none lg:w-auto">
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
