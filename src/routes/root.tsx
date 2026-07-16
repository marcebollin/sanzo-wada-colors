import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { PageHeader } from "../components/PageHeader"
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
  const isHome = useRouterState({
    select: (state) => state.location.pathname === "/",
  })

  return (
    <PaletteProvider>
      {!isHome && <PageHeader />}
      <Outlet />
      {/* The switcher and palette state live at the root so they persist across
          route changes. The compact header is also mounted here for every
          non-home route, preserving its navigation and swatch transitions. */}
      <PaletteSwitcher />
      {Agentation && (
        <Suspense fallback={null}>
          <Agentation endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </PaletteProvider>
  )
}
