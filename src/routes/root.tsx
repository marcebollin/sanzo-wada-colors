import { createRootRoute, Outlet } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { PaletteProvider } from "../components/PaletteContext"
import { PaletteSwitcher } from "../components/PaletteSwitcher"

const Agentation = import.meta.env.DEV
  ? lazy(() =>
      import("agentation").then((module) => ({
        default: module.Agentation,
      })),
    )
  : null

export const rootRoute = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <PaletteProvider>
      <Outlet />
      {/* The switcher and palette state live at the root so they persist across
          route changes — the selected palette stays put when navigating to the
          About page, which is what lets its swatches morph from the Hero. */}
      <PaletteSwitcher />
      {Agentation && (
        <Suspense fallback={null}>
          <Agentation endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </PaletteProvider>
  )
}
