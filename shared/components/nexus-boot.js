/**
 * nexus-boot — Shared boot/splash sequence component
 *
 * Shows the canonical NEXUS narrative (logo + briefing), then either:
 *   - Terminal mode: QR code for agent authentication
 *   - Agent mode: "Continue" button to proceed
 *
 * Properties:
 *   mode        'terminal' | 'agent'   (default 'terminal')
 *   qrValue     string                 QR code URL (terminal mode)
 *   sessionId   string                 Session ID corner label (terminal mode)
 *   active      boolean                When true, starts boot animation
 *
 * Events:
 *   boot-skip      User clicked Skip during narrative
 *   boot-complete  Fade-out finished — parent should transition screens
 *
 * Methods:
 *   start()    Begin boot animation (also auto-starts when active becomes true)
 *   skip()     Skip narrative, jump to action phase
 *   dismiss()  Trigger fade-out (terminal calls when agent connects)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import './nexus-qrcode.js';
import './nexus-button.js';

class NexusBoot extends LitElement {
  static properties = {
    mode:      { type: String },
    qrValue:   { type: String, attribute: 'qr-value' },
    sessionId: { type: String, attribute: 'session-id' },
    active:    { type: Boolean, reflect: true },

    _phase:         { type: String, state: true },   // idle | narrative | action | fadeout | done
    _logoLines:     { type: Array, state: true },
    _logLines:      { type: Array, state: true },
    _cursorVisible: { type: Boolean, state: true },
    _cursorInLogo:  { type: Boolean, state: true },
    _hidden:        { type: Boolean, state: true },
    _animating:     { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    /* ── Full-screen overlay ── */
    .boot-overlay {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: var(--nx-xl);
      padding-top: min(12vh, var(--nx-xl));
      transition: opacity 0.6s, visibility 0.6s;
    }

    .boot-overlay.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .boot-content {
      width: 100%;
      max-width: 540px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .boot-logo {
      flex-shrink: 0;
      padding-bottom: 0.5em;
    }

    .boot-log {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      scroll-behavior: smooth;
    }

    /* ── Boot lines ── */
    .boot-line {
      opacity: 0;
      animation: bootFadeIn 0.15s forwards;
      margin-bottom: 0.25em;
      font-size: 14px;
      line-height: 1.7;
    }

    .boot-line.dim     { color: var(--nx-fg-dim); }
    .boot-line.muted   { color: var(--nx-fg-muted); }
    .boot-line.primary { color: var(--nx-primary); }

    .boot-line.highlight {
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      font-size: 16px;
    }

    .boot-line.logo {
      color: var(--nx-primary);
      text-shadow: var(--nx-glow-lg);
      font-family: monospace;
      font-size: min(18px, 3.2vw);
      line-height: 1.1;
      letter-spacing: -1px;
      margin-bottom: 0;
      white-space: pre;
    }

    .boot-line.header {
      color: var(--nx-primary);
      font-weight: bold;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      font-size: 12px;
      letter-spacing: 0.1em;
    }

    .boot-line.spacer { height: 0.6em; }
    .boot-line.indent  { padding-left: 1.5em; }

    .boot-cursor {
      display: inline-block;
      width: 10px;
      height: 16px;
      background: var(--nx-primary);
      animation: bootBlink 0.7s step-end infinite;
      vertical-align: text-bottom;
      margin-left: 4px;
    }

    /* Invisible scroll anchor kept at the very end of .boot-log */
    .scroll-anchor {
      height: 1px;
      overflow: hidden;
    }

    @keyframes bootFadeIn { to { opacity: 1; } }
    @keyframes bootBlink  { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

    /* ── QR Section (terminal mode) ── */
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: var(--nx-xl);
      animation: bootFadeIn 0.5s forwards;
    }

    .qr-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-md);
    }

    .qr-wrapper {
      padding: var(--nx-md);
      border: var(--nx-thin) solid var(--nx-primary);
      background: var(--nx-bg);
      box-shadow: var(--nx-glow-lg);
      margin-bottom: var(--nx-lg);
    }

    .qr-instructions {
      font-size: 13px;
      color: var(--nx-fg-dim);
      max-width: 340px;
      line-height: 1.6;
    }

    .qr-instructions strong { color: var(--nx-primary); }

    .waiting-indicator {
      display: flex;
      align-items: center;
      gap: var(--nx-sm);
      margin-top: var(--nx-lg);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-fg-muted);
    }

    .waiting-dot {
      width: 6px;
      height: 6px;
      background: var(--nx-primary);
      animation: waitPulse 1.5s ease-in-out infinite;
    }

    @keyframes waitPulse {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50%      { opacity: 1;   transform: scale(1); }
    }

    /* ── Agent action section ── */
    .agent-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: var(--nx-xl);
      animation: bootFadeIn 0.5s forwards;
    }

    .agent-action .action-header {
      color: var(--nx-primary);
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-md);
    }

    .agent-action .action-text {
      font-size: 13px;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-lg);
    }

    /* ── Skip button ── */
    .skip-btn {
      position: fixed;
      bottom: var(--nx-lg);
      right: var(--nx-lg);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-muted);
      cursor: pointer;
      padding: var(--nx-sm) var(--nx-md);
      border: var(--nx-thin) solid var(--nx-border);
      transition: all 0.15s;
      z-index: 10001;
      background: var(--nx-bg);
      font-family: var(--nx-font);
    }

    .skip-btn:hover {
      color: var(--nx-primary);
      border-color: var(--nx-primary);
    }

    /* ── Session info (terminal mode) ── */
    .session-info {
      position: fixed;
      bottom: var(--nx-lg);
      left: var(--nx-lg);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-muted);
      z-index: 10001;
    }

    .session-connected { color: var(--nx-primary); }
  `;

  // ── Hardcoded narrative ──

  static _logoSequence = [
    { text: '\u2588\u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557', cls: 'logo', delay: 40 },
    { text: '\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u255a\u2588\u2588\u2557\u2588\u2588\u2554\u255d\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d', cls: 'logo', delay: 40 },
    { text: '\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557   \u255a\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557', cls: 'logo', delay: 40 },
    { text: '\u2588\u2588\u2551\u255a\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d   \u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551   \u2588\u2588\u2551\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551', cls: 'logo', delay: 40 },
    { text: '\u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2554\u255d \u2588\u2588\u2557\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551', cls: 'logo', delay: 40 },
    { text: '\u255a\u2550\u255d  \u255a\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d', cls: 'logo', delay: 40 },
  ];

  static _narrativeSequence = [
    { text: '', cls: 'spacer', delay: 400 },
    { text: '> NEXUS v2.1.0', cls: 'dim', delay: 300 },
    { text: '> Establishing secure environment...', cls: 'dim', delay: 250 },
    { text: '', cls: 'spacer', delay: 200 },
    { text: '[ BRIEFING ]', cls: 'header', delay: 350 },
    { text: 'Welcome, Operative.', cls: '', delay: 250 },
    { text: '', cls: 'spacer', delay: 100 },
    { text: 'You are accessing the NEXUS network \u2014 a decentralized', cls: '', delay: 50 },
    { text: 'intelligence system designed for one purpose:', cls: '', delay: 50 },
    { text: 'to help you understand and protect your digital identity.', cls: 'primary', delay: 350 },
    { text: '', cls: 'spacer', delay: 150 },
    { text: '[ ARCHITECTURE ]', cls: 'header', delay: 400 },
    { text: 'This terminal is a "dumb" display \u2014 it holds no secrets.', cls: '', delay: 60 },
    { text: 'Your mobile device is your VAULT:', cls: '', delay: 60 },
    { text: '\u2022 Stores all credentials and keys', cls: 'indent dim', delay: 50 },
    { text: '\u2022 Holds downloaded intelligence', cls: 'indent dim', delay: 50 },
    { text: '\u2022 Never transmits data to servers', cls: 'indent dim', delay: 50 },
    { text: '', cls: 'spacer', delay: 100 },
    { text: 'Communication happens peer-to-peer. No middleman.', cls: 'primary', delay: 350 },
    { text: '', cls: 'spacer', delay: 150 },
    { text: '[ MISSION ]', cls: 'header', delay: 400 },
    { text: 'Investigate how your personal data flows through', cls: '', delay: 60 },
    { text: 'the digital world. You will:', cls: '', delay: 60 },
    { text: '\u2022 Intercept and decrypt intelligence files', cls: 'indent dim', delay: 50 },
    { text: '\u2022 Uncover connections between data points', cls: 'indent dim', delay: 50 },
    { text: '\u2022 Learn to protect your digital sovereignty', cls: 'indent dim', delay: 50 },
    { text: '', cls: 'spacer', delay: 150 },
    { text: '[ CONNECT ]', cls: 'header', delay: 400 },
    { text: 'To begin, authenticate with your mobile agent.', cls: '', delay: 60 },
    { text: 'Scan the QR code to establish a secure channel.', cls: 'primary', delay: 500 },
  ];

  constructor() {
    super();
    this.mode = 'terminal';
    this.qrValue = '';
    this.sessionId = '';
    this.active = false;

    this._phase = 'idle';
    this._logoLines = [];
    this._logLines = [];
    this._cursorVisible = false;
    this._cursorInLogo = true;
    this._hidden = false;
    this._animating = false;
  }

  updated(changed) {
    if (changed.has('active') && this.active && (this._phase === 'idle' || this._phase === 'done')) {
      this.start();
    }
    if (changed.has('_logLines') || changed.has('_phase')) {
      this._scrollToEnd();
    }
  }

  _scrollToEnd() {
    this.updateComplete.then(() => {
      const anchor = this.renderRoot?.querySelector('.scroll-anchor');
      if (anchor) anchor.scrollIntoView({ block: 'end' });
    });
  }

  // ── Public methods ──

  async start() {
    if (this._animating) return;
    this._animating = true;
    this._phase = 'narrative';
    this._logoLines = [];
    this._logLines = [];
    this._cursorVisible = true;
    this._cursorInLogo = true;
    this._hidden = false;

    await this._delay(600);

    // Logo phase
    for (const item of NexusBoot._logoSequence) {
      if (!this._animating) return;
      this._logoLines = [...this._logoLines, item];
      await this._delay(item.delay || 80);
    }

    // Narrative phase — cursor moves to log
    this._cursorInLogo = false;

    for (const item of NexusBoot._narrativeSequence) {
      if (!this._animating) return;
      this._logLines = [...this._logLines, item];
      await this._delay(item.delay || 80);
    }

    // Narrative done — show action
    this._cursorVisible = false;
    this._phase = 'action';
    this._animating = false;
  }

  skip() {
    this._animating = false;
    this._logoLines = [...NexusBoot._logoSequence];
    this._logLines = [];
    this._cursorVisible = false;
    this._cursorInLogo = false;
    this._phase = 'action';
    this.dispatchEvent(new CustomEvent('boot-skip', { bubbles: true, composed: true }));
  }

  async dismiss() {
    this._phase = 'fadeout';
    this._hidden = true;
    await this._delay(650);
    this._phase = 'done';
    this.dispatchEvent(new CustomEvent('boot-complete', { bubbles: true, composed: true }));
  }

  // ── Internal ──

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  _onContinue() {
    this.dismiss();
  }

  // ── Render ──

  render() {
    if (this._phase === 'idle' || this._phase === 'done') return null;

    return html`
      <div class="boot-overlay ${this._hidden ? 'hidden' : ''}">
        <div class="boot-content">
          ${this._logoLines.length ? html`
            <div class="boot-logo">
              ${this._logoLines.map((line, i) => html`<div class="boot-line ${line.cls || ''}">${line.text}${this._cursorInLogo && this._cursorVisible && i === this._logoLines.length - 1 ? html`<span class="boot-cursor"></span>` : null}</div>`)}
            </div>
          ` : null}

          <div class="boot-log">
            ${this._logLines.map((line, i) => html`<div class="boot-line ${line.cls || ''}">${line.text}${!this._cursorInLogo && this._cursorVisible && i === this._logLines.length - 1 ? html`<span class="boot-cursor"></span>` : null}</div>`)}
            ${this._phase === 'action' ? this._renderAction() : null}
            <div class="scroll-anchor"></div>
          </div>
        </div>

        ${this.mode === 'terminal' && this.sessionId ? html`
          <div class="session-info">
            Session: ${this.sessionId}
          </div>
        ` : null}

        ${this._phase === 'narrative' ? html`
          <button class="skip-btn" @click=${() => this.skip()}>Skip</button>
        ` : null}
      </div>
    `;
  }

  _renderAction() {
    if (this.mode === 'terminal') {
      return html`
        <div class="qr-section">
          <div class="qr-label">Agent Authentication Required</div>
          <div class="qr-wrapper">
            <nexus-qrcode .value=${this.qrValue} size="180"></nexus-qrcode>
          </div>
          <p class="qr-instructions">
            Open <strong>NEXUS Agent</strong> on your mobile device
            and scan this code to establish a secure connection.
          </p>
          <div class="waiting-indicator">
            <div class="waiting-dot"></div>
            <span>Awaiting agent connection</span>
          </div>
        </div>
      `;
    }

    // Agent mode
    return html`
      <div class="agent-action">
        <div class="action-header">[ READY ]</div>
        <div class="action-text">Your vault is initialized. Proceed to access your agent interface.</div>
        <nexus-button @click=${this._onContinue}>Continue</nexus-button>
      </div>
    `;
  }
}

customElements.define('nexus-boot', NexusBoot);
export { NexusBoot };
