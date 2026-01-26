/**
 * NEXUS Header Component
 * Top application bar with logo, menu, and status areas
 * Responsive: collapses menu on mobile
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusHeader extends LitElement {
  static properties = {
    title: { type: String },
    menuOpen: { type: Boolean, reflect: true, attribute: 'menu-open' },
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
      z-index: 100;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 32px;
      padding: 0 var(--nx-md, 1rem);
      background: var(--nx-bg, #000);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
    }

    /* Logo / Title area */
    .brand {
      display: flex;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--nx-primary, #00FFCC);
      text-shadow: var(--nx-glow);
    }

    .brand svg {
      width: 14px;
      height: 14px;
    }

    /* Menu items - desktop */
    .menu {
      display: flex;
      align-items: center;
      gap: var(--nx-md, 1rem);
    }

    .menu-item {
      position: relative;
      padding: var(--nx-xs, 0.25rem) var(--nx-sm, 0.5rem);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-primary, #00FFCC);
      cursor: pointer;
    }

    .menu-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.1s;
    }

    .menu-item:hover::before {
      opacity: 1;
    }

    .menu-item:hover {
      color: var(--nx-bg, #000);
    }

    /* Status area */
    .status {
      display: flex;
      align-items: center;
      gap: var(--nx-md, 1rem);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
    }

    .separator {
      width: 1px;
      height: 16px;
      background: var(--nx-border, #333);
    }

    /* Mobile menu button */
    .menu-toggle {
      display: none;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      color: var(--nx-primary, #00FFCC);
      cursor: pointer;
      padding: 0;
    }

    .menu-toggle svg {
      width: 20px;
      height: 20px;
    }

    /* Mobile dropdown */
    .mobile-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--nx-bg, #000);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      padding: var(--nx-sm, 0.5rem) 0;
      z-index: 99;
    }

    .mobile-menu .menu-item {
      display: block;
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
    }

    :host([menu-open]) .mobile-menu {
      display: block;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .menu {
        display: none;
      }

      .menu-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mobile-menu {
        /* Shown when menu-open attribute is set */
      }
    }

    @media (min-width: 641px) {
      .mobile-menu {
        display: none !important;
      }
    }
  `;

  constructor() {
    super();
    this.title = 'NEXUS';
    this.menuOpen = false;
  }

  _toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  _closeMenu() {
    this.menuOpen = false;
  }

  _renderIcon(name) {
    if (!icons[name]) return null;
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  }

  render() {
    return html`
      <header class="header">
        <div class="brand">
          <slot name="logo">
            ${this._renderIcon('terminal')}
          </slot>
          <span>${this.title}</span>
        </div>

        <nav class="menu">
          <slot name="menu"></slot>
        </nav>

        <div class="status">
          <slot name="status"></slot>
        </div>

        <button
          class="menu-toggle"
          @click=${this._toggleMenu}
          aria-label="Toggle menu"
        >
          ${this._renderIcon(this.menuOpen ? 'close' : 'menu')}
        </button>
      </header>

      <nav class="mobile-menu" @click=${this._closeMenu}>
        <slot name="menu"></slot>
      </nav>
    `;
  }
}

customElements.define('nexus-header', NexusHeader);
