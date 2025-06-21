class Row extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML += `
    <style>
      :host {
        display: flex;
        flex-direction: column;
      }
    </style>
    <slot></slot>
    `;
  }
}

class Col extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML += `
    <style>
      :host {
        display: flex;
        flex-direction: row;
      }
    </style>
    <slot></slot>
    `;
  }
}

customElements.define('m-row', Col);
customElements.define('m-col', Row);
