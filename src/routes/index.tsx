import { createRoute } from "@tanstack/react-router"
import { rootRoute } from "./root"
import { PaletteProvider } from "../components/PaletteContext"
import { Hero } from "../components/Hero"
import { PaletteMatrix } from "../components/PaletteMatrix"
import { ColorGrid } from "../components/ColorGrid"
import { PaletteShowcase } from "../components/PaletteShowcase"
import { SiteFooter } from "../components/SiteFooter"
import { PaletteSwitcher } from "../components/PaletteSwitcher"

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
})

function LandingPage() {
  return (
    <PaletteProvider>
      <main className="min-h-dvh">
        <Hero />
        <PaletteMatrix />
        <ColorGrid />
        <PaletteShowcase />
        <SiteFooter />
      </main>
      <PaletteSwitcher />
    </PaletteProvider>
  )
}
