import { validatingParse, templateDocumentsParser } from "./parsers"
import type { TemplateDocument } from "./parsers"

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
  localStorage.setItem("templateDocuments", JSON.stringify(all))
}
