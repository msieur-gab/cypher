/**
 * NEXUS Card Component
 * A bordered container for grouping related information
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusCard extends LitElement {
  static properties = {
    padding: { type: String }, // 'none' | 'sm' | 'md' | 'lg'
    raised: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
      border: var(--nx-thin) solid var(--nx-border);
      background: var(--nx-bg);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    :host([raised]) {
      background: var(--nx-bg-raised);
    }

    :host([padding="none"]) .card { padding: 0; }
    :host([padding="sm"]) .card { padding: var(--nx-sm); }
    :host([padding="md"]) .card { padding: var(--nx-md); }
    :host([padding="lg"]) .card { padding: var(--nx-lg); }

    .card {
      padding: var(--nx-md);
      height: 100%;
      box-sizing: border-box;
    }

    ::slotted([slot="header"]) {
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-xs);
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }

    ::slotted([slot="footer"]) {
      margin-top: var(--nx-md);
      padding-top: var(--nx-sm);
      border-top: var(--nx-thin) solid var(--nx-border);
    }
  `;

  constructor() {
    super();
    this.padding = 'md';
    this.raised = false;
  }

  render() {
    return html`
      <div class="card">
        <slot name="header"></slot>
        <slot></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

customElements.define('nexus-card', NexusCard);
