/**
 * NEXUS Toolbar Component
 * Horizontal bar with start, center, and end slots
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusToolbar extends LitElement {
  static properties = {
    variant: { type: String, reflect: true }, // 'default' | 'transparent'
  };

  static styles = css`
    :host {
      display: block;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--toolbar-height, 40px);
      padding: 0 var(--nx-md, 1rem);
      background: var(--nx-bg, #000);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
      font-family: var(--nx-font, monospace);
    }

    :host([variant="transparent"]) .toolbar {
      background: transparent;
      border-bottom: none;
    }

    /* Sections */
    .start,
    .center,
    .end {
      display: flex;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
    }

    .start {
      justify-content: flex-start;
    }

    .center {
      justify-content: center;
      flex: 1;
    }

    .end {
      justify-content: flex-end;
    }

    /* Slot styling */
    ::slotted(*) {
      font-family: var(--nx-font, monospace);
    }

    ::slotted(.toolbar-title) {
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-primary, #00FFCC);
      text-shadow: var(--nx-glow);
    }

    ::slotted(.toolbar-status) {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Separator utility */
    ::slotted(.separator) {
      width: 1px;
      height: 16px;
      background: var(--nx-border, #333);
      margin: 0 var(--nx-sm, 0.5rem);
    }
  `;

  constructor() {
    super();
    this.variant = 'default';
  }

  render() {
    return html`
      <div class="toolbar" part="toolbar">
        <div class="start">
          <slot name="start"></slot>
        </div>
        <div class="center">
          <slot></slot>
        </div>
        <div class="end">
          <slot name="end"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('nexus-toolbar', NexusToolbar);
