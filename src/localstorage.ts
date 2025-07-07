import { validatingParse, templateDocumentsParser } from "./parsers"
import type { TemplateDocument } from "./parsers"
import * as utils from "./utils"
import { assert } from "./utils"

export function allTemplateDocuments(): TemplateDocument[] {
  let s = localStorage.getItem("templateDocuments")
  if (s === null) {
    s = "[]"
    localStorage.setItem("templateocuments", s)
  }

  const parsed = validatingParse(templateDocumentsParser, s)

  if (typeof parsed === "undefined") {
    throw new Error("Unexpected format")
  }

  return parsed
}

function overwrite(docs: TemplateDocument[]) {
  localStorage.setItem("templateDocuments", JSON.stringify(docs))
}

export function getTemplateDocument(name: string): TemplateDocument | null {
  const matches = allTemplateDocuments()
    .filter(e => e.name === name)

  if (matches.length === 0) {
    return null
  }

  if (matches.length === 1) {
    return matches[0]!
  }

  throw new Error("matches.length is not 0 or 1")
}

export function setTemplateDocument(doc: TemplateDocument) {
  const all = allTemplateDocuments()
    .filter(e => e.name !== doc.name)
  all.push(doc)
  overwrite(all)
}

export function deleteTemplateDocument(name: string, prompt?: boolean) {
  utils.assert(getTemplateDocument(name) !== null)

  if (prompt === false) {
      const filtered = allTemplateDocuments().filter(d => d.name !== name)
      overwrite(filtered)
  } else {
    const ans = confirm(`Are you sure you want to delete ${name}? Once deleted it cannot be undone!`)
    if (ans) {
      const filtered = allTemplateDocuments().filter(d => d.name !== name)
      overwrite(filtered)
    }
  }
}

type Diagnostics = "ask" | "no" | "yes"
export function getSendDiagnostics(): Diagnostics {
  const s = sessionStorage.getItem("sendDiagnostics")
  if (s === null) {
    return "ask"
  }

  assert(s === "ask" || s === "no" || s === "yes")

  return s as Diagnostics
}

export function setSendDiagnostics(d: Diagnostics) {
  sessionStorage.setItem("sendDiagnostics", d)
}

export function sessionId(): string {
  const s = sessionStorage.getItem("sessionId")
  if (s === null) {
    const id = crypto.randomUUID()
    sessionStorage.setItem("sessionId", id)
    return id
  }
  return s
}
