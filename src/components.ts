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

export class ShortText extends HTMLElement {
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
    const value = this.getAttribute('value') ?? '';
    this.inputElement.placeholder = placeholder;
    this.inputElement.value = value;

    this
      //.attachShadow({ mode: "open" }) Shadow DOM makes tailwind classes not
      //                                available
      .append(this.container)
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'value'];
  }

  get value() {
    return (this.inputElement.value || this.getAttribute("placeholder")) ?? ""
  }

  get label() {
    return this.getAttribute('label') ?? '';
  }
}

let registerd = false
function register() {
  customElements.define('m-row', Row);
  customElements.define('m-col', Col);
  customElements.define('m-short-text', ShortText);
}
if (registerd === false) {
  registerd = true
  register()
}
