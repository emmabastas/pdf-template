import * as c from "@myriaddreamin/typst-ts-web-compiler"
import * as r from "@myriaddreamin/typst-ts-renderer"
import type { ShortText } from "./components"
import * as v from "ts-json-validator"
import { typstFieldQueryParser } from "./parsers"
import type { Field } from "./parsers"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"

//@ts-ignore
import html from "bundle-text:./templates-template.html"

//@ts-ignore
import pdfTemplateTypstSource from "bundle-text:./pdf-template.typ"

//@ts-ignore
import placeholderTypstSource from "bundle-text:./placeholder.typ"
import type { EditorViewConfig } from "@codemirror/view"

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
  public codemirror: Promise<EditorView>
  private cmresolve: (_: EditorView) => void

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
      compiler.add_source("/pdf-template-field-inputs.json", "{}")
      return compiler
    })

    //const documentReady = new Promise<void>(resolve => {
    //  if(document.readyState === "complete") {
    //    resolve()
    //  } else {
    //    document.addEventListener("DOMContentLoaded", () => resolve())
    //  }
    //})
    const documentReady = Promise.resolve()

    this.cmresolve = () => {}
    this.codemirror = new Promise((resolve, _) => {
      this.cmresolve = resolve
    })
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

  setCodeMirrorInstance(view: EditorView) {
    this.cmresolve(view)
  }
}

function assert(cond: boolean) {
  if (!cond) {
    throw new Error("Assertion failed")
  }
}

export async function takeover() {

  document.title = "my-awesome-tempate"

  const doc = new DOMParser().parseFromString(html, "text/html")
  document.body.replaceChildren(...doc.body.children)

  const saveBtn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#save-btn")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  const saveAsBtn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#save-as-btn")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  // See https://github.com/remix-run/history/issues/503
  window.location.hash = "#form"

  const typstSource: string =
        window.localStorage.getItem(["templates", "my-awesome-template"].toString())
        ?? placeholderTypstSource

  const session = new Session()

  saveBtn.addEventListener("click", async () => {
    window.localStorage.setItem(
      ["templates", "my-awesome-template"].toString(),
      await getCurrentSource(session)
    )
  })

  // Assign elements to session using the same pattern as saveBtn
  const editorElem: HTMLElement = (function () {
    const e = document.querySelector("#editor-div")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const fieldsElem: HTMLElement = (function () {
    const e = document.querySelector("#fields-container")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const update1Btn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#update-btn1")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  const update2Btn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#update-btn2")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  const preview: HTMLElement = (function () {
    const e = document.querySelector("#preview")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  // Create the editor
  const shadow = editorElem.attachShadow({ mode: "open" })
  const state = EditorState.create({
    doc: typstSource,
    extensions: [
      basicSetup,
    ],
  });
  const view = new EditorView({
    state,
    parent: shadow,
    root: shadow,
  });
  session.setCodeMirrorInstance(view)

  // Determine which fields are expected
  updateFields(session, fieldsElem)

  // Whenever the "Render" tab is active (i.e. URL fragment is #form), we should upd
  window.addEventListener("hashchange", async () => {
    if (window.location.hash === "#form") {
      try {
        await updateFields(session, fieldsElem)
      } catch (e) {
        // Is it an expected syntax/etc in the typst code?
        if (!(e as Error).toString().startsWith("[SourceDiagnostic")) {
          throw e
        }
        console.log(e)
      }
    }
  })

  const cb = renderCallback.bind(null, session, preview, fieldsElem)
  update1Btn.addEventListener("click", cb)
  update2Btn.addEventListener("click", cb)
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

  // deduplicate
  const deduplicatedFields = fields.filter((field, index, self) =>
    index === self.findIndex((t) => t.name === field.name)
  );
  return deduplicatedFields;
}

async function getCurrentSource(session: Session): Promise<string> {
  return (await session.codemirror).state.doc.toString()
}

async function updateFields(session: Session, fieldsElem: HTMLElement) {
  const fields = await getFields(session, await getCurrentSource(session))
  const elements: Node[] = fields.map(field => {
    const elem = document.createElement("m-short-text")
    elem.setAttribute("id",`typst-input-${field.name}`)
    elem.setAttribute("label", field.name)
    elem.setAttribute("placeholder", field.default ?? "")
    elem.innerHTML = field.name
    return elem
  })

  fieldsElem.replaceChildren(...elements)
}

async function renderCallback(
  s: Session,
  renderTarget: HTMLElement,
  fieldsElem: HTMLElement,
  _: Event): Promise<void>
{
  const cbuilder = await s.getNewCompilerBuilder()
  await cbuilder.set_package_registry(null, function(...args: any[]) {
    console.log("args", ...args)
    return undefined
  })
  const compiler = await cbuilder.build()

  const source = await getCurrentSource(s)
  compiler.add_source("/main.typ", source)
  compiler.add_source("/pdf-template.typ", pdfTemplateTypstSource)

  // Get the values of the fields
  const fieldElems = [...fieldsElem.children]
  const fieldValues: Record<string, string> = {}
  for (const elem of fieldElems) {
    console.log(elem)
    const st = elem as ShortText
    fieldValues[st.label] = st.value
  }
  console.log(fieldValues)
  console.log(`#let json = "${JSON.stringify(fieldValues)}"`)
  compiler.add_source(
    "/pdf-template-field-inputs.json",
    JSON.stringify(fieldValues)
  )

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
