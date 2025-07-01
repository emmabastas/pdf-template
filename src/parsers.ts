import * as v from 'ts-json-validator';
import type { TsType } from "ts-json-validator"

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

//const fieldParser = new TsjsonParser(
//  S({
//    oneOf: [
//      S({
//        type: "object",
//        properties: {
//          "type": S({ const: "text" }),
//          "name": S({ type: "string" }),
//          "description": S({ type: "string" }),
//          "default": S({ type: "string" }),
//        },
//        required: [ "type", "name" ],
//      })
//    ],
//  }),
//);
//const typstFieldsQueryParser = new TsjsonParser(
//  S({
//    type: "array",
//    items: S({
//      type: "object",
//      properties: {
//        "func": S({ const: "metadata" }),
//        "label": S({ const: "<pdf-template-field>" }),
//        "value": fieldParser.schema,
//      },
//      required: [ "func", "label", "value" ],
//    })
//  })
//);
