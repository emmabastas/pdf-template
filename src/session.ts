import * as c from "@myriaddreamin/typst-ts-web-compiler"
import * as r from "@myriaddreamin/typst-ts-renderer"

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
declare global {
    var sessionInstance: Session | undefined;
}

export class Session {
  private renderer: Promise<r.TypstRenderer>
  private fontData: Promise<Uint8Array<ArrayBufferLike>[]>
  private cInitialized: Promise<void>
  private rInitialized: Promise<void>

  private constructor() {
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
        const url = new URL(textFontsPrefix + textFont)
        const resp = await fetch(url)
        if (!resp.ok) {
          throw new Error(`${url} failed with ${resp.status} ${resp.statusText}`)
        }
        const bytes = await resp.bytes()
        return bytes
      })
    )

    this.renderer = this.rInitialized.then(async () => {
      const rbuilder = new r.TypstRendererBuilder()
      const renderer = await rbuilder.build()
      return renderer
    })
  }

  static instance(): Session {
    if (typeof globalThis.sessionInstance !== "undefined") {
      return globalThis.sessionInstance
    }
    globalThis.sessionInstance = new Session()
    return globalThis.sessionInstance
  }

  async createSessionOptions(): Promise<r.CreateSessionOptions> {
    await this.rInitialized
    return new r.CreateSessionOptions()
  }

  async getRenderer(): Promise<r.TypstRenderer> {
    return this.renderer
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
