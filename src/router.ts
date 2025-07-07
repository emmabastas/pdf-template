import * as index from "./index"
import * as templates from "./templates"
import * as templatesTemplate from "./templates-template"
import * as about from "./about"
import * as _404 from "./404"
import * as utils from "./utils"
import * as dialog from "./dialog"
import * as ls from "./localstorage"

{
  const error = console.log.bind(console)
  globalThis.console.error = (...args) => {
    if((args[0] ?? "").startsWith("panicked at packages\\renderer\\src\\render\\svg.rs:132:18")) {
      console.info("Expected rust panick occured")
      return
    }

    error(...args)

    const data: Record<string, string> = {}
    for (let i = 0; i < args.length; i++) {
      const key = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"][i] ?? "l"
      data[key] = JSON.stringify(args[i]).slice(0, 160)
    }

    dialog.error(data, () => {
      const token = "251fa8a180d44d6cf4fe71026af2096d"

      fetch("https://api.logsnag.com/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          project: "pdf-template",
          channel: "errors",
          event: "console.error",
          icon: "🛑",
          tags: data
        })
      })
    })
  }
}

window.addEventListener("error", function(event: ErrorEvent) {
  utils.assert(event instanceof ErrorEvent)

  event.preventDefault()
  console.info("Uncaught error", event)

  //const data = utils.toDataObj(event) ?? null
  const data = {
    sessionId: ls.sessionId(),
    asString: event.error.toString(),
    eventMessage: event.message,
    errorMessage: event.error?.message,
    lineno: event.lineno,
    colno: event.colno,
    filename: event.filename,
    stack: (event.error?.stack?.toString()).slice(0, 160),
    userAgent: navigator.userAgent,
  }

  dialog.error(data, () => {
    const token = "251fa8a180d44d6cf4fe71026af2096d"

    fetch("https://api.logsnag.com/v1/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        project: "pdf-template",
        channel: "errors",
        event: "error",
        icon: "🛑",
        tags: data
      })
    })
  })
})

window.addEventListener("unhandledrejection", function (event) {
  utils.assert(event instanceof PromiseRejectionEvent)

  event.preventDefault()
  console.info("Promise rejection", event)

  //const data = utils.toDataObj(event) ?? null
  const data = {
    sessionId: ls.sessionId(),
    asString: event.reason?.toString(),
    errorMessage: event.reason?.message,
    lineno: event.reason?.lineNumber,
    colno: event.reason?.columnNumber,
    filename: event.reason?.filename,
    stack: (event.reason?.stack?.toString()).slice(0, 160),
    userAgent: navigator.userAgent,
  }

  dialog.error(data, () => {
    const token = "251fa8a180d44d6cf4fe71026af2096d"

    fetch("https://api.logsnag.com/v1/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        project: "pdf-template",
        channel: "errors",
        event: "unhandled rejection",
        icon: "🛑",
        tags: data
      })
    })
  })
})

;(function () {
  console.log("here")
  if (sessionStorage.getItem("sentPing") !== null) {
    return
  }

  const token = "251fa8a180d44d6cf4fe71026af2096d"
  sessionStorage.setItem("sentPing", "true")
  fetch("https://api.logsnag.com/v1/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      project: "pdf-template",
      channel: "pings",
      event: "ping",
    })
  })
})()


// Listen for popstate event (back/forward navigation)
window.addEventListener('popstate', () => {
  callback();
});

// TODO deprecate window.history.pushState/replaceState
// for custom functions exported from router.ts
// make original push/popState throw an error

// Create a custom event for pushState/replaceState
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
  originalPushState.apply(this, args);
  callback();
};

window.history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  callback();
};

export function pushStateCosmetic(data: any, url: string | URL) {
  originalPushState.apply(window.history, [data, "", url])
}

type BeforeNavigateCallback = (target: Location) => void | string
let beforeNavigateCallbacks: BeforeNavigateCallback[] = []

export function addBeforeNavigateCallback(cb: BeforeNavigateCallback) {
  beforeNavigateCallbacks.push(cb)
}

let prevOrigin : string | null = null
let prevPathname : string | null = null
function callback() {
  if (window.location.origin == prevOrigin
    && window.location.pathname == prevPathname) {
      return
  }

  for (const cb of beforeNavigateCallbacks) {
    const ret = cb(window.location)
    if (typeof ret === "string") {

      const ans = confirm(ret)
      if (ans === false) {
        return // We asked the user if they really wanted to navigate away
               // and they said no.
      }
    }
  }
  beforeNavigateCallbacks = []

  prevOrigin = window.location.origin
  prevPathname = window.location.pathname

  let path = decodeURI(window.location.pathname).split("/").filter(e => e !== "")

  if (path.length === 0) {
    index.takeover()
    return
  }

  if (path.length === 1 && path[0] === "templates") {
    templates.takeover()
    return
  }

  if (path.length === 2 && path[0] === "templates") {
    templatesTemplate.takeover(path[1]!)
    return
  }

  if (path.length === 1 && path[0] === "about") {
    about.takeover()
    return
  }

  _404.takeover()
}

if (document.readyState === "complete") {
  callback()
} else {
  document.addEventListener("DOMContentLoaded", callback)
}
