import { createRoute } from "@tanstack/react-router"
import { ColorGrid } from "../components/ColorGrid"
import { Hero } from "../components/Hero"
import { PaletteProvider } from "../components/PaletteContext"
import { PaletteSwitcher } from "../components/PaletteSwitcher"
import { rootRoute } from "./root"

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
