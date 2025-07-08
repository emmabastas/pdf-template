import * as polyfill from "./polyfill"
import * as components from "./components"
import * as router from "./router"
import * as diagnostics from "./diagnostics"
import { Session } from "./session"

polyfill.initialize()
diagnostics.initialize()
components.initialize()
router.initialize()
Session.instance()
