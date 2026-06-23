import { aboutRoute } from "./routes/about"
import { indexRoute } from "./routes/index"
import { rootRoute } from "./routes/root"

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])
