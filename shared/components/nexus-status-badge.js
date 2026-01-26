/**
 * NEXUS Status Badge Component
 * Connection status indicator with variants
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusStatusBadge extends LitElement {
  static properties = {
    status: { type: String, reflect: true }, // 'online' | 'offline' | 'connecting' | 'error' | 'warning'
    label: { type: String },
    pulse: { type: Boolean, reflect: true },
    size: { type: String }, // 'sm' | 'md' | 'lg'
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--nx-xs, 0.25rem);
      font-family: var(--nx-font, monospace);
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--nx-fg-muted, #666);
      flex-shrink: 0;
    }

    /* Size variants */
    :host([size="sm"]) .indicator { width: 6px; height: 6px; }
    :host([size="lg"]) .indicator { width: 10px; height: 10px; }

    /* Status colors */
    :host([status="online"]) .indicator {
      background: var(--nx-primary, #00FFCC);
      box-shadow: 0 0 8px var(--nx-primary, #00FFCC);
    }

    :host([status="offline"]) .indicator {
      background: var(--nx-fg-muted, #666);
    }

    :host([status="connecting"]) .indicator {
      background: #ffd43b;
      box-shadow: 0 0 8px rgba(255, 212, 59, 0.5);
    }

    :host([status="error"]) .indicator {
      background: #ff6b6b;
      box-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
    }

    :host([status="warning"]) .indicator {
      background: #ffa94d;
      box-shadow: 0 0 8px rgba(255, 169, 77, 0.5);
    }

    /* Pulse animation */
    :host([pulse]) .indicator {
      animation: pulse 2s infinite;
    }

    :host([status="connecting"]) .indicator {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.9); }
    }

    /* Label */
    .label {
      font-size: var(--nx-text-sm, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nx-fg-dim, #888);
    }

    :host([status="online"]) .label {
      color: var(--nx-primary, #00FFCC);
    }

    :host([status="error"]) .label {
      color: #ff6b6b;
    }

    :host([status="warning"]) .label {
      color: #ffa94d;
    }

    :host([status="connecting"]) .label {
      color: #ffd43b;
    }

    /* Size variants for label */
    :host([size="sm"]) .label {
      font-size: 10px;
    }

    :host([size="lg"]) .label {
      font-size: var(--nx-text-base, 0.875rem);
    }

    /* Badge variant (with border) */
    :host([variant="badge"]) {
      padding: var(--nx-xs, 0.25rem) var(--nx-sm, 0.5rem);
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
      background: var(--nx-bg, #000);
    }

    :host([variant="badge"][status="online"]) {
      border-color: var(--nx-primary-dim, rgba(0, 255, 204, 0.3));
    }

    :host([variant="badge"][status="error"]) {
      border-color: rgba(255, 107, 107, 0.3);
    }
  `;

  constructor() {
    super();
    this.status = 'offline';
    this.label = '';
    this.pulse = false;
    this.size = 'md';
  }

  _getDefaultLabel() {
    const labels = {
      online: 'Online',
      offline: 'Offline',
      connecting: 'Connecting...',
      error: 'Error',
      warning: 'Warning'
    };
    return labels[this.status] || this.status;
  }

  render() {
    return html`
      <span class="indicator"></span>
      ${this.label !== '' ? html`
        <span class="label">${this.label || this._getDefaultLabel()}</span>
      ` : null}
    `;
  }
}

customElements.define('nexus-status-badge', NexusStatusBadge);
