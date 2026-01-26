/**
 * NEXUS List Item Component
 * Single row with icon, label, meta, and selection state
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusListItem extends LitElement {
  static properties = {
    icon: { type: String },
    label: { type: String },
    meta: { type: String },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    .item {
      display: flex;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      cursor: pointer;
      border-left: 2px solid transparent;
      position: relative;
      transition: border-color var(--nx-transition, 0.15s);
    }

    /* Dither hover overlay */
    .item::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.1s;
      pointer-events: none;
    }

    .item:hover::before {
      opacity: 0.15;
    }

    /* Selected state */
    :host([selected]) .item {
      border-left-color: var(--nx-primary, #00FFCC);
    }

    :host([selected]) .item::before {
      opacity: 0.25;
    }

    :host([selected]) .label {
      color: var(--nx-primary, #00FFCC);
    }

    /* Disabled state */
    :host([disabled]) .item {
      opacity: 0.4;
      cursor: not-allowed;
    }

    :host([disabled]) .item::before {
      display: none;
    }

    /* Icon */
    .icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--nx-primary, #00FFCC);
      flex-shrink: 0;
      opacity: 0.7;
      position: relative;
    }

    .icon svg {
      width: 16px;
      height: 16px;
    }

    .item:hover .icon,
    :host([selected]) .icon {
      opacity: 1;
    }

    /* Content */
    .content {
      flex: 1;
      min-width: 0;
      position: relative;
    }

    .label {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-base, 0.875rem);
      color: var(--nx-fg-dim, #888);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-muted, #555);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Trailing slot */
    .trailing {
      flex-shrink: 0;
      position: relative;
    }
  `;

  constructor() {
    super();
    this.icon = '';
    this.label = '';
    this.meta = '';
    this.selected = false;
    this.disabled = false;
  }

  _handleClick() {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent('item-click', {
      bubbles: true,
      composed: true,
      detail: { item: this }
    }));
  }

  _renderIcon() {
    if (!this.icon || !icons[this.icon]) {
      return html`<slot name="icon"></slot>`;
    }
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[this.icon]}</svg>`;
  }

  render() {
    return html`
      <div class="item" @click=${this._handleClick}>
        <div class="icon">
          ${this._renderIcon()}
        </div>
        <div class="content">
          <div class="label">${this.label}<slot></slot></div>
          ${this.meta ? html`<div class="meta">${this.meta}</div>` : null}
        </div>
        <div class="trailing">
          <slot name="trailing"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('nexus-list-item', NexusListItem);
