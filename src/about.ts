//@ts-ignore
import html from "bundle-text:./about.html"

export function takeover() {
  document.title = "pdf-template"
  document.body.innerHTML = html
}
