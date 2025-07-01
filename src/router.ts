import * as landing from "./landing"
import * as templates from "./templates"
import * as templatesTemplate from "./templates-template"

// Listen for popstate event (back/forward navigation)
window.addEventListener('popstate', () => {
  callback();
});

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

let prevOrigin : string | null = null
let prevPathname : string | null = null
function callback() {
  if (window.location.origin == prevOrigin
    && window.location.pathname == prevPathname) {
      return
  }
  prevOrigin = window.location.origin
  prevPathname = window.location.pathname

  let path = window.location.pathname.split("/").filter(e => e !== "")
  console.log(path)

  if (path.length === 0) {
    landing.takeover()
  }

  if (path.length === 1 && path[0] === "templates") {
    templates.takeover()
  }

  if (path.length === 2 && path[0] == "templates") {
    templatesTemplate.takeover()
  }
}

if (document.readyState === "complete") {
  callback()
} else {
  document.addEventListener("DOMContentLoaded", callback)
}
