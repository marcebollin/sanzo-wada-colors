import { colors } from "../data"

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-lg">A Dictionary of Color Combinations</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-soft">
            After Wada Sanzo · CMYK preserved · rendered in OKLCH
          </p>
        </div>
        <div className="flex h-2 w-full max-w-xs" aria-hidden="true">
          {colors.map((c) => (
            <div key={c.id} className="flex-1" style={{ backgroundColor: c.oklch }} />
          ))}
        </div>
      </div>
    </footer>
  )
}
