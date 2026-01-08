class DBBadge extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'color', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --db-bg: #111827; /* gray-900 */
        --db-fg: #ffffff;
        --db-border: transparent;
        --db-radius: 9999px;
        --db-padding-y: 0.125rem; /* sm */
        --db-padding-x: 0.5rem;
        --db-font-size: 0.75rem; /* 12px */
        --db-font-weight: 600;
        --db-gap: 0.25rem;
        display: inline-block;
      }

      :host([size="sm"]) { --db-padding-y: 0.125rem; --db-padding-x: 0.5rem; --db-font-size: 0.75rem; }
      :host([size="md"]) { --db-padding-y: 0.25rem; --db-padding-x: 0.625rem; --db-font-size: 0.8125rem; }
      :host([size="lg"]) { --db-padding-y: 0.375rem; --db-padding-x: 0.75rem; --db-font-size: 0.875rem; }

      /* Colors */
      :host([color="gray"])   { --db-solid: #111827; --db-soft: #11182718; --db-border-color:#11182733; --db-text: #111827; }
      :host([color="blue"])   { --db-solid: #1d4ed8; --db-soft: #1d4ed818; --db-border-color:#1d4ed833; --db-text: #1d4ed8; }
      :host([color="green"])  { --db-solid: #059669; --db-soft: #05966918; --db-border-color:#05966933; --db-text: #059669; }
      :host([color="red"])    { --db-solid: #dc2626; --db-soft: #dc262618; --db-border-color:#dc262633; --db-text: #dc2626; }
      :host([color="yellow"]) { --db-solid: #ca8a04; --db-soft: #ca8a0418; --db-border-color:#ca8a0433; --db-text: #a16207; }
      :host([color="purple"]) { --db-solid: #6d28d9; --db-soft: #6d28d918; --db-border-color:#6d28d933; --db-text: #6d28d9; }

      /* Variants */
      :host([variant="solid"])   { --db-bg: var(--db-solid, #111827); --db-fg: #fff; --db-border: transparent; }
      :host([variant="soft"])    { --db-bg: var(--db-soft, #11182718); --db-fg: var(--db-text, #111827); --db-border: transparent; }
      :host([variant="outline"]) { --db-bg: transparent; --db-fg: var(--db-text, #111827); --db-border: var(--db-border-color, #11182733); }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--db-gap);
        background: var(--db-bg);
        color: var(--db-fg);
        border: 1px solid var(--db-border);
        border-radius: var(--db-radius);
        padding: var(--db-padding-y) var(--db-padding-x);
        font-size: var(--db-font-size);
        line-height: 1.2;
        font-weight: var(--db-font-weight);
        white-space: nowrap;
      }
      ::slotted(svg), ::slotted(img) { height: 1em; width: 1em; }
    `;
    const wrapper = document.createElement('span');
    wrapper.className = 'badge';
    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    this.shadowRoot.append(style, wrapper);
  }

  connectedCallback() {
    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'soft');
    if (!this.hasAttribute('color')) this.setAttribute('color', 'gray');
    if (!this.hasAttribute('size')) this.setAttribute('size', 'sm');
  }

  attributeChangedCallback() {
    // Styles are attribute-driven; no runtime work needed here.
  }
}

if (!customElements.get('db-badge')) {
  customElements.define('db-badge', DBBadge);
}

export { DBBadge };

