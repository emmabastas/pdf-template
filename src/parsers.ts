import * as v from 'ts-json-validator';
import type { TsType } from "ts-json-validator"

export const validatingParse = v.validatingParse

// Templates as stored in localstorage

export const templateDocumentParser = v.obj({
  "name": v.str,
  "typstSource": v.str
})

export const templateDocumentsParser = v.arr(templateDocumentParser)

export type TemplateDocument = TsType<typeof templateDocumentParser>

// Typst queries on templates

export const fieldParser = v.obj({
  "type": v.literal("text" as const),
  "name": v.str,
  "description": v.union(v.str, v.literal(null)),
  "default": v.union(v.str, v.literal(null)),
})

export const typstFieldQueryParser = v.arr(
  v.obj({
    "func": v.literal("metadata" as const),
    "label": v.literal("<pdf-template-field>" as const),
    "value": fieldParser,
  })
)

export type Field = TsType<typeof fieldParser>
