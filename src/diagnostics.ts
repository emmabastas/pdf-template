import * as utils from "./utils"
import * as dialog from "./dialog"
import * as ls from "./localstorage"

const token = "251fa8a180d44d6cf4fe71026af2096d"

export function initialize() {
  globalThis.console.error = consoleErrorOverride
  window.addEventListener("error", onError)
  window.addEventListener("unhandledrejection", onUnhandledRejection)

  if (sessionStorage.getItem("sentPing") === null) {
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
  }
}

function onError(event: ErrorEvent) {
  utils.assert(event instanceof ErrorEvent)

  event.preventDefault()
  console.info("Uncaught error", event)

  //const data = utils.toDataObj(event) ?? null
  const data = {
    sessionId: ls.sessionId(),
    asString: event.error.toString().slice(0, 160),
    eventMessage: event.message?.slice(0, 160),
    errorMessage: event.error?.message?.slice(0, 160),
    lineno: event.lineno,
    colno: event.colno,
    filename: event.filename?.slice(0, 160),
    stack: (event.error?.stack?.toString()).slice(0, 160),
    userAgent: navigator.userAgent.slice(0, 160),
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
}

function onUnhandledRejection(event: PromiseRejectionEvent) {
  utils.assert(event instanceof PromiseRejectionEvent)

  event.preventDefault()
  console.info("Promise rejection", event)

  //const data = utils.toDataObj(event) ?? null
  const data = {
    sessionId: ls.sessionId(),
    asString: event.reason?.toString().slice(0, 160),
    errorMessage: event.reason?.message?.slice(0, 160),
    lineno: event.reason?.lineNumber,
    colno: event.reason?.columnNumber,
    filename: event.reason?.filename?.slice(0, 160),
    stack: (event.reason?.stack?.toString()).slice(0, 160),
    userAgent: navigator.userAgent.slice(0, 160),
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
}

const origConsoleError = console.log.bind(console)
function consoleErrorOverride(...args: any[]) {
  if((args[0] ?? "").startsWith("panicked at packages\\renderer\\src\\render\\svg.rs:132:18")) {
    console.info("Expected rust panick occured")
    return
  }

  origConsoleError(...args)

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
