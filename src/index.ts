//@ts-ignore
import html from "bundle-text:./index-body.html"

export function takeover() {
  document.title = "pdf-template"
  document.body.innerHTML = html
}
