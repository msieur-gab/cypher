/**
 * NEXUS Desktop Icon Component
 * Clickable shortcut with icon and label
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusDesktopIcon extends LitElement {
  static properties = {
    icon: { type: String },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: inline-flex;
    }

    .desktop-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-xs, 0.25rem);
      cursor: pointer;
      width: 80px;
      background: none;
      border: none;
      padding: 0;
      font-family: var(--nx-font, monospace);
    }

    :host([disabled]) .desktop-icon {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Icon visual area */
    .icon-visual {
      padding: var(--nx-sm, 0.5rem);
      border: var(--nx-thin, 1px) solid transparent;
      color: var(--nx-primary, #00FFCC);
      transition: all 0.15s;
    }

    .icon-visual svg {
      width: 40px;
      height: 40px;
      display: block;
    }

    .desktop-icon:hover .icon-visual {
      border-color: var(--nx-primary-dim, #00CCAA);
      box-shadow: var(--nx-glow);
    }

    .desktop-icon:active .icon-visual {
      background: var(--nx-primary, #00FFCC);
      color: var(--nx-bg, #000);
    }

    :host([disabled]) .desktop-icon:hover .icon-visual {
      border-color: transparent;
      box-shadow: none;
    }

    /* Label with dither shadow */
    .label-wrap {
      position: relative;
    }

    .label-shadow {
      position: absolute;
      top: 3px;
      left: 3px;
      right: -3px;
      bottom: -3px;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0.5;
      z-index: -1;
    }

    .label {
      position: relative;
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      font-size: 9px;
      font-weight: bold;
      padding: 2px 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-primary, #00FFCC);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    this.icon = '';
    this.label = '';
    this.disabled = false;
  }

  _handleClick() {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent('icon-click', {
      bubbles: true,
      composed: true,
      detail: { icon: this }
    }));
  }

  _handleDblClick() {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent('icon-open', {
      bubbles: true,
      composed: true,
      detail: { icon: this }
    }));
  }

  _renderIcon() {
    if (this.icon && icons[this.icon]) {
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">${icons[this.icon]}</svg>`;
    }
    return html`<slot name="icon"></slot>`;
  }

  render() {
    return html`
      <button
        class="desktop-icon"
        @click=${this._handleClick}
        @dblclick=${this._handleDblClick}
        ?disabled=${this.disabled}
        aria-label=${this.label || 'Desktop icon'}
      >
        <span class="icon-visual">
          ${this._renderIcon()}
        </span>
        ${this.label ? html`
          <span class="label-wrap">
            <span class="label-shadow"></span>
            <span class="label">${this.label}</span>
          </span>
        ` : null}
      </button>
    `;
  }
}

customElements.define('nexus-desktop-icon', NexusDesktopIcon);
