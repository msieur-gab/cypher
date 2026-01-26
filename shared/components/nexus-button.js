/**
 * NEXUS Button Component
 * Variants: primary (default), secondary, ghost
 * Sizes: sm, md (default), lg
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    icon: { type: String },
    iconOnly: { type: Boolean, attribute: 'icon-only', reflect: true },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--nx-xs, 0.25rem);

      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-base, 0.875rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      min-height: var(--nx-tap, 32px);
      min-width: var(--nx-tap, 32px);

      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      background: var(--nx-primary, #00FFCC);
      color: var(--nx-bg, #000000);

      cursor: pointer;
      transition: all var(--nx-transition, 0.15s ease);
    }

    /* Hover - dither effect */
    button:hover {
      --dither-color: var(--nx-bg, #000);
      background-image: var(--nx-dither-custom);
      background-size: var(--nx-dither-size);
    }

    button:active {
      transform: translateY(1px);
    }

    button:focus-visible {
      outline: var(--nx-thick, 2px) solid var(--nx-primary, #00FFCC);
      outline-offset: 2px;
    }

    /* Secondary variant */
    :host([variant="secondary"]) button {
      background: transparent;
      color: var(--nx-primary, #00FFCC);
    }

    :host([variant="secondary"]) button:hover {
      --dither-color: var(--nx-bg, #000);
      background: var(--nx-primary, #00FFCC);
      background-image: var(--nx-dither-custom);
      background-size: var(--nx-dither-size);
      color: var(--nx-bg, #000);
    }

    /* Ghost variant */
    :host([variant="ghost"]) button {
      background: transparent;
      border-color: transparent;
      color: var(--nx-fg-dim, #888888);
    }

    :host([variant="ghost"]) button:hover {
      color: var(--nx-primary, #00FFCC);
      background: transparent;
      background-image: none;
    }

    /* Sizes */
    :host([size="sm"]) button {
      font-size: var(--nx-text-sm, 0.75rem);
      padding: var(--nx-xs, 0.25rem) var(--nx-sm, 0.5rem);
      min-height: 24px;
    }

    :host([size="lg"]) button {
      font-size: var(--nx-text-lg, 1rem);
      padding: var(--nx-sm, 0.5rem) var(--nx-lg, 1.5rem);
      min-height: 40px;
    }

    /* Icon only */
    :host([icon-only]) button {
      padding: var(--nx-sm, 0.5rem);
    }

    :host([icon-only][size="sm"]) button {
      padding: var(--nx-xs, 0.25rem);
    }

    :host([icon-only][size="lg"]) button {
      padding: var(--nx-sm, 0.5rem);
    }

    /* Disabled */
    :host([disabled]) button {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Icon */
    svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    :host([size="sm"]) svg {
      width: 14px;
      height: 14px;
    }

    :host([size="lg"]) svg {
      width: 20px;
      height: 20px;
    }
  `;

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.disabled = false;
    this.icon = '';
    this.iconOnly = false;
  }

  _renderIcon() {
    if (!this.icon || !icons[this.icon]) return null;
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[this.icon]}</svg>`;
  }

  render() {
    return html`
      <button ?disabled=${this.disabled} part="button">
        ${this._renderIcon()}
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('nexus-button', NexusButton);
