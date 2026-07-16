import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  combinations as allCombinations,
  getCombinationColors,
  type SanzoCombination,
} from "../data"
import { buildTheme, type PaletteTheme } from "../lib/palette-theme"

type PaletteContextValue = {
  /** The currently themed combination. */
  combination: SanzoCombination
  /** Every combination in the dictionary. */
  combinations: SanzoCombination[]
  /** Combinations after the active filters are applied. */
  filtered: SanzoCombination[]
  theme: PaletteTheme
  select: (id: number) => void
  /** Show only palettes with this many colors (2, 3, 4) — null shows all. */
  sizeFilter: number | null
  setSizeFilter: (n: number | null) => void
  /** Show only palettes containing this color id — null shows all. */
  colorFilterId: number | null
  /** Toggle a single color filter (passing the active id clears it). */
  setColorFilter: (id: number | null) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(allCombinations[0]?.id ?? 1)
  const [sizeFilter, setSizeFilter] = useState<number | null>(null)
  const [colorFilterId, setColorFilterId] = useState<number | null>(null)

  const select = useCallback(
    (id: number) => {
      const next = allCombinations.find((candidate) => candidate.id === id)
      if (
        colorFilterId != null &&
        next != null &&
        !next.colorIds.includes(colorFilterId)
      ) {
        setColorFilterId(null)
      }
      setActiveId(id)
    },
    [colorFilterId],
  )

  const filtered = useMemo(() => {
    return allCombinations.filter(
      (c) =>
        (sizeFilter == null || c.colorIds.length === sizeFilter) &&
        (colorFilterId == null || c.colorIds.includes(colorFilterId)),
    )
  }, [sizeFilter, colorFilterId])

  // When a filter hides the active palette, commit the selection to the first
  // matching palette — so the chosen palette becomes the first of the filtered
  // list, and stays selected even after the filter is cleared.
  useEffect(() => {
    if (filtered.length === 0) return
    if (filtered.some((c) => c.id === activeId)) return
    setActiveId(filtered[0].id)
  }, [filtered, activeId])

  const combination = useMemo(() => {
    const inFiltered = filtered.find((c) => c.id === activeId)
    if (inFiltered) return inFiltered
    return (
      filtered[0] ??
      allCombinations.find((c) => c.id === activeId) ??
      allCombinations[0]
    )
  }, [filtered, activeId])

  const theme = useMemo(
    () => buildTheme(getCombinationColors(combination)),
    [combination],
  )
  const activeThemeVars = useRef<string[]>([])

  useEffect(() => {
    const root = document.documentElement

    for (const name of activeThemeVars.current) {
      root.style.removeProperty(name)
    }

    const names = Object.keys(theme.vars)
    for (const [name, value] of Object.entries(theme.vars)) {
      root.style.setProperty(name, value)
    }
    activeThemeVars.current = names

    return () => {
      for (const name of names) {
        root.style.removeProperty(name)
      }
    }
  }, [theme.vars])

  const value = useMemo<PaletteContextValue>(
    () => ({
      combination,
      combinations: allCombinations,
      filtered,
      theme,
      select,
      sizeFilter,
      setSizeFilter: (n) => setSizeFilter((prev) => (prev === n ? null : n)),
      colorFilterId,
      setColorFilter: (id) =>
        setColorFilterId((prev) => (prev === id ? null : id)),
    }),
    [combination, filtered, theme, select, sizeFilter, colorFilterId],
  )

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  )
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error("usePalette must be used within a PaletteProvider")
  return ctx
}
