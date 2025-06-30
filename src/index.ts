import * as c from "@myriaddreamin/typst-ts-web-compiler"
import * as r from "@myriaddreamin/typst-ts-renderer"
import * as v from 'ts-json-validator';
import type { TsType } from "ts-json-validator"

//@ts-ignore
import pdfTemplateTypstSource from "bundle-text:./pdf-template.typ"

//@ts-ignore
import placeholderTypstSource from "bundle-text:./placeholder.typ"

const fieldParser = v.obj({
    "type": v.literal("text" as const),
    "name": v.str,
    "description": v.opt(v.str),
    "default": v.opt(v.str),
})
const typstFieldQueryParser = v.arr(
  v.obj({
    "func": v.literal("metadata" as const),
    "label": v.literal("<pdf-template-field>" as const),
    "value": fieldParser,
  })
)
type Field = TsType<typeof fieldParser>
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

interface TypstPackageRequest {
  name: string;
  namespace: string;
  version: string;
}
type PackageResolver = (req: TypstPackageRequest) => Promise<Uint8Array|null>

const textFonts = [
    'DejaVuSansMono-Bold.ttf',
    'DejaVuSansMono-BoldOblique.ttf',
    'DejaVuSansMono-Oblique.ttf',
    'DejaVuSansMono.ttf',
    'LibertinusSerif-Bold.otf',
    'LibertinusSerif-BoldItalic.otf',
    'LibertinusSerif-Italic.otf',
    'LibertinusSerif-Regular.otf',
    'LibertinusSerif-Semibold.otf',
    'LibertinusSerif-SemiboldItalic.otf',
    'NewCM10-Bold.otf',
    'NewCM10-BoldItalic.otf',
    'NewCM10-Italic.otf',
    'NewCM10-Regular.otf',
    'NewCMMath-Bold.otf',
    'NewCMMath-Book.otf',
    'NewCMMath-Regular.otf',
];
const textFontsPrefix = "https://cdn.jsdelivr.net/gh/typst/typst-assets@v0.13.1/files/fonts/"

// This class is in charge of loading all the async data we need in as
// nonblocking a maner as feasible.
class Session {
  public readonly fields: Promise<HTMLElement>
  public readonly update1: Promise<HTMLButtonElement>
  public readonly update2: Promise<HTMLButtonElement>

  private renderer: Promise<r.TypstRenderer>
  private fontData: Promise<Uint8Array<ArrayBufferLike>[]>
  private cInitialized: Promise<void>
  private rInitialized: Promise<void>
  private dummyCompiler: Promise<c.TypstCompiler>

  constructor() {
    const cwasmp: Promise<WebAssembly.Module> = WebAssembly.compileStreaming(
      fetch(new URL("../node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm", import.meta.url))
    )

    const rwasmp: Promise<WebAssembly.Module> = WebAssembly.compileStreaming(
      fetch(new URL("../node_modules/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm", import.meta.url))
    )

    this.cInitialized = cwasmp.then(cwasm => {
      const _ = c.initSync({ module: cwasm, })
    })

    this.rInitialized = rwasmp.then(rwasm => {
      const _ = r.initSync({ module: rwasm, })
    })

    this.fontData = Promise.all(
      textFonts.map(async textFont => {
        const resp = await fetch(new URL(textFontsPrefix + textFont))
        const bytes = await resp.bytes()
        return bytes
      })
    )

    this.renderer = this.rInitialized.then(async () => {
      const rbuilder = new r.TypstRendererBuilder()
      const renderer = await rbuilder.build()
      return renderer
    })

    this.dummyCompiler = this.cInitialized.then(async () => {
      const builder = new c.TypstCompilerBuilder()
      for (const data of await this.fontData) {
        await builder.add_raw_font(data)
      }
      const compiler = await builder.build()
      return compiler
    })

    this.fields = waitForElem("#fields-container") as Promise<HTMLElement>
    this.update1 = waitForElem("button#update-btn1") as Promise<HTMLButtonElement>
    this.update2 = waitForElem("button#update-btn2") as Promise<HTMLButtonElement>
  }

  async getRenderer(): Promise<r.TypstRenderer> {
    return this.renderer
  }

  async getDummyCompiler(): Promise<c.TypstCompiler> {
    return this.dummyCompiler
  }

  async getNewCompilerBuilder(): Promise<c.TypstCompilerBuilder> {
    await this.cInitialized
    const builder = new c.TypstCompilerBuilder()
    for (const data of await this.fontData) {
      await builder.add_raw_font(data)
    }
    return builder
  }
}

async function main() {

  const typstSource: string = placeholderTypstSource

  const session = new Session()

  // Create the editor
  waitForElem("#editor-div").then(elem => {
    elem.innerHTML += `
<wc-codemirror mode="typst">
  <script type="wc-content">
  ${typstSource}
  </script>
</wc-codemirror>
`
  });

  // Determine which fields are expected
  // TODO
  (async function() {
    const fields = await getFields(session, typstSource)
    const elements: Node[] = fields.map(field => {
      const elem = document.createElement("p")
      elem.innerHTML = field.name
      return elem
    })

    const fieldsContainer = await session.fields
    fieldsContainer.replaceChildren(...elements)
  })()

  const elem = await waitForElem("#preview")
  const cb = renderCallback.bind(null, session, elem as HTMLElement)
  session.update1.then(btn => btn.addEventListener("click", cb))
  session.update2.then(btn => btn.addEventListener("click", cb))
}

async function getFields(session: Session, typstSource: string): Promise<Field[]> {
  const compiler = await session.getDummyCompiler()
  compiler.add_source("/main.typ", typstSource)
  compiler.add_source("/pdf-template.typ", pdfTemplateTypstSource)
  const fieldsStr = compiler.query("/main.typ", null, "<pdf-template-field>", null)
  const fields: Field[] = (function () {
    const r = v.validatingParse(typstFieldQueryParser, fieldsStr)
    if (typeof r === "undefined") {
      throw new Error("Invalid query result", JSON.parse(fieldsStr))
    }
    return r.map(e => e.value)
  })()
  return fields

  // TODO deduplicate
}

async function renderCallback(
  s: Session,
  renderTarget: HTMLElement,
  _: Event): Promise<void>
{
  const cbuilder = await s.getNewCompilerBuilder()
  await cbuilder.set_package_registry(null, function(...args: any[]) {
    console.log("args", ...args)
    return undefined
  })
  const compiler = await cbuilder.build()

  const source: string = (document.querySelector("wc-codemirror") as any).value
  compiler.add_source("/main.typ", source)
  compiler.add_source("/pdf-template.typ", pdfTemplateTypstSource)

  const artifact = compiler.compile("/main.typ", null, "vector", 0)

  const sessionOptions = new r.CreateSessionOptions()
  sessionOptions.format = "vector"
  sessionOptions.artifact_content = artifact
  const renderer = await s.getRenderer()
  const rsession = renderer.create_session(sessionOptions)

  // Why try-catch? See:
  // https://github.com/Myriad-Dreamin/typst.ts/issues/737
  try {
    renderer.render_svg(rsession, renderTarget)
  } catch (e) {
    if ((e as Error).message !== "unreachable executed") {
      throw e
    }

  }
}

main()

// https://stackoverflow.com/a/61511955
function waitForElem(selector: string): Promise<Element> {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector)!);
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector)!);
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
