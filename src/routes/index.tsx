import { createRoute } from "@tanstack/react-router"
import { rootRoute } from "./root"
import { Hero } from "../components/Hero"
import { ColorGrid } from "../components/ColorGrid"
import { PaletteShowcase } from "../components/PaletteShowcase"
import { SiteFooter } from "../components/SiteFooter"

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-dvh">
      <Hero />
      <ColorGrid />
      <PaletteShowcase />
      <SiteFooter />
    </main>
  )
}
