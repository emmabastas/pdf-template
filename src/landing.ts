//@ts-ignore
import html from "bundle-text:./landing.html"

export function takeover() {
  document.title = "pdf-template"
  document.body.innerHTML = html
}
