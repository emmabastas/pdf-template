//@ts-ignore
import html from "bundle-text:./templates-body.html"
import * as ls from "./localstorage"
import type { TemplateDocument } from "./parsers"
import type { TemplateItem } from "./components"
function assert(cond: boolean) {
  if (!cond) {
    throw new Error("Assertion failed")
  }
}

function updateItems() {
  const scroll = window.scrollY
  takeover()
  window.scrollTo(0, scroll)
}

export function takeover() {
  document.title = "templates"

  const doc = new DOMParser().parseFromString(html, "text/html")

  const templateList: HTMLElement = (function () {
    const e = doc.querySelector("#template-list")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const newBtn: HTMLButtonElement = (function () {
    const e = doc.querySelector("#new-btn")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  document.body.replaceChildren(...doc.body.childNodes)

  const templateDocuments: TemplateDocument[] = ls.allTemplateDocuments()
  const templateItems = templateDocuments
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => {
      const e = document.createElement("m-template-item") as TemplateItem
      e.templateDocument = item

      e.addEventListener("rename", (evt) => {
        const newName: string = (evt as any).detail.newName
        assert(typeof newName === "string")
        if (ls.getTemplateDocument(newName) !== null) {
          alert(`${newName} already exists! Not renaming.`)
          return
        }
        ls.deleteTemplateDocument(item.name, false)
        ls.setTemplateDocument({
          name: newName,
          typstSource: item.typstSource
        })
        updateItems()
      })

      e.addEventListener("duplicate", () => {
        let newName = item.name + "-copy"
        while (true) {
          if (ls.getTemplateDocument(newName) === null) {
            break
          }
          newName += "-copy"
        }
        ls.setTemplateDocument({
          name: newName,
          typstSource: item.typstSource
        })
        updateItems()
      })

      e.addEventListener("delete", () => {
        ls.deleteTemplateDocument(item.name)
        updateItems()
      })

      return e
    })
  templateList.replaceChildren(...templateItems)

  newBtn.addEventListener("click", () => {
    let n = 0
    for (const item of ls.allTemplateDocuments()) {
      try {
        const [s1, s2, s3] = item.name.split("-")
        const k = parseInt(s3!)
        if (s1 == "untitled" && s2 == "document" && k > n) {
          n = k
        }
      }
      catch (_) {
        continue
      }
    }
    const name = `untitled-document-${n + 1}`
    window.history.pushState({}, "", `/templates/${name}`)
  })
}
