//@ts-ignore
import html from "bundle-text:./about-body.html"

export function takeover() {
  document.body.innerHTML = html
}
