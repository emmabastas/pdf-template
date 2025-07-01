//@ts-ignore
import html from "bundle-text:./templates.html"

export function takeover() {
  document.title = "templates"
  document.body.innerHTML = html
}
