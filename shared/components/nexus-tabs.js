/**
 * NEXUS Tabs Component
 * Tabbed interface with tab list and panels
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusTabs extends LitElement {
  static properties = {
    selected: { type: Number, reflect: true },
    vertical: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :host([vertical]) {
      flex-direction: row;
    }

    /* Tab list */
    .tab-list {
      display: flex;
      flex-shrink: 0;
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
      background: var(--nx-bg-raised, #111);
    }

    :host([vertical]) .tab-list {
      flex-direction: column;
      border-bottom: none;
      border-right: var(--nx-thin, 1px) solid var(--nx-border, #333);
      min-width: 120px;
    }

    /* Tab */
    .tab {
      position: relative;
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      background: transparent;
      border: none;
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-dim, #888);
      cursor: pointer;
      transition: color 0.15s;
    }

    /* Dither hover */
    .tab::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.1s;
    }

    .tab:hover::before {
      opacity: 0.15;
    }

    .tab:hover {
      color: var(--nx-primary, #00FFCC);
    }

    /* Selected tab */
    .tab.selected {
      color: var(--nx-primary, #00FFCC);
    }

    .tab.selected::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--nx-primary, #00FFCC);
      box-shadow: var(--nx-glow);
    }

    :host([vertical]) .tab.selected::after {
      top: 0;
      bottom: 0;
      left: auto;
      right: 0;
      width: 2px;
      height: auto;
    }

    /* Panels container */
    .panels {
      flex: 1;
      min-height: 0;
      position: relative;
    }

    /* Individual panel */
    ::slotted(nexus-tab-panel) {
      display: none;
      height: 100%;
    }

    ::slotted(nexus-tab-panel[active]) {
      display: block;
    }
  `;

  constructor() {
    super();
    this.selected = 0;
    this.vertical = false;
    this._tabs = [];
    this._panels = [];
  }

  firstUpdated() {
    this._updateTabs();
    this._updatePanels();

    // Listen for slot changes
    const tabSlot = this.shadowRoot.querySelector('slot[name="tab"]');
    const panelSlot = this.shadowRoot.querySelector('slot:not([name])');

    tabSlot?.addEventListener('slotchange', () => this._updateTabs());
    panelSlot?.addEventListener('slotchange', () => this._updatePanels());
  }

  updated(changedProperties) {
    if (changedProperties.has('selected')) {
      this._updatePanelVisibility();
    }
  }

  _updateTabs() {
    const slot = this.shadowRoot.querySelector('slot[name="tab"]');
    this._tabs = slot?.assignedElements() || [];
    this.requestUpdate();
  }

  _updatePanels() {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    this._panels = slot?.assignedElements().filter(
      el => el.tagName === 'NEXUS-TAB-PANEL'
    ) || [];
    this._updatePanelVisibility();
  }

  _updatePanelVisibility() {
    this._panels.forEach((panel, index) => {
      panel.toggleAttribute('active', index === this.selected);
    });
  }

  _selectTab(index) {
    if (index === this.selected) return;

    this.selected = index;
    this.dispatchEvent(new CustomEvent('tab-change', {
      bubbles: true,
      composed: true,
      detail: { index, panel: this._panels[index] }
    }));
  }

  _handleKeydown(e, index) {
    let newIndex = index;

    if (this.vertical) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = Math.min(index + 1, this._tabs.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = Math.max(index - 1, 0);
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = Math.min(index + 1, this._tabs.length - 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = Math.max(index - 1, 0);
      }
    }

    if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = this._tabs.length - 1;
    }

    if (newIndex !== index) {
      this._selectTab(newIndex);
      // Focus the new tab button
      this.shadowRoot.querySelectorAll('.tab')[newIndex]?.focus();
    }
  }

  render() {
    return html`
      <div class="tab-list" role="tablist">
        <slot name="tab" style="display: none;"></slot>
        ${this._tabs.map((tab, index) => html`
          <button
            class="tab ${index === this.selected ? 'selected' : ''}"
            role="tab"
            aria-selected=${index === this.selected}
            tabindex=${index === this.selected ? 0 : -1}
            @click=${() => this._selectTab(index)}
            @keydown=${(e) => this._handleKeydown(e, index)}
          >
            ${tab.textContent}
          </button>
        `)}
      </div>
      <div class="panels">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('nexus-tabs', NexusTabs);


/**
 * NEXUS Tab Panel Component
 * Container for tab content
 */
export class NexusTabPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    :host(:not([active])) {
      display: none;
    }

    /* Scrollbar */
    :host::-webkit-scrollbar {
      width: 10px;
    }

    :host::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    :host::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    :host::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('nexus-tab-panel', NexusTabPanel);
