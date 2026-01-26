/**
 * NEXUS Avatar Component
 * Circular avatar with ASCII art camera capture effect
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusAvatar extends LitElement {
  static properties = {
    src: { type: String },
    size: { type: Number },
    name: { type: String },
    editable: { type: Boolean },
    _capturing: { type: Boolean, state: true },
    _countdown: { type: Number, state: true },
  };

  // ASCII character sets for the effect
  static CHAR_SETS = {
    horizontal: '  ▂▃▄▅▆▇█',
    vertical: ' ▏▎▍▌▋▊▉█',
    retro: ' ░▒▓█'
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .avatar-container {
      position: relative;
      overflow: hidden;
      border: var(--nx-thick, 2px) solid var(--nx-primary, #00FFCC);
      background: var(--nx-bg, #000);
      box-shadow: var(--nx-glow, 0 0 20px rgba(0, 255, 204, 0.2));
    }

    .avatar-container.editable {
      cursor: pointer;
    }

    .avatar-container.editable:hover {
      border-color: var(--nx-primary, #00FFCC);
      box-shadow: 0 0 30px var(--nx-primary-glow, rgba(0, 255, 204, 0.4));
    }

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    video {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    /* Placeholder when no image */
    .placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--nx-bg-raised, #111);
      color: var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
      font-weight: bold;
    }

    /* Countdown overlay */
    .countdown-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .countdown-number {
      font-size: 4rem;
      font-weight: bold;
      color: var(--nx-primary, #00FFCC);
      text-shadow: var(--nx-glow);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    /* Flash effect */
    .flash-overlay {
      position: absolute;
      inset: 0;
      background: white;
      opacity: 0;
      z-index: 20;
      pointer-events: none;
    }

    .flash-overlay.active {
      animation: flash 0.3s ease-out;
    }

    @keyframes flash {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* Frozen border pulse */
    .frozen-ring {
      position: absolute;
      inset: -3px;
      border: var(--nx-thick, 2px) solid var(--nx-primary, #00FFCC);
      animation: ring-pulse 2s infinite;
      pointer-events: none;
    }

    @keyframes ring-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.02); }
    }

    /* Edit hint */
    .edit-hint {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .avatar-container.editable:hover .edit-hint {
      opacity: 1;
    }

    .edit-hint svg {
      width: 32px;
      height: 32px;
      color: var(--nx-primary, #00FFCC);
    }

    /* Name display */
    .name {
      margin-top: var(--nx-xs, 0.25rem);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      color: var(--nx-primary, #00FFCC);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  `;

  constructor() {
    super();
    this.src = '';
    this.size = 100;
    this.name = '';
    this.editable = false;
    this._capturing = false;
    this._countdown = 0;
    this._stream = null;
    this._frozen = false;
    this._animationId = null;
    this._config = { resolution: 100, mode: 'horizontal', color: '#00FFCC' };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopCamera();
  }

  _getInitials() {
    if (!this.name) return '?';
    return this.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  async _startCapture() {
    if (!this.editable) return;

    // Set capturing first so canvas renders
    this._capturing = true;
    await this.updateComplete;

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });

      const video = this.shadowRoot.getElementById('video');
      if (!video) {
        console.error('Video element not found');
        this._capturing = false;
        return;
      }
      video.srcObject = this._stream;

      video.onloadedmetadata = () => {
        video.play();
        this._frozen = false;
        this._renderFrame();
      };
    } catch (err) {
      console.error('Camera error:', err);
      this._capturing = false;
      this.dispatchEvent(new CustomEvent('camera-error', { detail: { error: err.message } }));
    }
  }

  _stopCamera() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    const video = this.shadowRoot?.getElementById('video');
    if (video) {
      video.srcObject = null;
    }
  }

  _renderFrame() {
    if (!this._stream || this._frozen) return;

    const video = this.shadowRoot?.getElementById('video');
    const canvas = this.shadowRoot?.getElementById('canvas');

    if (!video || !canvas) {
      // Elements not ready, retry next frame
      this._animationId = requestAnimationFrame(() => this._renderFrame());
      return;
    }

    if (video.readyState !== 4) {
      this._animationId = requestAnimationFrame(() => this._renderFrame());
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const size = this.size * 2;
    canvas.width = size;
    canvas.height = size;

    // Crop to square from center
    const vidW = video.videoWidth;
    const vidH = video.videoHeight;
    const cropSize = Math.min(vidW, vidH);
    const cropX = (vidW - cropSize) / 2;
    const cropY = (vidH - cropSize) / 2;

    // ASCII art parameters
    const cols = this._config.resolution;
    const rows = Math.floor(cols * 0.6);
    const cellW = size / cols;
    const cellH = size / rows;

    // Create temp canvas for sampling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.translate(cols, 0);
    tempCtx.scale(-1, 1); // Mirror
    tempCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, cols, rows);

    const pixels = tempCtx.getImageData(0, 0, cols, rows).data;

    // Draw ASCII art
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.font = `${cellW}px monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = this._config.color;

    const chars = NexusAvatar.CHAR_SETS[this._config.mode];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
        ctx.fillText(chars[charIndex], x * cellW, y * cellH);
      }
    }

    this._animationId = requestAnimationFrame(() => this._renderFrame());
  }

  _triggerCountdown() {
    this._countdown = 3;

    const tick = () => {
      if (this._countdown > 1) {
        this._countdown--;
        setTimeout(tick, 1000);
      } else {
        this._countdown = 0;
        this._freeze();
      }
    };
    setTimeout(tick, 1000);
  }

  _freeze() {
    // Flash effect
    const flash = this.shadowRoot.querySelector('.flash-overlay');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 300);

    // Freeze frame
    this._frozen = true;
    cancelAnimationFrame(this._animationId);

    // Get data URL
    const canvas = this.shadowRoot.getElementById('canvas');
    const dataUrl = canvas.toDataURL('image/png');

    this.dispatchEvent(new CustomEvent('avatar-captured', {
      bubbles: true,
      composed: true,
      detail: { dataUrl }
    }));
  }

  _retake() {
    this._frozen = false;
    this._renderFrame();
  }

  _confirmCapture() {
    const canvas = this.shadowRoot.getElementById('canvas');
    this.src = canvas.toDataURL('image/png');
    this._capturing = false;
    this._stopCamera();

    this.dispatchEvent(new CustomEvent('avatar-confirmed', {
      bubbles: true,
      composed: true,
      detail: { src: this.src }
    }));
  }

  _cancelCapture() {
    this._capturing = false;
    this._frozen = false;
    this._stopCamera();
  }

  _handleClick() {
    if (this.editable && !this._capturing) {
      this._startCapture();
    }
  }

  render() {
    const containerStyle = `width: ${this.size}px; height: ${this.size}px;`;
    const fontSize = `${Math.max(this.size / 3, 16)}px`;

    return html`
      <div class="wrapper">
        <div
          class="avatar-container ${this.editable ? 'editable' : ''}"
          style=${containerStyle}
          @click=${this._handleClick}
        >
          <!-- Video always in DOM (hidden, used as source) -->
          <video id="video" autoplay playsinline muted></video>

          <!-- Canvas for ASCII art (hidden when not capturing) -->
          <canvas id="canvas" style="display: ${this._capturing ? 'block' : 'none'}"></canvas>

          <!-- Show image or placeholder when NOT capturing -->
          ${!this._capturing ? (this.src ? html`
            <img src=${this.src} alt=${this.name || 'Avatar'}>
          ` : html`
            <div class="placeholder" style="font-size: ${fontSize}">
              ${this._getInitials()}
            </div>
          `) : null}

          <!-- Overlays when capturing -->
          ${this._capturing ? html`
            ${this._countdown > 0 ? html`
              <div class="countdown-overlay">
                <span class="countdown-number">${this._countdown}</span>
              </div>
            ` : null}

            <div class="flash-overlay"></div>

            ${this._frozen ? html`<div class="frozen-ring"></div>` : null}
          ` : null}

          ${this.editable && !this._capturing ? html`
            <div class="edit-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          ` : null}
        </div>

        ${this.name ? html`<div class="name">${this.name}</div>` : null}

        ${this._capturing ? html`
          <div style="margin-top: var(--nx-sm); display: flex; gap: var(--nx-sm); justify-content: center;">
            ${this._frozen ? html`
              <nexus-button size="sm" @click=${this._retake}>Retake</nexus-button>
              <nexus-button size="sm" variant="primary" @click=${this._confirmCapture}>Confirm</nexus-button>
            ` : html`
              <nexus-button size="sm" @click=${this._cancelCapture}>Cancel</nexus-button>
              <nexus-button size="sm" variant="primary" @click=${this._triggerCountdown} ?disabled=${this._countdown > 0}>
                Capture
              </nexus-button>
            `}
          </div>
        ` : null}
      </div>
    `;
  }
}

customElements.define('nexus-avatar', NexusAvatar);
