/**
 * CYPHER Agent Scanner - QR code scanner for terminal pairing
 * Uses manual camera access + jsQR (works in Shadow DOM)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import jsQR from 'https://esm.sh/jsqr@1';

export class AgentScanner extends LitElement {
  static properties = {
    profile: { type: Object },
    _status: { type: String, state: true },
    _isScanning: { type: Boolean, state: true },
    _error: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      text-align: center;
      padding: 1rem;
    }

    h2 {
      color: #00FFCC;
      margin: 0.5rem 0;
      font-size: 0.9rem;
      opacity: 0.8;
      letter-spacing: 0.1em;
    }

    .profile-mini {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin: 1rem auto;
      padding: 0.75rem;
      border: 1px solid rgba(0, 255, 204, 0.2);
      border-radius: 8px;
      max-width: 200px;
      background: rgba(0, 255, 204, 0.02);
    }

    .profile-mini .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #00FFCC;
    }

    .profile-mini .codename {
      color: #00FFCC;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .scanner-container {
      width: 280px;
      height: 280px;
      margin: 1.5rem auto;
      border-radius: 16px;
      overflow: hidden;
      border: 3px solid rgba(0, 255, 204, 0.4);
      background: #000;
      position: relative;
      box-shadow: 0 0 30px rgba(0, 255, 204, 0.1);
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    canvas {
      display: none;
    }

    .corner-marks {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    }

    .corner-marks::before,
    .corner-marks::after {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: #00FFCC;
      border-style: solid;
    }

    .corner-marks::before {
      top: 20px;
      left: 20px;
      border-width: 3px 0 0 3px;
    }

    .corner-marks::after {
      top: 20px;
      right: 20px;
      border-width: 3px 3px 0 0;
    }

    .corner-marks-bottom {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    }

    .corner-marks-bottom::before,
    .corner-marks-bottom::after {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: #00FFCC;
      border-style: solid;
    }

    .corner-marks-bottom::before {
      bottom: 20px;
      left: 20px;
      border-width: 0 0 3px 3px;
    }

    .corner-marks-bottom::after {
      bottom: 20px;
      right: 20px;
      border-width: 0 3px 3px 0;
    }

    .scan-line {
      position: absolute;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00FFCC, transparent);
      animation: scan 2s ease-in-out infinite;
      z-index: 10;
    }

    @keyframes scan {
      0%, 100% { top: 20px; opacity: 1; }
      50% { top: calc(100% - 22px); opacity: 0.5; }
    }

    .status {
      padding: 0.75rem;
      margin: 1rem auto;
      max-width: 280px;
      font-size: 0.85rem;
      border: 1px solid rgba(0, 255, 204, 0.2);
      color: #888;
    }

    .status.scanning {
      color: #00FFCC;
      border-color: rgba(0, 255, 204, 0.4);
    }

    .status.error {
      color: #ff4444;
      border-color: rgba(255, 68, 68, 0.4);
    }

    .status.success {
      color: #00ff88;
      border-color: rgba(0, 255, 136, 0.4);
    }

    .instructions {
      font-size: 0.8rem;
      color: #666;
      margin: 1rem 0;
      line-height: 1.5;
    }

    button {
      background: transparent;
      color: #00FFCC;
      border: 2px solid #00FFCC;
      padding: 0.75rem 1.5rem;
      font-family: monospace;
      font-size: 1rem;
      cursor: pointer;
      margin: 0.5rem;
      border-radius: 50px;
      transition: all 0.2s;
    }

    button:hover {
      background: rgba(0, 255, 204, 0.1);
    }

    button:disabled {
      border-color: #333;
      color: #333;
      cursor: not-allowed;
    }

    button.secondary {
      border-color: #666;
      color: #666;
    }

    .button-row {
      margin-top: 1.5rem;
    }
  `;

  constructor() {
    super();
    this._status = 'Initializing camera...';
    this._isScanning = false;
    this._error = null;
    this._stream = null;
    this._animationId = null;
  }

  firstUpdated() {
    this._startScanner();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopScanner();
  }

  async _startScanner() {
    try {
      this._error = null;
      this._status = 'Starting camera...';

      // Request camera access - this triggers the permission prompt
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
        audio: false
      });

      const video = this.shadowRoot.getElementById('video');
      video.srcObject = this._stream;

      video.onloadedmetadata = () => {
        video.play();
        this._isScanning = true;
        this._status = 'Scanning for Terminal QR...';
        this._scanFrame();
      };
    } catch (err) {
      console.error('Scanner error:', err);
      this._error = err.name === 'NotAllowedError'
        ? 'Camera access denied'
        : (err.message || 'Camera error');
      this._status = 'Camera error';
      this._isScanning = false;
    }
  }

  _scanFrame() {
    if (!this._stream || !this._isScanning) return;

    const video = this.shadowRoot.getElementById('video');
    const canvas = this.shadowRoot.getElementById('canvas');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      this._animationId = requestAnimationFrame(() => this._scanFrame());
      return;
    }

    // Draw video frame to canvas for QR analysis
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);

    // Analyze frame for QR code
    // Terminal QR uses inverted colors (cyan on black), so we need to attempt inversion
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth'
    });

    if (code) {
      this._onScanSuccess(code.data);
      return;
    }

    // Continue scanning
    this._animationId = requestAnimationFrame(() => this._scanFrame());
  }

  _stopScanner() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
    }
    this._isScanning = false;
  }

  _onScanSuccess(decodedText) {
    // Extract session ID from scanned URL
    // Expected format: http://host/agent/?session=ABC123
    // Or just the session ID directly: ABC123
    let sessionId = null;

    try {
      const url = new URL(decodedText);
      sessionId = url.searchParams.get('session');
    } catch {
      // Not a URL, maybe just the session ID
      if (/^[A-Z0-9]{6}$/i.test(decodedText)) {
        sessionId = decodedText.toUpperCase();
      }
    }

    if (sessionId) {
      this._status = `Found: ${sessionId}`;
      this._stopScanner();

      // Emit event with session ID
      this.dispatchEvent(new CustomEvent('session-found', {
        detail: { sessionId }
      }));
    }
  }

  async _retry() {
    await this._stopScanner();
    await this._startScanner();
  }

  render() {
    return html`
      <h2>TERMINAL_LINK</h2>

      ${this.profile ? html`
        <div class="profile-mini">
          <img class="avatar" src=${this.profile.avatar || ''} alt="">
          <span class="codename">${this.profile.codename}</span>
        </div>
      ` : ''}

      <div class="scanner-container">
        <video id="video" autoplay playsinline muted></video>
        <canvas id="canvas"></canvas>
        ${this._isScanning ? html`
          <div class="corner-marks"></div>
          <div class="corner-marks-bottom"></div>
          <div class="scan-line"></div>
        ` : ''}
      </div>

      <div class="status ${this._isScanning ? 'scanning' : ''} ${this._error ? 'error' : ''}">
        ${this._status}
      </div>

      ${this._error ? html`
        <p class="instructions">
          Please allow camera access to scan the Terminal QR code.
        </p>
        <div class="button-row">
          <button @click=${this._retry}>RETRY</button>
        </div>
      ` : html`
        <p class="instructions">
          Point camera at the QR code displayed on the Terminal screen.
        </p>
      `}
    `;
  }
}

customElements.define('agent-scanner', AgentScanner);
