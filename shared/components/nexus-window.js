/**
 * NEXUS Window Component
 * Draggable, resizable window with title bar and controls
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { icons } from './nexus-icons.js';

export class NexusWindow extends LitElement {
  static properties = {
    title: { type: String },
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number },
    minWidth: { type: Number, attribute: 'min-width' },
    minHeight: { type: Number, attribute: 'min-height' },
    fullscreen: { type: Boolean, reflect: true },
    noResize: { type: Boolean, attribute: 'no-resize' },
    noShadow: { type: Boolean, attribute: 'no-shadow' },
    _dragging: { type: Boolean, state: true },
    _resizing: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      z-index: 50;
    }

    /* Fullscreen: fill the parent container, not the viewport */
    :host([fullscreen]) {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: auto !important;
      height: auto !important;
      z-index: 999;
    }

    .window {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      box-shadow: var(--nx-glow);
    }

    /* Dither shadow */
    .dither-shadow {
      position: absolute;
      top: 6px;
      left: 6px;
      right: -6px;
      bottom: -6px;
      pointer-events: none;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0.5;
      z-index: -1;
    }

    :host([fullscreen]) .dither-shadow {
      display: none;
    }

    /* Title bar */
    .title-bar {
      height: 32px;
      border-bottom: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      display: flex;
      align-items: center;
      background: linear-gradient(
        180deg,
        var(--nx-bg-raised, #111) 0%,
        var(--nx-bg, #000) 100%
      );
      cursor: default;
      flex-shrink: 0;
    }

    /* Window buttons */
    .window-btn {
      width: 32px;
      height: 100%;
      border-right: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      color: var(--nx-primary, #00FFCC);
    }

    .window-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      opacity: 0;
      transition: opacity 0.1s;
    }

    .window-btn:hover::before {
      opacity: 1;
    }

    .window-btn:hover {
      color: var(--nx-bg, #000);
    }

    .window-btn svg {
      width: 12px;
      height: 12px;
      position: relative;
    }

    /* Title */
    .title-text {
      flex: 1;
      text-align: center;
      font-family: var(--nx-font, monospace);
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-primary, #00FFCC);
      text-shadow: var(--nx-glow);
      padding: 0 var(--nx-sm, 0.5rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .title-spacer {
      width: 64px;
    }

    /* Content */
    .content {
      flex: 1;
      overflow: auto;
      min-height: 0;
    }

    /* Resize handle */
    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      border-right: 2px solid var(--nx-primary, #00FFCC);
      border-bottom: 2px solid var(--nx-primary, #00FFCC);
      margin: 2px;
      opacity: 0.5;
      transition: opacity var(--nx-transition, 0.15s);
    }

    .resize-handle:hover {
      opacity: 1;
    }

    :host([fullscreen]) .resize-handle,
    :host([no-resize]) .resize-handle {
      display: none;
    }

    /* Scrollbar - dither pattern */
    .content::-webkit-scrollbar {
      width: 10px;
    }

    .content::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    .content::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    .content::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }
  `;

  constructor() {
    super();
    this.title = 'Window';
    this.x = 100;
    this.y = 100;
    this.width = 400;
    this.height = 300;
    this.minWidth = 200;
    this.minHeight = 150;
    this.fullscreen = false;
    this.noResize = false;
    this.noShadow = false;
    this._dragging = false;
    this._resizing = false;
    this._savedState = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._updatePosition();
  }

  _updatePosition() {
    if (!this.fullscreen) {
      this.style.left = `${this.x}px`;
      this.style.top = `${this.y}px`;
      this.style.width = `${this.width}px`;
      this.style.height = `${this.height}px`;
    }
  }

  _startDrag(e) {
    if (e.target.closest('.window-btn')) return;
    e.preventDefault();

    this._dragging = true;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;
    this._dragInitialX = this.x;
    this._dragInitialY = this.y;

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);

    this._dispatchFocus();
  }

  _startResize(e) {
    e.preventDefault();
    e.stopPropagation();

    this._resizing = true;
    this._resizeStartX = e.clientX;
    this._resizeStartY = e.clientY;
    this._resizeInitialW = this.width;
    this._resizeInitialH = this.height;

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);

    this._dispatchFocus();
  }

  _onMouseMove(e) {
    if (this._dragging) {
      this.x = this._dragInitialX + (e.clientX - this._dragStartX);
      this.y = this._dragInitialY + (e.clientY - this._dragStartY);
      this._updatePosition();
    } else if (this._resizing) {
      this.width = Math.max(
        this.minWidth,
        this._resizeInitialW + (e.clientX - this._resizeStartX)
      );
      this.height = Math.max(
        this.minHeight,
        this._resizeInitialH + (e.clientY - this._resizeStartY)
      );
      this._updatePosition();
    }
  }

  _onMouseUp() {
    this._dragging = false;
    this._resizing = false;
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
  }

  _toggleFullscreen() {
    if (this.fullscreen) {
      // Restore
      this.fullscreen = false;
      if (this._savedState) {
        this.x = this._savedState.x;
        this.y = this._savedState.y;
        this.width = this._savedState.width;
        this.height = this._savedState.height;
      }
      this._updatePosition();
    } else {
      // Save and fullscreen
      this._savedState = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
      this.fullscreen = true;
      // Clear inline styles so CSS can take over
      this.style.top = '';
      this.style.left = '';
      this.style.width = '';
      this.style.height = '';
    }
    this._dispatchFocus();
  }

  _close() {
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true,
    }));
  }

  _dispatchFocus() {
    this.dispatchEvent(new CustomEvent('focus-window', {
      bubbles: true,
      composed: true,
    }));
  }

  _renderIcon(name) {
    if (!name || !icons[name]) return null;
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  }

  render() {
    return html`
      ${!this.noShadow && !this.fullscreen ? html`
        <div class="dither-shadow"></div>
      ` : null}

      <div class="window" @mousedown=${this._dispatchFocus}>
        <div class="title-bar" @mousedown=${this._startDrag}>
          <div class="window-btn" @click=${this._close} title="Close">
            ${this._renderIcon('close')}
          </div>
          <div class="window-btn" @click=${this._toggleFullscreen} title="Fullscreen">
            ${this._renderIcon(this.fullscreen ? 'exitFullscreen' : 'fullscreen')}
          </div>
          <div class="title-text">${this.title}</div>
          <div class="title-spacer"></div>
        </div>

        <div class="content">
          <slot></slot>
        </div>

        ${!this.noResize ? html`
          <div class="resize-handle" @mousedown=${this._startResize}></div>
        ` : null}
      </div>
    `;
  }
}

customElements.define('nexus-window', NexusWindow);
