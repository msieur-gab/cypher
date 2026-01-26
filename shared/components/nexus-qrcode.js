/**
 * NEXUS QR Code Component
 * Generates styled QR codes for terminal pairing
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import QRCode from 'https://esm.sh/qrcode@1';

export class NexusQRCode extends LitElement {
  static properties = {
    value: { type: String },
    size: { type: Number },
    color: { type: String },
    background: { type: String },
    label: { type: String },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
    }

    .qr-frame {
      position: relative;
      padding: var(--nx-md, 1rem);
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      box-shadow: var(--nx-glow);
    }

    /* Dither shadow */
    .qr-frame::before {
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

    /* Corner decorations */
    .corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border-color: var(--nx-primary, #00FFCC);
      border-style: solid;
    }

    .corner.tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .corner.tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .corner.bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    .corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    canvas {
      display: block;
    }

    .label {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .value {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-primary, #00FFCC);
      word-break: break-all;
      max-width: 250px;
      text-align: center;
      opacity: 0.6;
    }
  `;

  constructor() {
    super();
    this.value = '';
    this.size = 200;
    this.color = '#00FFCC';
    this.background = '#000000';
    this.label = '';
  }

  updated(changedProps) {
    if (changedProps.has('value') || changedProps.has('size') ||
        changedProps.has('color') || changedProps.has('background')) {
      this._generateQR();
    }
  }

  async _generateQR() {
    if (!this.value) return;

    const container = this.shadowRoot.getElementById('qr-canvas');
    if (!container) return;

    // Clear previous
    container.innerHTML = '';

    try {
      const canvas = await QRCode.toCanvas(document.createElement('canvas'), this.value, {
        width: this.size,
        margin: 1,
        color: {
          dark: this.color,
          light: this.background
        },
        errorCorrectionLevel: 'M'
      });

      container.appendChild(canvas);

      this.dispatchEvent(new CustomEvent('qr-generated', {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      }));
    } catch (err) {
      console.error('QR generation error:', err);
      this.dispatchEvent(new CustomEvent('qr-error', {
        bubbles: true,
        composed: true,
        detail: { error: err.message }
      }));
    }
  }

  render() {
    return html`
      <div class="qr-container">
        ${this.label ? html`<div class="label">${this.label}</div>` : null}

        <div class="qr-frame">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
          <div id="qr-canvas"></div>
        </div>

        ${this.value ? html`<div class="value">${this.value}</div>` : null}
      </div>
    `;
  }
}

customElements.define('nexus-qrcode', NexusQRCode);
