/**
 * NEXUS Dock Component
 * Bottom navigation bar with app shortcuts
 * Responsive: adapts to mobile/desktop
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusDock extends LitElement {
  static properties = {
    position: { type: String, reflect: true }, // 'bottom' | 'float'
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      pointer-events: none;
    }

    :host([position="float"]) {
      bottom: var(--nx-lg, 1.5rem);
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }

    .dock {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--nx-sm, 0.5rem);
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      background: var(--nx-bg-overlay, rgba(0, 0, 0, 0.9));
      border-top: var(--nx-thin, 1px) solid var(--nx-border, #333);
      backdrop-filter: blur(10px);
      pointer-events: auto;
    }

    :host([position="float"]) .dock {
      border: var(--nx-thin, 1px) solid var(--nx-primary-dim, rgba(0, 255, 204, 0.3));
      border-radius: 8px;
      box-shadow: 0 0 30px var(--nx-primary-glow, rgba(0, 255, 204, 0.15));
      backdrop-filter: blur(20px);
    }

    /* Dock items */
    ::slotted(nexus-dock-item),
    ::slotted(button) {
      flex-shrink: 0;
    }

    /* Separator */
    .separator {
      width: 1px;
      height: 32px;
      background: var(--nx-border, #333);
      margin: 0 var(--nx-sm, 0.5rem);
    }

    /* Slots */
    .start,
    .center,
    .end {
      display: flex;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
    }

    .start:not(:empty) + .center::before,
    .center:not(:empty) + .end::before {
      content: '';
      display: block;
      width: 1px;
      height: 32px;
      background: var(--nx-border, #333);
      margin: 0 var(--nx-sm, 0.5rem);
    }

    /* Responsive */
    @media (max-width: 640px) {
      :host([position="float"]) {
        left: var(--nx-sm, 0.5rem);
        right: var(--nx-sm, 0.5rem);
        transform: none;
      }

      .dock {
        justify-content: space-around;
      }
    }
  `;

  constructor() {
    super();
    this.position = 'bottom';
  }

  render() {
    return html`
      <div class="dock" part="dock">
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

customElements.define('nexus-dock', NexusDock);


/**
 * NEXUS Dock Item Component
 * Individual dock button with icon and optional label
 */
export class NexusDockItem extends LitElement {
  static properties = {
    icon: { type: String },
    label: { type: String },
    active: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-width: 48px;
      height: 48px;
      padding: var(--nx-xs, 0.25rem) var(--nx-sm, 0.5rem);
      background: transparent;
      border: var(--nx-thin, 1px) solid var(--nx-primary-dim, rgba(0, 255, 204, 0.2));
      border-radius: 8px;
      color: var(--nx-primary, #00FFCC);
      cursor: pointer;
      position: relative;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
      font-family: var(--nx-font, monospace);
    }

    /* Dither hover */
    .item::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.15s;
      border-radius: var(--nx-radius, 2px);
    }

    .item:hover::before {
      opacity: 0.3;
    }

    .item:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 15px var(--nx-primary-glow);
      border-color: var(--nx-primary-dim, rgba(0, 255, 204, 0.4));
    }

    /* Active state */
    :host([active]) .item {
      border-color: var(--nx-primary, #00FFCC);
    }

    :host([active]) .item::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background: var(--nx-primary, #00FFCC);
      border-radius: 50%;
      box-shadow: var(--nx-glow);
    }

    /* Icon */
    .icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .icon svg,
    ::slotted(svg) {
      width: 22px;
      height: 22px;
    }

    /* Label */
    .label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nx-fg-dim, #888);
      position: relative;
    }

    :host([active]) .label {
      color: var(--nx-primary, #00FFCC);
    }
  `;

  constructor() {
    super();
    this.icon = '';
    this.label = '';
    this.active = false;
  }

  _handleClick() {
    this.dispatchEvent(new CustomEvent('dock-item-click', {
      bubbles: true,
      composed: true,
      detail: { item: this }
    }));
  }

  render() {
    return html`
      <button class="item" @click=${this._handleClick}>
        <div class="icon">
          <slot name="icon"></slot>
        </div>
        ${this.label ? html`<span class="label">${this.label}</span>` : null}
      </button>
    `;
  }
}

customElements.define('nexus-dock-item', NexusDockItem);
