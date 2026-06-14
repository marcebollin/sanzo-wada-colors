import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  combinations,
  getCombinationColors,
  type SanzoCombination,
} from "../data"
import { buildTheme, type PaletteTheme } from "../lib/palette-theme"

type PaletteContextValue = {
  combination: SanzoCombination
  combinations: SanzoCombination[]
  theme: PaletteTheme
  select: (id: number) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(combinations[0]?.id ?? 1)

  const value = useMemo<PaletteContextValue>(() => {
    const combination =
      combinations.find((c) => c.id === activeId) ?? combinations[0]
    const palette = getCombinationColors(combination)
    return {
      combination,
      combinations,
      theme: buildTheme(palette),
      select: setActiveId,
    }
  }, [activeId])

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  )
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error("usePalette must be used within a PaletteProvider")
  return ctx
}
