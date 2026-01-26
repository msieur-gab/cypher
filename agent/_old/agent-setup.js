/**
 * CYPHER Agent Setup - Profile creation with cyberpunk avatar capture
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class AgentSetup extends LitElement {
  static properties = {
    _codename: { type: String, state: true },
    _avatarData: { type: String, state: true },
    _isFrozen: { type: Boolean, state: true },
    _isCountingDown: { type: Boolean, state: true },
    _countdown: { type: Number, state: true },
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
    }

    .avatar-container {
      width: 250px;
      height: 250px;
      margin: 1rem auto;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid rgba(0, 255, 204, 0.3);
      background: #000;
      position: relative;
      box-shadow: 0 0 50px rgba(0, 255, 204, 0.1);
    }

    video { display: none; }

    canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .countdown-overlay {
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      z-index: 40;
    }
    .countdown-overlay.active { display: flex; }
    .countdown-number {
      font-size: 6rem;
      font-weight: bold;
      animation: ping 1s infinite;
    }
    @keyframes ping {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .flash-overlay {
      display: none;
      position: absolute;
      inset: 0;
      background: white;
      z-index: 50;
    }
    .flash-overlay.active {
      display: block;
      animation: flash 0.3s ease-out forwards;
    }
    @keyframes flash {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    .frozen-border {
      display: none;
      position: absolute;
      inset: 0;
      border: 20px solid rgba(0, 255, 204, 0.2);
      border-radius: 50%;
      pointer-events: none;
      animation: pulse 2s infinite;
    }
    .frozen-border.active { display: block; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .config-display {
      font-size: 0.7rem;
      opacity: 0.5;
      margin-top: 0.5rem;
    }

    input[type="text"] {
      background: #111;
      border: 1px solid rgba(0, 255, 204, 0.3);
      color: #00FFCC;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 1rem;
      width: 100%;
      max-width: 250px;
      text-align: center;
      text-transform: uppercase;
    }
    input::placeholder { text-transform: none; color: rgba(0, 255, 204, 0.4); }
    input:focus { outline: none; border-color: #00FFCC; box-shadow: 0 0 10px rgba(0, 255, 204, 0.2); }

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
    button:hover { background: rgba(0, 255, 204, 0.1); }
    button:disabled { border-color: #333; color: #333; cursor: not-allowed; }
    button.primary { background: #00FFCC; color: #000; }
    button.primary:hover { background: #00CCAA; }
    button.secondary { border-color: #666; color: #666; }

    .level-badge {
      display: inline-block;
      background: #00FFCC;
      color: #000;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }

    .button-row { margin-top: 1rem; }
    .input-row { margin-top: 1.5rem; }
    .register-row { margin-top: 1rem; }
  `;

  // Cyberpunk ASCII character sets
  static CHAR_SETS = {
    horizontal: "  ▂▃▄▅▆▇█",
    vertical: " ▏▎▍▌▋▊▉█",
    retro: " ░▒▓█"
  };

  constructor() {
    super();
    this._codename = '';
    this._avatarData = null;
    this._isFrozen = false;
    this._isCountingDown = false;
    this._countdown = 3;
    this._stream = null;
    this._animationId = null;
    this._config = { resolution: 100, mode: 'horizontal', color: '#00FFCC' };
  }

  firstUpdated() {
    this._startCamera();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopCamera();
  }

  async _startCamera() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });
      const video = this.shadowRoot.getElementById('camera');
      video.srcObject = this._stream;
      video.onloadedmetadata = () => {
        video.play();
        this._renderFrame();
      };
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permissions.');
    }
  }

  _stopCamera() {
    if (this._animationId) cancelAnimationFrame(this._animationId);
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
  }

  _renderFrame() {
    if (!this._stream || this._isFrozen) return;

    const video = this.shadowRoot.getElementById('camera');
    const canvas = this.shadowRoot.getElementById('canvas');

    if (video.readyState !== 4) {
      this._animationId = requestAnimationFrame(() => this._renderFrame());
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const size = canvas.clientWidth * 2;
    canvas.width = size;
    canvas.height = size;

    const vidW = video.videoWidth;
    const vidH = video.videoHeight;
    const cropSize = Math.min(vidW, vidH);
    const cropX = (vidW - cropSize) / 2;
    const cropY = (vidH - cropSize) / 2;

    const cols = this._config.resolution;
    const rows = Math.floor(cols * 0.6);
    const cellWidth = size / cols;
    const cellHeight = size / rows;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.translate(cols, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, cols, rows);

    const pixels = tempCtx.getImageData(0, 0, cols, rows).data;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.font = `${cellWidth}px monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = this._config.color;

    const chars = AgentSetup.CHAR_SETS[this._config.mode];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
        ctx.fillText(chars[charIndex], x * cellWidth, y * cellHeight);
      }
    }

    if (!this._isFrozen) {
      this._animationId = requestAnimationFrame(() => this._renderFrame());
    }
  }

  _startCapture() {
    this._countdown = 3;
    this._isCountingDown = true;

    const tick = () => {
      if (this._countdown > 1) {
        this._countdown--;
        setTimeout(tick, 1000);
      } else {
        this._isCountingDown = false;
        this._performCapture();
      }
    };
    setTimeout(tick, 1000);
  }

  _performCapture() {
    // Flash
    const flash = this.shadowRoot.querySelector('.flash-overlay');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 300);

    // Freeze
    this._isFrozen = true;
    cancelAnimationFrame(this._animationId);

    const canvas = this.shadowRoot.getElementById('canvas');
    this._avatarData = canvas.toDataURL('image/png');
  }

  _retake() {
    this._isFrozen = false;
    this._avatarData = null;
    this._renderFrame();
  }

  _onCodenameInput(e) {
    this._codename = e.target.value;
  }

  _canRegister() {
    return this._avatarData && this._codename.trim().length >= 2;
  }

  _register() {
    const profile = {
      codename: this._codename.trim().toUpperCase(),
      level: 1,
      avatar: this._avatarData
    };

    this._stopCamera();

    this.dispatchEvent(new CustomEvent('profile-created', {
      detail: { profile }
    }));
  }

  render() {
    return html`
      <h2>IDENTITY_GEN</h2>

      <div class="avatar-container">
        <video id="camera" autoplay playsinline muted></video>
        <canvas id="canvas"></canvas>
        <div class="countdown-overlay ${this._isCountingDown ? 'active' : ''}">
          <span class="countdown-number">${this._countdown}</span>
        </div>
        <div class="flash-overlay"></div>
        <div class="frozen-border ${this._isFrozen ? 'active' : ''}"></div>
      </div>

      <div class="config-display">RES: ${this._config.resolution} // MODE: ${this._config.mode.toUpperCase()}</div>

      <div class="button-row">
        ${this._isFrozen ? html`
          <button class="secondary" @click=${this._retake}>RETAKE</button>
        ` : html`
          <button @click=${this._startCapture} ?disabled=${this._isCountingDown}>CAPTURE</button>
        `}
      </div>

      <div class="input-row">
        <input
          type="text"
          placeholder="Enter codename"
          maxlength="16"
          .value=${this._codename}
          @input=${this._onCodenameInput}
        >
      </div>

      <div class="level-badge">ACCREDITATION LEVEL 1</div>

      <div class="register-row">
        <button
          class="primary"
          ?disabled=${!this._canRegister()}
          @click=${this._register}
        >REGISTER AGENT</button>
      </div>
    `;
  }
}

customElements.define('agent-setup', AgentSetup);
