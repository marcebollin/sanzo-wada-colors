import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
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

  const filtered = useMemo(() => {
    return allCombinations.filter(
      (c) =>
        (sizeFilter == null || c.colorIds.length === sizeFilter) &&
        (colorFilterId == null || c.colorIds.includes(colorFilterId)),
    )
  }, [sizeFilter, colorFilterId])

  // Resolve the themed combination, keeping it inside the filtered set.
  const combination = useMemo(() => {
    const inFiltered = filtered.find((c) => c.id === activeId)
    if (inFiltered) return inFiltered
    return (
      filtered[0] ??
      allCombinations.find((c) => c.id === activeId) ??
      allCombinations[0]
    )
  }, [filtered, activeId])

  // Re-sync the stored id whenever filtering forces a new active palette.
  useEffect(() => {
    if (combination && combination.id !== activeId) setActiveId(combination.id)
  }, [combination, activeId])

  const theme = useMemo(
    () => buildTheme(getCombinationColors(combination)),
    [combination],
  )

  const value = useMemo<PaletteContextValue>(
    () => ({
      combination,
      combinations: allCombinations,
      filtered,
      theme,
      select: setActiveId,
      sizeFilter,
      setSizeFilter: (n) => setSizeFilter((prev) => (prev === n ? null : n)),
      colorFilterId,
      setColorFilter: (id) =>
        setColorFilterId((prev) => (prev === id ? null : id)),
    }),
    [combination, filtered, theme, sizeFilter, colorFilterId],
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
