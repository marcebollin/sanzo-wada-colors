import { createRoute } from "@tanstack/react-router"
import { ColorGrid } from "../components/ColorGrid"
import { Hero } from "../components/Hero"
import { rootRoute } from "./root"

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
    </main>
  )
}
