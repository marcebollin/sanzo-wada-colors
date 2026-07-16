import { aboutRoute } from "./routes/about"
import { explorationsRoute } from "./routes/explorations"
import { feelingRoute } from "./routes/feeling"
import { indexRoute } from "./routes/index"
import { rootRoute } from "./routes/root"

export const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  explorationsRoute,
  feelingRoute,
])
