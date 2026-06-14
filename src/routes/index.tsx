import { createRoute } from "@tanstack/react-router"
import { rootRoute } from "./root"
import { PaletteProvider } from "../components/PaletteContext"
import { Hero } from "../components/Hero"
import { ColorGrid } from "../components/ColorGrid"
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
        <ColorGrid />
      </main>
      <PaletteSwitcher />
    </PaletteProvider>
  )
}
