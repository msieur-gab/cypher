/**
 * NEXUS Toast Component
 * Notification messages that appear temporarily
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusToast extends LitElement {
  static properties = {
    message: { type: String },
    variant: { type: String, reflect: true }, // 'info' | 'success' | 'warning' | 'error'
    duration: { type: Number },
    position: { type: String, reflect: true }, // 'top' | 'bottom'
    visible: { type: Boolean, reflect: true },
    dismissible: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2000;
      pointer-events: none;
    }

    :host([position="top"]) {
      top: var(--nx-lg, 1.5rem);
    }

    :host([position="bottom"]) {
      bottom: var(--nx-lg, 1.5rem);
    }

    .toast {
      display: none;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg, #fff);
      box-shadow: var(--nx-glow);
      pointer-events: auto;
      max-width: 400px;
    }

    :host([visible]) .toast {
      display: flex;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :host([position="bottom"][visible]) .toast {
      animation-name: slideInUp;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Dither shadow */
    .toast::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: -4px;
      bottom: -4px;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0.4;
      z-index: -1;
      pointer-events: none;
    }

    /* Variants */
    :host([variant="success"]) .toast {
      border-color: #69db7c;
      --toast-icon-color: #69db7c;
    }

    :host([variant="warning"]) .toast {
      border-color: #ffd43b;
      --toast-icon-color: #ffd43b;
    }

    :host([variant="error"]) .toast {
      border-color: #ff6b6b;
      --toast-icon-color: #ff6b6b;
    }

    :host([variant="info"]) .toast {
      border-color: var(--nx-primary, #00FFCC);
      --toast-icon-color: var(--nx-primary, #00FFCC);
    }

    /* Icon */
    .icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--toast-icon-color, var(--nx-primary, #00FFCC));
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }

    /* Message */
    .message {
      flex: 1;
    }

    /* Dismiss button */
    .dismiss {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--nx-fg-dim, #888);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .dismiss:hover {
      color: var(--nx-fg, #fff);
    }

    .dismiss svg {
      width: 12px;
      height: 12px;
    }
  `;

  constructor() {
    super();
    this.message = '';
    this.variant = 'info';
    this.duration = 4000;
    this.position = 'top';
    this.visible = false;
    this.dismissible = true;
    this._timeout = null;
  }

  _getIcon() {
    const iconMap = {
      info: icons.info,
      success: icons.check,
      warning: icons.warning,
      error: icons.error,
    };
    return iconMap[this.variant] || icons.info;
  }

  _dismiss() {
    this.hide();
  }

  // Public API
  show(message, options = {}) {
    if (message) this.message = message;
    if (options.variant) this.variant = options.variant;
    if (options.duration !== undefined) this.duration = options.duration;

    // Clear existing timeout
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this.visible = true;

    // Auto-hide after duration (if not 0)
    if (this.duration > 0) {
      this._timeout = setTimeout(() => {
        this.hide();
      }, this.duration);
    }

    this.dispatchEvent(new CustomEvent('show', {
      bubbles: true,
      composed: true
    }));
  }

  hide() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }

    this.visible = false;

    this.dispatchEvent(new CustomEvent('hide', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="toast" role="alert" aria-live="polite">
        <span class="icon">
          <svg viewBox="0 0 24 24">${this._getIcon()}</svg>
        </span>
        <span class="message">${this.message}</span>
        ${this.dismissible ? html`
          <button class="dismiss" @click=${this._dismiss} aria-label="Dismiss">
            <svg viewBox="0 0 24 24">${icons.close}</svg>
          </button>
        ` : null}
      </div>
    `;
  }
}

customElements.define('nexus-toast', NexusToast);


/**
 * NEXUS Toast Container
 * Manages multiple toast notifications
 */
export class NexusToastContainer extends LitElement {
  static properties = {
    position: { type: String, reflect: true }, // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    toasts: { type: Array, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--nx-sm, 0.5rem);
      position: fixed;
      z-index: 2000;
      pointer-events: none;
      max-width: 400px;
      padding: var(--nx-md, 1rem);
    }

    /* Positioning */
    :host([position="top-right"]) {
      top: 0;
      right: 0;
    }

    :host([position="top-left"]) {
      top: 0;
      left: 0;
    }

    :host([position="bottom-right"]) {
      bottom: 0;
      right: 0;
    }

    :host([position="bottom-left"]) {
      bottom: 0;
      left: 0;
    }

    :host([position="top-center"]) {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    :host([position="bottom-center"]) {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    /* Toast item */
    .toast-item {
      display: flex;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg, #fff);
      box-shadow: var(--nx-glow);
      pointer-events: auto;
      position: relative;
      animation: fadeSlideIn 0.3s ease-out;
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    :host([position*="left"]) .toast-item {
      animation-name: fadeSlideInLeft;
    }

    @keyframes fadeSlideInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Dither shadow */
    .toast-item::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: -4px;
      bottom: -4px;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0.4;
      z-index: -1;
    }

    /* Variants */
    .toast-item.success {
      border-color: #69db7c;
    }

    .toast-item.warning {
      border-color: #ffd43b;
    }

    .toast-item.error {
      border-color: #ff6b6b;
    }

    /* Icon */
    .icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }

    .toast-item.success .icon { color: #69db7c; }
    .toast-item.warning .icon { color: #ffd43b; }
    .toast-item.error .icon { color: #ff6b6b; }
    .toast-item.info .icon { color: var(--nx-primary, #00FFCC); }

    /* Message */
    .message {
      flex: 1;
    }

    /* Dismiss */
    .dismiss {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--nx-fg-dim, #888);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
    }

    .dismiss:hover {
      color: var(--nx-fg, #fff);
    }

    .dismiss svg {
      width: 12px;
      height: 12px;
    }
  `;

  constructor() {
    super();
    this.position = 'top-right';
    this.toasts = [];
    this._idCounter = 0;
  }

  _getIcon(variant) {
    const iconMap = {
      info: icons.info,
      success: icons.check,
      warning: icons.warning,
      error: icons.error,
    };
    return iconMap[variant] || icons.info;
  }

  _dismiss(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // Public API
  add(message, options = {}) {
    const id = ++this._idCounter;
    const toast = {
      id,
      message,
      variant: options.variant || 'info',
      duration: options.duration ?? 4000,
    };

    this.toasts = [...this.toasts, toast];

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => this._dismiss(id), toast.duration);
    }

    return id;
  }

  info(message, duration) {
    return this.add(message, { variant: 'info', duration });
  }

  success(message, duration) {
    return this.add(message, { variant: 'success', duration });
  }

  warning(message, duration) {
    return this.add(message, { variant: 'warning', duration });
  }

  error(message, duration) {
    return this.add(message, { variant: 'error', duration });
  }

  clear() {
    this.toasts = [];
  }

  render() {
    return html`
      ${this.toasts.map(toast => html`
        <div class="toast-item ${toast.variant}" role="alert">
          <span class="icon">
            <svg viewBox="0 0 24 24">${this._getIcon(toast.variant)}</svg>
          </span>
          <span class="message">${toast.message}</span>
          <button class="dismiss" @click=${() => this._dismiss(toast.id)} aria-label="Dismiss">
            <svg viewBox="0 0 24 24">${icons.close}</svg>
          </button>
        </div>
      `)}
    `;
  }
}

customElements.define('nexus-toast-container', NexusToastContainer);
