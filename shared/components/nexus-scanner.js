/**
 * NEXUS Scanner Component
 * QR code scanner with cyberpunk styling
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import jsQR from 'https://esm.sh/jsqr@1';

export class NexusScanner extends LitElement {
  static properties = {
    active: { type: Boolean, reflect: true },
    size: { type: Number },
    label: { type: String },
    _status: { type: String, state: true },
    _error: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    .scanner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-sm, 0.5rem);
    }

    .label {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .scanner-frame {
      position: relative;
      overflow: hidden;
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      background: var(--nx-bg, #000);
      box-shadow: var(--nx-glow, 0 0 20px rgba(0, 255, 204, 0.2));
    }

    video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: saturate(0) brightness(0.8) sepia(1) hue-rotate(120deg) saturate(2);
    }

    canvas { display: none; }

    .corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: var(--nx-primary, #00FFCC);
      border-style: solid;
    }

    .corner.tl { top: 12px; left: 12px; border-width: 2px 0 0 2px; }
    .corner.tr { top: 12px; right: 12px; border-width: 2px 2px 0 0; }
    .corner.bl { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; }
    .corner.br { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; }

    .scan-line {
      position: absolute;
      left: 12px;
      right: 12px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--nx-primary, #00FFCC), transparent);
      animation: scan 2s ease-in-out infinite;
      z-index: 10;
    }

    @keyframes scan {
      0%, 100% { top: 12px; opacity: 1; }
      50% { top: calc(100% - 14px); opacity: 0.5; }
    }

    .status {
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
      color: var(--nx-fg-dim, #888);
    }

    .status.scanning { color: var(--nx-primary, #00FFCC); border-color: var(--nx-primary-dim); }
    .status.error { color: #ff4444; border-color: rgba(255, 68, 68, 0.4); }
    .status.success { color: #00ff88; border-color: rgba(0, 255, 136, 0.4); }

    .instructions {
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-muted, #666);
      text-align: center;
      max-width: 280px;
    }
  `;

  constructor() {
    super();
    this.active = false;
    this.size = 280;
    this.label = '';
    this._status = 'Ready';
    this._error = null;
    this._stream = null;
    this._animationId = null;
  }

  updated(changedProps) {
    if (changedProps.has('active')) {
      this.active ? this._startScanner() : this._stopScanner();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopScanner();
  }

  async _startScanner() {
    try {
      this._error = null;
      this._status = 'Starting camera...';

      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
        audio: false
      });

      const video = this.shadowRoot.getElementById('video');
      video.srcObject = this._stream;
      video.onloadedmetadata = () => {
        video.play();
        this._status = 'Scanning...';
        this._scanFrame();
      };
    } catch (err) {
      this._error = err.name === 'NotAllowedError' ? 'Camera access denied' : err.message;
      this._status = 'Camera error';
      this.dispatchEvent(new CustomEvent('scan-error', { detail: { error: this._error } }));
    }
  }

  _scanFrame() {
    if (!this._stream || !this.active) return;

    const video = this.shadowRoot.getElementById('video');
    const canvas = this.shadowRoot.getElementById('canvas');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      this._animationId = requestAnimationFrame(() => this._scanFrame());
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Grayscale for better detection
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    const code = jsQR(data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

    if (code) {
      this._status = 'Code found!';
      this._stopScanner();
      this.dispatchEvent(new CustomEvent('scan-success', { detail: { data: code.data } }));
      return;
    }

    this._animationId = requestAnimationFrame(() => this._scanFrame());
  }

  _stopScanner() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    // Clear video source
    const video = this.shadowRoot?.getElementById('video');
    if (video) {
      video.srcObject = null;
    }
    this._status = 'Ready';
  }

  restart() {
    this._stopScanner();
    if (this.active) this._startScanner();
  }

  render() {
    return html`
      <div class="scanner-container">
        ${this.label ? html`<div class="label">${this.label}</div>` : null}

        <div class="scanner-frame" style="width:${this.size}px;height:${this.size}px;">
          <video id="video" autoplay playsinline muted></video>
          <canvas id="canvas"></canvas>
          ${this.active && !this._error ? html`
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <div class="scan-line"></div>
          ` : null}
        </div>

        <div class="status ${this.active && !this._error ? 'scanning' : ''} ${this._error ? 'error' : ''}">
          ${this._status}
        </div>

        <p class="instructions">
          ${this._error ? 'Allow camera access to scan.' : 'Point camera at QR code.'}
        </p>
      </div>
    `;
  }
}

customElements.define('nexus-scanner', NexusScanner);
