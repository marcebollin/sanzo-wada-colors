import { createRootRoute, Outlet } from "@tanstack/react-router"
import { lazy, Suspense } from "react"

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
    <>
      <Outlet />
      {Agentation && (
        <Suspense fallback={null}>
          <Agentation endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </>
  )
}
