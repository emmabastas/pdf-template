import type { TemplateDocument } from "./parsers"
import { parseHTML, assert } from "./utils"
import * as utils from "./utils"
import * as ls from "./localstorage"

export class Col extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML += `
    <style>
      :host {
        display: flex;
        flex-direction: column;
      }
    </style>
    <slot></slot>
    `
  }
}

export class Row extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML += `
    <style>
      :host {
        display: flex;
        flex-direction: row;
      }
    </style>
    <slot></slot>
    `
  }
}

export class Divider extends HTMLElement {
  private dividerEl: HTMLDivElement
  private firstContainer: HTMLElement
  private isDragging: boolean = false
  private xOffset: number = 0
  private width: number = 0

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })

    shadow.innerHTML = `
      <style>
        :host > div {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
        }
        .first-container, .second-container {
          height: 100%;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .divider {
          width: 4px;
          margin-left: 8px;
          margin-right: 8px;
          background: #e5e7eb;
          cursor: col-resize;
          transition: background-color 0.2s;
        }
        .divider:hover, .divider.dragging {
          background: #9ca3af;
        }
      </style>
      <div>
        <div class="first-container">
          <slot name="left"></slot>
        </div>
        <div class="divider"></div>
        <div class="second-container">
          <slot name="right"></slot>
        </div>
      </div>
    `

    this.dividerEl = shadow.querySelector('.divider') as HTMLDivElement
    this.firstContainer = shadow.querySelector(".first-container") as HTMLElement

    this.dividerEl.addEventListener('mousedown', this.startDragging.bind(this))
    document.addEventListener('mousemove', this.onDrag.bind(this))
    document.addEventListener('mouseup', this.stopDragging.bind(this))
  }

  private startDragging(e: MouseEvent) {
    this.isDragging = true
    this.xOffset = this.getBoundingClientRect().x
    this.width = this.getBoundingClientRect().width
    this.dividerEl.classList.add('dragging')
  }

  private onDrag(e: MouseEvent) {
    if (!this.isDragging) return

    let x = (e.clientX - this.xOffset)
    x = Math.max(200, x)
    x = Math.min(this.width - 200, x)
    this.firstContainer.style.width = `${x}px`
    this.firstContainer.style.maxWidth = `${x}px`
    this.firstContainer.style.minWidth = `${x}px`
  }

  private stopDragging() {
    this.isDragging = false
    this.dividerEl.classList.remove('dragging')
  }

  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onDrag.bind(this))
    document.removeEventListener('mouseup', this.stopDragging.bind(this))
  }
}


export class Route extends HTMLElement {
  private anchor: HTMLAnchorElement
  constructor() {
    super()
    this.anchor = document.createElement('a')
    this.anchor.innerHTML = "<slot></slot>"
    this.anchor.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      window.history.pushState({}, '', this.anchor.href)
    })
    this
      .attachShadow({ mode: 'open' })
      .appendChild(this.anchor)
  }

  connectedCallback() {
  }

  static get observedAttributes() {
    return ['href']
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'href') {
      this.anchor.href = newValue
    }
  }
}

export class ShortTextField extends HTMLElement {
  private labelElement: HTMLLabelElement
  private inputElement: HTMLInputElement
  private container: HTMLElement

  constructor() {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

    const container = document.createElement('m-col');
    container.className = 'gap-1';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = inputId;
    labelElement.className = 'text-sm font-medium text-gray-700';

    const inputElement = document.createElement('input');
    inputElement.id = inputId;
    inputElement.type = 'text';
    inputElement.className = 'px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base';

    container.appendChild(labelElement);
    container.appendChild(inputElement);

    super();

    this.labelElement = labelElement
    this.inputElement = inputElement;
    this.container = container;
  }

  connectedCallback() {
    const label = this.getAttribute('label') ?? '';
    const placeholder = this.getAttribute('placeholder') ?? '';
    const value = this.getAttribute('value');
    this.labelElement.textContent = label
    this.inputElement.placeholder = placeholder;
    this.inputElement.value = value ?? "";

    this
      //.attachShadow({ mode: "open" }) Shadow DOM makes tailwind classes not
      //                                available
      .append(this.container)
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'value'];
  }

  get value(): string | null {
    return (this.inputElement.value || this.getAttribute("placeholder"))
  }

  get label() {
    return this.getAttribute('label') ?? '';
  }
}

export class LongTextField extends HTMLElement {
  private labelElement: HTMLLabelElement
  private textareaElement: HTMLTextAreaElement
  private container: HTMLElement

  constructor() {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

    const container = document.createElement('m-col');
    container.className = 'gap-1';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = inputId;
    labelElement.className = 'text-sm font-medium text-gray-700';

    const textareaElement = document.createElement('textarea');
    textareaElement.id = inputId;
    textareaElement.className = 'px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base';
    textareaElement.rows = 1;
    textareaElement.style.resize = 'vertical';
    textareaElement.style.minHeight = '42px'; // Match single line height
    textareaElement.style.maxHeight = '170px'; // Approximately 5 lines for auto-expansion

    // Auto-expand logic
    textareaElement.addEventListener('input', () => {
      textareaElement.style.height = '42px'; // Reset height
      const scrollHeight = textareaElement.scrollHeight;
      textareaElement.style.height = Math.min(scrollHeight, 170) + 'px';
    });

    container.appendChild(labelElement);
    container.appendChild(textareaElement);

    super();

    this.labelElement = labelElement
    this.textareaElement = textareaElement;
    this.container = container;
  }

  connectedCallback() {
    const label = this.getAttribute('label') ?? '';
    const placeholder = this.getAttribute('placeholder') ?? '';
    const value = this.getAttribute('value');
    this.labelElement.textContent = label
    this.textareaElement.placeholder = placeholder;
    this.textareaElement.value = value ?? "";

    // Trigger initial height calculation
    const event = new Event('input');
    this.textareaElement.dispatchEvent(event);

    this.append(this.container)
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'value'];
  }

  get value(): string | null {
    return (this.textareaElement.value || this.getAttribute("placeholder"))
  }

  get label() {
    return this.getAttribute('label') ?? '';
  }
}


export class NumberField extends HTMLElement {
  private labelElement: HTMLLabelElement
  private inputElement: HTMLInputElement
  private container: HTMLElement

  constructor() {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

    const container = document.createElement('m-col');
    container.className = 'gap-1';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = inputId;
    labelElement.className = 'text-sm font-medium text-gray-700';

    const inputElement = document.createElement('input');
    inputElement.id = inputId;
    inputElement.type = 'number';
    inputElement.className = 'px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base';

    container.appendChild(labelElement);
    container.appendChild(inputElement);

    super();

    this.labelElement = labelElement
    this.inputElement = inputElement;
    this.container = container;
  }

  connectedCallback() {
    const label = this.getAttribute('label') ?? '';
    const placeholder = this.getAttribute('placeholder') ?? '';
    const value = this.getAttribute('value') ?? '';
    this.labelElement.textContent = label;
    this.inputElement.placeholder = placeholder;
    this.inputElement.value = value;

    this.append(this.container)
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'value'];
  }

  get value(): number | null {
    const rawValue = this.inputElement.value || this.getAttribute("placeholder");
    if (!rawValue) return null;

    const num = Number(rawValue);
    return isNaN(num) ? null : num;
  }

  get label() {
    return this.getAttribute('label') ?? '';
  }
}

export class TemplateItem extends HTMLElement {
  private static template = parseHTML(`
<m-row class="gap-8 justify-between">
  <m-route class="text-lg"></m-route>
  <m-row class="gap-2">
    <button class="rounded hover:bg-gray-200">
        <m-icon-rename alt-text="Rename"/>
    </button>
    <button class="rounded hover:bg-gray-200">
        <m-icon-duplicate alt-text="Duplicate"/>
    </button>
    <button class="rounded hover:bg-gray-200">
        <m-icon-download alt-text="Download"/>
    </button>
    <button class="rounded hover:bg-gray-200">
        <m-icon-trash alt-text="Delete"/>
    </button>
  </m-row>
</m-row>`)

  private root: HTMLElement
  private route: Route
  private renameButton: HTMLElement
  private downloadButton: HTMLButtonElement
  private duplicateButton: HTMLButtonElement
  private deleteButton: HTMLButtonElement

  constructor() {
    super()

    this.root = document.importNode(TemplateItem.template, true)
    this.route = this.root.getElementsByTagName("m-route")[0]! as Route

    const [
      renameButton,
      duplicateButton,
      downloadButton,
      deleteButton
    ] = (this.root.getElementsByTagName("button") as unknown) as HTMLButtonElement[]

    this.renameButton = renameButton!
    this.duplicateButton = duplicateButton!
    this.downloadButton = downloadButton!
    this.deleteButton = deleteButton!
  }

  connectedCallback() {
    this.replaceChildren(this.root)
  }

  set templateDocument(templateDocument: TemplateDocument) {
    this.route.innerHTML = templateDocument.name
    this.route.setAttribute("href", `/templates/${templateDocument.name}`)

    this.renameButton.addEventListener("click", () => {
      const ans = prompt("Rename to what?")
      if (ans === null) {
        return
      }
      this.dispatchEvent(new CustomEvent("rename", {
        bubbles: true,
        composed: true,
        detail: {
          newName: ans,
        }
      }))
    })

    this.duplicateButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("duplicate", {
        bubbles: true,
        composed: true,
      }))
    })

    this.downloadButton.addEventListener("click", () => {
      const blob = new Blob([templateDocument.typstSource], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateDocument.name}.typ`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })

    this.deleteButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("delete", {
        bubbles: true,
        composed: true,
      }))
    })
  }
}

export class SVGIcon extends HTMLElement {
  private svg: SVGElement
  private static tooltipTemplate = parseHTML(`
  <span role="tooltip" style="opacity: 0; transition-delay: 900ms" class="hidden absolute group-hover:flex -top-2 -translate-y-full px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm transition-opacity">
</span>
`)

  constructor(svg_: SVGElement | string) {
    const svg = (function() {
      if (typeof svg_ === "string") {
        const doc = (new DOMParser ())
          .parseFromString(svg_, "image/svg+xml");
        assert(doc.documentElement instanceof SVGElement)
        return (doc.documentElement as unknown) as SVGElement

      }
      return svg_
    })()

    super()
    this.svg = svg
  }

  static get observedAttributes() {
    return ['alt-text', 'decorative'];
  }

  connectedCallback() {
    const altText = this.getAttribute("alt-text")
    const decorative = this.hasAttribute("decorative")

    if (altText !== null) {
      const title = document.createElement("title")
      title.innerHTML = altText
      this.svg.appendChild(title)
    }

    if (decorative) {
      this.svg.setAttribute("aria-hidden", "true")
    } else {
      this.svg.setAttribute("role", "img")
    }

    if (!decorative && altText !== null) {
      const tooltip = document.importNode(SVGIcon.tooltipTemplate, true)
      tooltip.innerHTML = altText
      this.classList.add("relative")
      this.appendChild(tooltip)
      this.addEventListener("mouseover", () => {
        tooltip.classList.remove("hidden")
        setTimeout(() => tooltip.style.opacity = "1", 0)
      })
      this.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden")
        tooltip.style.opacity = "0"
      })
      tooltip.style.left = `-${tooltip.getBoundingClientRect().width / 2}px`
    }

    this.appendChild(this.svg)
  }
}

// https://css.gg/icon/trash
export class IconTrash extends SVGIcon {
  constructor() {
    super(`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z"
    fill="currentColor"
  />
  <path d="M9 9H11V17H9V9Z" fill="currentColor" />
  <path d="M13 9H15V17H13V9Z" fill="currentColor" />
</svg>`)
  }
}

// https://css.gg/icon/rename
export class IconRename extends SVGIcon {
  constructor() {
    super(`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M10 4H8V6H5C3.34315 6 2 7.34315 2 9V15C2 16.6569 3.34315 18 5 18H8V20H10V4ZM8 8V16H5C4.44772 16 4 15.5523 4 15V9C4 8.44772 4.44772 8 5 8H8Z"
    fill="currentColor"
  />
  <path
    d="M19 16H12V18H19C20.6569 18 22 16.6569 22 15V9C22 7.34315 20.6569 6 19 6H12V8H19C19.5523 8 20 8.44771 20 9V15C20 15.5523 19.5523 16 19 16Z"
    fill="currentColor"
  />
</svg>`)
  }
}

// https://css.gg/icon/duplicate
export class IconDuplicate extends SVGIcon {
  constructor() {
    super(`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M19 5H7V3H21V17H19V5Z" fill="currentColor" />
  <path d="M9 13V11H11V13H13V15H11V17H9V15H7V13H9Z" fill="currentColor" />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M3 7H17V21H3V7ZM5 9H15V19H5V9Z"
    fill="currentColor"
  />
</svg>`)
  }
}

// https://css.gg/icon/push-down
export class IconDownload extends SVGIcon {
  constructor() {
    super(`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M11.0001 1H13.0001V15.4853L16.2428 12.2427L17.657 13.6569L12.0001 19.3137L6.34326 13.6569L7.75748 12.2427L11.0001 15.4853V1Z"
    fill="currentColor"
  />
  <path d="M18 20.2877H6V22.2877H18V20.2877Z" fill="currentColor" />
</svg>`)
  }
}

let registerd = false
function register() {
  customElements.define('m-row', Row);
  customElements.define('m-col', Col);
  customElements.define('m-route', Route);
  customElements.define('m-divider', Divider);
  customElements.define('m-short-text', ShortTextField);
  customElements.define('m-long-text', LongTextField);
  customElements.define('m-number', NumberField);
  customElements.define('m-template-item', TemplateItem);
  customElements.define("m-icon-trash", IconTrash)
  customElements.define("m-icon-rename", IconRename)
  customElements.define("m-icon-duplicate", IconDuplicate)
  customElements.define("m-icon-download", IconDownload)
}
if (registerd === false) {
  registerd = true
  register()
}
