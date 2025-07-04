import * as landing from "./landing"
import * as templates from "./templates"
import * as templatesTemplate from "./templates-template"
import * as about from "./about"
import * as _404 from "./404"

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
    landing.takeover()
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
