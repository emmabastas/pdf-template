import * as c from "@myriaddreamin/typst-ts-web-compiler"
import * as r from "@myriaddreamin/typst-ts-renderer"
import { ShortTextField, LongTextField, NumberField } from "./components"
import * as v from "ts-json-validator"
import { typstFieldQueryParser } from "./parsers"
import type { Field } from "./parsers"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import * as ls from "./localstorage"
import * as router from "./router"
import { just, nothing, assert, assertNever, Signal } from "./utils"
import * as utils from "./utils"

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

export async function takeover(documentName: string) {

  const doc = new DOMParser().parseFromString(html, "text/html")
  document.body.replaceChildren(...doc.body.children)

  // See https://github.com/remix-run/history/issues/503
  const newUrl = new URL(window.location.toString())
  newUrl.hash = "#form"
  window.history.replaceState({}, "", newUrl)
  window.location.hash = "#form"

  const session = new Session()

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

  const updateBtn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#update-btn")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

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

  const downloadBtn: HTMLButtonElement = (function () {
    const e = document.querySelector("button#download-btn")
    assert(e instanceof HTMLButtonElement)
    return e as HTMLButtonElement
  })()

  const preview: HTMLElement = (function () {
    const e = document.querySelector("#preview")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const documentNameElem: HTMLElement = (function () {
    const e = document.querySelector("#document-name")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const errorMessageContainer: HTMLElement = (function () {
    const e = document.querySelector("#error-message-container")
    assert(e instanceof HTMLElement)
    return e as HTMLElement
  })()

  const documentNameS = new Signal(documentName)

  const [typstSource, isNew]: [string, boolean] = (function () {
    const doc = ls.getTemplateDocument(documentNameS.getValue())
    if (doc === null) {
      return [placeholderTypstSource, true]
    }
    return [doc.typstSource, false]
  })()

  const isSavedS = new Signal(isNew ? false : true)
  const documentDisplayNameS: Signal<string> = Signal.map2(
    documentNameS,
    isSavedS,
    (name, isSaved) => {
      return (name + (isSaved ? "" : "*"))
    }
  )

  documentDisplayNameS.listen(s => {
    documentNameElem.innerHTML = s
    document.title = s
  })
  documentNameS.listen(s => {
    router.pushStateCosmetic({}, `/templates/${s}` + window.location.hash)
  })

  documentNameS.triggerUpdate()

  saveBtn.addEventListener("click", async () => {
    isSavedS.setValue(true)
    ls.setTemplateDocument({
      name: documentNameS.getValue(),
      typstSource: await getCurrentSource(session),
    })
  })

  saveAsBtn.addEventListener("click", async () => {
    const ans = prompt("Under what name do you want to save the template?")
    if (ans === null) {
      return
    }
    ls.setTemplateDocument({
      name: ans,
      typstSource: await getCurrentSource(session),
    })
    documentNameS.setValue(ans)
    isSavedS.setValue(true)
  })

  downloadBtn.addEventListener("click", async () => {
    if (compilationStatusS.getValue().status === "failure") {
      return
    }
    const pdf = compiler.compile("/main.typ", null, "pdf", 0)
    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = documentNameS.getValue() + '.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  // A signal that is triggered whenever the code is changed.
  // The number is incremented on every change, for bookeåing purpouses only,
  // so that `debounce` works as desired.
  const codeEditS = new Signal<number>(0)

  // Create the editor
  const shadow = editorElem.attachShadow({ mode: "open" })
  const state = EditorState.create({
    doc: typstSource,
    extensions: [
      basicSetup,
      EditorView.updateListener.of(e => {
        if (e.docChanged) {
          codeEditS.setValue(codeEditS.getValue() + 1)
        }
      })
    ],
  });

  const view = new EditorView({
    state,
    parent: shadow,
    root: shadow,
  });
  session.setCodeMirrorInstance(view)

  // Whenever code is changed, the document is no longer saved.
  codeEditS.listen(() => isSavedS.setValue(false))

  const compiler = await (await session.getNewCompilerBuilder()).build()
  compiler.add_source("/main.typ", await getCurrentSource(session))
  compiler.add_source("/pdf-template.typ", pdfTemplateTypstSource)
  compiler.add_source("/pdf-template-field-inputs.json", "{}")
  const incrCompiler = compiler.create_incr_server()
  type CompilationStatus = {
    status: "success",
    fields: Field[],
  } | {
    status: "failure",
    severity: string,
    message: string,
  }
  const compilationStatusS: Signal<CompilationStatus> =
    codeEditS.debounce(500).map(() => {
      compiler.add_source("/main.typ", view.state.doc.toString())

    try {
      const query = compiler.query("/main.typ", null, "<pdf-template-field>", null)
      const fields: Field[] = (function () {
        const validated = v.validatingParse(typstFieldQueryParser, query)
        if (typeof validated === "undefined") {
          throw new Error("Invalid query result", JSON.parse(query))
        }
        return validated.map(e => e.value)
      })()
      return {
        status: "success",
        fields: fields,
      }
    } catch (e) {
      // Is it a typst compiler error? (The errors are strings it's wierd..)
      if (typeof e === "string" && e.startsWith("[SourceDiagnostic { ")) {
        // Parse error string like: [SourceDiagnostic { severity: Error, span: Span(344260882076035), message: "unknown variable: worldd", trace: [], hints: [] }]
        const match = e.match(/\[SourceDiagnostic \{ severity: (\w+), span: Span\((\d+)\), message: "(.*?)", trace: \[(.*?)\], hints: \[(.*?)\] \}\]/)
        if (match) {
          const [_, severity, span, message, trace, hints] = match
          const diagnostic = {
            severity: severity as string,
            span: parseInt(span as string),
            message: message as string,
            trace: trace ? trace.split(",").map(s => s.trim()) : [],
            hints: hints ? hints.split(",").map(s => s.trim()) : []
          }
          return {
            status: "failure",
            severity: diagnostic.severity,
            message: diagnostic.message,
          }
        }
        console.log("Unable to parse error")
        throw e
      }
      throw e
    }
  })

  const fieldsS = compilationStatusS.filterMap([], status => {
    if (status.status === "success") {
      return just(status.fields)
    } else {
      return nothing()
    }
  })

  fieldsS.dedupe(utils.compare).listen(fields => {
    const elements: Node[] = fields.map(field => {
      if (field.type === "shortText") {
        const elem = document.createElement("m-short-text")
        elem.setAttribute("id",`typst-input-${field.name}`)
        elem.setAttribute("label", field.name)
        elem.setAttribute("placeholder", field.default ?? "")
        return elem
      }
      if (field.type === "longText") {
        const elem = document.createElement("m-long-text")
        elem.setAttribute("id",`typst-input-${field.name}`)
        elem.setAttribute("label", field.name)
        elem.setAttribute("placeholder", field.default ?? "")
        return elem
      }
      if (field.type === "number") {
        const elem = document.createElement("m-number")
        elem.setAttribute("id",`typst-input-${field.name}`)
        elem.setAttribute("label", field.name)
        elem.setAttribute("placeholder", field.default ?? "")
        return elem
      }
      throw new Error("Unreachable")
    })
    fieldsElem.replaceChildren(...elements)
  })

  compilationStatusS.listen(async status => {
    if (status.status === "success") {
      preview.style.display = ""
      errorMessageContainer.style.display = "none"

      // Get the values of the fields
      const fieldElems = [...fieldsElem.children]
      const fieldValues: Record<string, string | number | null> = {}
      for (const elem of fieldElems) {
        if (elem instanceof ShortTextField) {
          fieldValues[elem.label] = elem.value
          continue
        }
        if (elem instanceof LongTextField) {
          fieldValues[elem.label] = elem.value
          continue
        }
        if (elem instanceof NumberField) {
          fieldValues[elem.label] = elem.value
          continue
        }
        assertNever(elem)
      }
      compiler.add_source(
        "/pdf-template-field-inputs.json",
        JSON.stringify(fieldValues)
      )

      compiler.incr_compile("/main.typ", null, incrCompiler, 0)

      const artifact = compiler.get_artifact("vector", 0)
      if (typeof artifact === "undefined") {
        throw new Error("Unreachable")
      }

      const sessionOptions = new r.CreateSessionOptions()
      sessionOptions.format = "vector"
      sessionOptions.artifact_content = artifact
      const renderer = await session.getRenderer()
      const rsession = renderer.create_session(sessionOptions)

      // Why try-catch? See:
      // https://github.com/Myriad-Dreamin/typst.ts/issues/737
      try {
        renderer.render_svg(rsession, preview)
      } catch (e) {
        if ((e as Error).message !== "unreachable executed") {
          throw e
        }
      }

      return
    }

    // Failure
    errorMessageContainer.innerHTML = `
    <m-col class="gap-4 grow h-full items-center justify-center">
      <p class="text-lg">❗ ${status.severity} ❗</p>
      <p class="text-md">${status.message}</p>
    </m-col>
    `
    preview.style.display = "none"
    errorMessageContainer.style.display = ""
  })

  compilationStatusS.triggerUpdate()

  // Have user confirm before leaving unsaved changes
  router.addBeforeNavigateCallback(() => {
    if(!isSavedS.getValue()) {
      return "You have unsaved changes! Do you want to leave this page and discard them?"
    }
  })

  updateBtn.addEventListener("click", () => {
    compilationStatusS.triggerUpdate()
  })
}

async function getCurrentSource(session: Session): Promise<string> {
  return (await session.codemirror).state.doc.toString()
}
