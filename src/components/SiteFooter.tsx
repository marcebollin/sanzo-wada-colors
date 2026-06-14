import { colors } from "../data"
import { usePalette } from "./PaletteContext"

export function SiteFooter() {
  const { theme } = usePalette()

  return (
    <footer style={{ backgroundColor: theme.ink, color: theme.paper }}>
      {/* full archive ribbon */}
      <div className="flex h-3 w-full" aria-hidden="true">
        {colors.map((c) => (
          <div key={c.id} className="flex-1" style={{ backgroundColor: c.oklch }} />
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-28 pt-14 sm:pb-32">
        <p
          className="font-display text-[clamp(2.5rem,9vw,7rem)] uppercase leading-[0.82]"
          style={{ color: theme.paper }}
        >
          配色 Haishoku
        </p>
        <div className="mt-8 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: `color-mix(in oklch, ${theme.paper} 20%, transparent)` }}
        >
          <p className="font-serif text-lg" style={{ color: theme.paper }}>
            A Dictionary of Color Combinations
          </p>
          <p
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: theme.paper, opacity: 0.7 }}
          >
            After Wada Sanzo, 1930 · CMYK preserved · rendered in OKLCH
          </p>
        </div>
      </div>
    </footer>
  )
}
