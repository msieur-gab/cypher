/**
 * NEXUS Input Component
 * Text input with label, error states, clear button, password toggle
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusInput extends LitElement {
  static properties = {
    type: { type: String },
    label: { type: String },
    placeholder: { type: String },
    value: { type: String },
    error: { type: String },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean },
    _showPassword: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: var(--nx-font, monospace);
    }

    .label {
      display: block;
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      margin-bottom: var(--nx-xs, 0.25rem);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .required::after {
      content: ' *';
      color: var(--nx-primary, #00FFCC);
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: var(--nx-xs, 0.25rem);
      min-height: var(--nx-tap, 32px);
      padding: 0 var(--nx-sm, 0.5rem);
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
      background: var(--nx-bg, #000);
      transition: border-color var(--nx-transition, 0.15s ease);
    }

    .input-wrapper:focus-within {
      border-color: var(--nx-primary, #00FFCC);
      box-shadow: var(--nx-glow);
    }

    :host([disabled]) .input-wrapper {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .has-error .input-wrapper {
      border-color: var(--nx-fg, #fff);
      border-width: var(--nx-thick, 2px);
    }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--nx-text-base, 0.875rem);
      color: var(--nx-fg, #fff);
      outline: none;
      padding: var(--nx-sm, 0.5rem) 0;
    }

    input::placeholder {
      color: var(--nx-fg-muted, #555);
    }

    input:disabled {
      cursor: not-allowed;
    }

    /* Password uses asterisks instead of dots */
    input[type="password"] {
      -webkit-text-security: square;
      font-family: monospace;
      letter-spacing: 0.2em;
    }

    /* Leading icon */
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--nx-fg-muted, #555);
    }

    .icon svg {
      width: 16px;
      height: 16px;
    }

    /* Action buttons (clear, password toggle) */
    .action {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--nx-fg-dim, #888);
      cursor: pointer;
      padding: 0;
      transition: color var(--nx-transition, 0.15s ease);
    }

    .action:hover {
      color: var(--nx-primary, #00FFCC);
    }

    .action:disabled {
      color: var(--nx-fg-muted, #555);
      cursor: not-allowed;
    }

    .action svg {
      width: 16px;
      height: 16px;
    }

    /* Error message */
    .error-message {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg, #fff);
      margin-top: var(--nx-xs, 0.25rem);
    }
  `;

  constructor() {
    super();
    this.type = 'text';
    this.label = '';
    this.placeholder = '';
    this.value = '';
    this.error = '';
    this.disabled = false;
    this.required = false;
    this._showPassword = false;
  }

  get _inputType() {
    if (this.type === 'password') {
      return this._showPassword ? 'text' : 'password';
    }
    if (this.type === 'search') return 'text';
    return this.type;
  }

  get _leadingIcon() {
    switch (this.type) {
      case 'search': return 'search';
      default: return null;
    }
  }

  _handleInput(e) {
    e.stopPropagation();
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }

  _handleChange(e) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }

  _clear() {
    this.value = '';
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
    this.shadowRoot.querySelector('input')?.focus();
  }

  _togglePassword() {
    this._showPassword = !this._showPassword;
  }

  _renderIcon(name) {
    if (!name || !icons[name]) return null;
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  }

  render() {
    const hasValue = this.value?.length > 0;
    const showClear = hasValue && this.type !== 'password' && !this.disabled;
    const showPasswordToggle = this.type === 'password' && !this.disabled;

    return html`
      <div class="${this.error ? 'has-error' : ''}">
        ${this.label ? html`
          <label class="label ${this.required ? 'required' : ''}">${this.label}</label>
        ` : null}

        <div class="input-wrapper">
          ${this._leadingIcon ? html`
            <span class="icon">${this._renderIcon(this._leadingIcon)}</span>
          ` : null}

          <input
            type="${this._inputType}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            @input="${this._handleInput}"
            @change="${this._handleChange}"
            aria-invalid="${this.error ? 'true' : 'false'}"
            part="input"
          />

          ${showClear ? html`
            <button
              class="action"
              @click="${this._clear}"
              aria-label="Clear"
              type="button"
            >
              ${this._renderIcon('close')}
            </button>
          ` : null}

          ${showPasswordToggle ? html`
            <button
              class="action"
              @click="${this._togglePassword}"
              aria-label="${this._showPassword ? 'Hide password' : 'Show password'}"
              type="button"
            >
              ${this._renderIcon(this._showPassword ? 'unlock' : 'lock')}
            </button>
          ` : null}
        </div>

        ${this.error ? html`
          <div class="error-message">${this.error}</div>
        ` : null}
      </div>
    `;
  }
}

customElements.define('nexus-input', NexusInput);
