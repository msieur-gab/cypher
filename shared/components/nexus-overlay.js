/**
 * NEXUS Overlay Component
 * Modal, sheet, and drawer system
 * Variants: modal (center), sheet (bottom), drawer (side)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusOverlay extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true }, // 'modal' | 'sheet' | 'drawer'
    position: { type: String, reflect: true }, // drawer: 'left' | 'right'
    title: { type: String },
    closable: { type: Boolean },
    closeOnBackdrop: { type: Boolean, attribute: 'close-on-backdrop' },
  };

  static styles = css`
    :host {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    :host([open]) {
      display: flex;
    }

    /* Backdrop */
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }

    /* Container positioning */
    .container {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
    }

    /* Modal - centered */
    :host([variant="modal"]) .container {
      align-items: center;
      justify-content: center;
      padding: var(--nx-lg, 1.5rem);
    }

    /* Sheet - bottom */
    :host([variant="sheet"]) .container {
      align-items: flex-end;
    }

    /* Drawer - side */
    :host([variant="drawer"]) .container {
      justify-content: flex-start;
    }

    :host([variant="drawer"][position="right"]) .container {
      justify-content: flex-end;
    }

    /* Panel */
    .panel {
      position: relative;
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      display: flex;
      flex-direction: column;
      max-height: 100%;
      box-shadow: var(--nx-glow-lg);
    }

    /* Panel shadow */
    .panel::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 6px;
      right: -6px;
      bottom: -6px;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0.5;
      z-index: -1;
      pointer-events: none;
    }

    /* Modal panel sizing */
    :host([variant="modal"]) .panel {
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
    }

    /* Sheet panel */
    :host([variant="sheet"]) .panel {
      width: 100%;
      max-height: 80vh;
      border-bottom: none;
      border-left: none;
      border-right: none;
    }

    :host([variant="sheet"]) .panel::before {
      display: none;
    }

    /* Drawer panel */
    :host([variant="drawer"]) .panel {
      width: 320px;
      max-width: 80vw;
      height: 100%;
      border-top: none;
      border-bottom: none;
    }

    :host([variant="drawer"]) .panel::before {
      top: 0;
      bottom: 0;
    }

    :host([variant="drawer"][position="right"]) .panel {
      border-left: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      border-right: none;
    }

    :host([variant="drawer"][position="right"]) .panel::before {
      left: -6px;
      right: 6px;
    }

    /* Header */
    .header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
      background: linear-gradient(180deg, var(--nx-bg-raised, #111) 0%, var(--nx-bg, #000) 100%);
    }

    .title {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-primary, #00FFCC);
      text-shadow: var(--nx-glow);
    }

    .close-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: var(--nx-thin, 1px) solid transparent;
      color: var(--nx-primary, #00FFCC);
      cursor: pointer;
      position: relative;
      padding: 0;
    }

    .close-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.1s;
    }

    .close-btn:hover::before {
      opacity: 1;
    }

    .close-btn:hover {
      color: var(--nx-bg, #000);
      border-color: var(--nx-border, #333);
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
      position: relative;
    }

    /* Body */
    .body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    /* Scrollbar */
    .body::-webkit-scrollbar {
      width: 10px;
    }

    .body::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    .body::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    .body::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }

    /* Footer */
    .footer {
      flex-shrink: 0;
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      border-top: var(--nx-thin, 1px) solid var(--nx-border, #333);
      display: flex;
      justify-content: flex-end;
      gap: var(--nx-sm, 0.5rem);
    }

    .footer:empty {
      display: none;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @keyframes slideLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes slideRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    :host([open]) .backdrop {
      animation: fadeIn 0.2s ease-out;
    }

    :host([variant="modal"][open]) .panel {
      animation: scaleIn 0.2s ease-out;
    }

    :host([variant="sheet"][open]) .panel {
      animation: slideUp 0.3s ease-out;
    }

    :host([variant="drawer"][open]) .panel {
      animation: slideLeft 0.3s ease-out;
    }

    :host([variant="drawer"][position="right"][open]) .panel {
      animation: slideRight 0.3s ease-out;
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.variant = 'modal';
    this.position = 'left';
    this.title = '';
    this.closable = true;
    this.closeOnBackdrop = true;
    this._handleEscape = this._handleEscape.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleEscape);
  }

  _handleEscape(e) {
    if (e.key === 'Escape' && this.open && this.closable) {
      this.close();
    }
  }

  _handleBackdropClick() {
    if (this.closeOnBackdrop && this.closable) {
      this.close();
    }
  }

  // Public API
  show() {
    this.open = true;
    this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  toggle() {
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  }

  render() {
    return html`
      <div class="backdrop" @click=${this._handleBackdropClick}></div>
      <div class="container">
        <div class="panel" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
          ${this.title || this.closable ? html`
            <header class="header">
              <span class="title" id="overlay-title">${this.title}</span>
              ${this.closable ? html`
                <button class="close-btn" @click=${this.close} aria-label="Close">
                  <svg viewBox="0 0 24 24">${icons.close}</svg>
                </button>
              ` : null}
            </header>
          ` : null}
          <div class="body">
            <slot></slot>
          </div>
          <footer class="footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    `;
  }
}

customElements.define('nexus-overlay', NexusOverlay);
