/**
 * CYPHER Terminal App — Single-file state machine
 * Screens: connect → boot → main → locked
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { STATE, MSG } from '../../shared/utils/protocol.js';
import '../../shared/components/nexus-qrcode.js';
import '../../shared/components/nexus-header.js';
import '../../shared/components/nexus-avatar.js';
import '../../shared/components/nexus-button.js';

export class TerminalApp extends LitElement {
  static properties = {
    screen: { type: String },
    sessionId: { type: String },
    agentUrl: { type: String },
    profile: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--nx-bg, #000);
      color: var(--nx-fg, #fff);
      font-family: var(--nx-font, monospace);
    }

    /* ── Connect screen ── */
    .connect {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: var(--nx-lg, 1.5rem);
      padding: var(--nx-xl, 2rem);
    }

    .connect h2 {
      color: var(--nx-primary, #00FFCC);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg, 1rem);
      margin: 0;
    }

    .session-label {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .session-id {
      color: var(--nx-primary, #00FFCC);
      font-weight: bold;
      letter-spacing: 0.15em;
    }

    .waiting {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-muted, #555);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Boot screen ── */
    .boot {
      position: fixed;
      inset: 0;
      background: #000;
      padding: var(--nx-xl, 2rem);
      overflow-y: auto;
      z-index: 100;
    }

    .boot::before {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      );
      pointer-events: none;
      z-index: 101;
    }

    .boot::after {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
      pointer-events: none;
      z-index: 102;
    }

    #terminal {
      position: relative;
      z-index: 103;
      font-size: 0.95rem;
      line-height: 1.8;
      max-width: 800px;
      text-shadow: 0 0 5px rgba(0, 255, 204, 0.3);
    }

    #terminal .line {
      min-height: 1.8em;
      white-space: pre-wrap;
    }
    #terminal .line.success { color: #00FFCC; }
    #terminal .line.warning { color: #ffaa00; }
    #terminal .line.error { color: #ff4444; }
    #terminal .line.info { color: #555; }
    #terminal .line.highlight {
      color: #00FFCC;
      font-weight: bold;
      text-shadow: 0 0 15px rgba(0, 255, 204, 0.8);
      font-size: 1.1rem;
    }
    #terminal .line.big {
      font-size: 1.3rem;
      margin: 0.5rem 0;
    }

    #terminal .cursor {
      display: inline-block;
      width: 10px;
      height: 1.2em;
      background: #00FFCC;
      animation: blink 0.7s infinite;
      vertical-align: text-bottom;
      margin-left: 2px;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    #terminal .progress-bar {
      display: inline-block;
      width: 300px;
      height: 14px;
      background: #111;
      border: 1px solid #333;
      margin-left: 10px;
      vertical-align: middle;
    }

    #terminal .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00FFCC, #00CCAA);
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
    }

    /* ── Main screen ── */
    .main {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--nx-lg, 1.5rem);
      padding: var(--nx-xl, 2rem);
    }

    .agent-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-md, 1rem);
    }

    .agent-codename {
      color: var(--nx-primary, #00FFCC);
      font-size: var(--nx-text-lg, 1rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      text-shadow: var(--nx-glow);
    }

    .agent-level {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .status-connected {
      font-size: var(--nx-text-sm, 0.75rem);
      color: #00ff88;
      letter-spacing: 0.1em;
    }

    /* ── Locked screen ── */
    .locked {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: var(--nx-lg, 1.5rem);
      padding: var(--nx-xl, 2rem);
    }

    .locked-icon {
      font-size: 3rem;
      color: var(--nx-fg-muted, #555);
    }

    .locked h2 {
      color: var(--nx-fg-dim, #888);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg, 1rem);
      margin: 0;
    }

    .locked p {
      color: var(--nx-fg-muted, #555);
      font-size: var(--nx-text-sm, 0.75rem);
      text-align: center;
      max-width: 300px;
    }
  `;

  constructor() {
    super();
    this.screen = 'connect';
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this.profile = null;
    this.peerService = new PeerService();
    this._booting = false;

    this._setupPeerEvents();
  }

  connectedCallback() {
    super.connectedCallback();
    this.peerService.createTerminal(this.sessionId);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.peerService.destroy();
  }

  // ── Helpers ──

  _generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  _buildAgentUrl() {
    const basePath = window.location.pathname.replace(/\/terminal\/?.*$/, '');
    return `${window.location.origin}${basePath}/?session=${this.sessionId}`;
  }

  // ── Peer events ──

  _setupPeerEvents() {
    this.peerService.addEventListener('connected', () => {
      console.log('[Terminal] Agent connected');
    });

    this.peerService.addEventListener('data', e => {
      const { data } = e.detail;
      console.log('[Terminal] Received:', data);

      if (data.type === MSG.INIT_STATE && data.profile) {
        this.profile = data.profile;
        this.screen = 'boot';
      }
    });

    this.peerService.addEventListener('disconnected', () => {
      console.log('[Terminal] Agent disconnected');
      if (this.profile) {
        this.screen = 'locked';
      }
    });
  }

  // ── Screen transitions ──

  _onUnlock() {
    this.profile = null;
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._setupPeerEvents();
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this.peerService.createTerminal(this.sessionId);
    this.screen = 'connect';
  }

  // ── Boot sequence ──

  updated(changedProps) {
    if (changedProps.has('screen') && this.screen === 'boot' && !this._booting) {
      this._runBootSequence();
    }
  }

  async _runBootSequence() {
    this._booting = true;
    await this.updateComplete;

    const terminal = this.shadowRoot.getElementById('terminal');
    if (!terminal) { this._booting = false; return; }
    terminal.innerHTML = '';

    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    const addLine = async (text, className = '', typed = false, delay = 300) => {
      const div = document.createElement('div');
      div.className = `line ${className}`;
      terminal.appendChild(div);

      if (typed && text) {
        div.appendChild(cursor);
        await this._typeText(div, text, 25);
        if (cursor.parentNode === div) div.removeChild(cursor);
      } else {
        div.textContent = text;
      }

      const boot = this.shadowRoot.querySelector('.boot');
      if (boot) boot.scrollTop = boot.scrollHeight;
      await this._delay(delay);
    };

    const addProgress = async (label, duration = 2000) => {
      const div = document.createElement('div');
      div.className = 'line';

      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.style.width = '0%';
      bar.appendChild(fill);

      const pct = document.createElement('span');
      pct.textContent = ' 0%';

      div.appendChild(document.createTextNode(label + ' '));
      div.appendChild(bar);
      div.appendChild(pct);
      terminal.appendChild(div);

      const boot = this.shadowRoot.querySelector('.boot');
      if (boot) boot.scrollTop = boot.scrollHeight;

      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const percent = Math.round((i / steps) * 100);
        fill.style.width = percent + '%';
        pct.textContent = ' ' + percent + '%';
        await this._delay(duration / steps);
      }
      await this._delay(200);
    };

    await this._delay(500);

    const logo = [
      "░▒▓███████▓▒░░▒▓████████▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░       ░▒▓█▓▒▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░   ░▒▓███▓▒░  ░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░        ░▒▓█▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░       ░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░",
      "░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓██████▓▒░"
    ];

    for (const line of logo) {
      await addLine(line, 'highlight', false, 50);
    }

    await addLine('', '', false, 200);
    await addLine('NEXUS TERMINAL v2.1.0', 'info', false, 200);
    await addLine('Copyright (c) 2025 EU Digital Sovereignty Unit', 'info', false, 400);
    await addLine('', '', false, 300);

    await addLine('> Initializing secure connection...', '', true, 600);
    await addLine('', '', false, 200);

    const devId = Math.random().toString(36).substring(2, 6).toUpperCase();
    await addLine('[SYS] Scanning for agent device...', 'info', false, 800);
    await addLine('[SYS] Device found: MOBILE_AGENT_' + devId, 'info', false, 400);
    await addLine('[OK]  P2P tunnel established', 'success', false, 600);
    await addLine('', '', false, 300);

    await addLine('> Decrypting security handshake...', '', true, 500);
    await addProgress('[SYS] Decrypting', 2500);
    await addLine('[OK]  Encryption verified (AES-256-GCM)', 'success', false, 500);
    await addLine('', '', false, 300);

    await addLine('> Verifying agent credentials...', '', true, 600);
    await addLine('', '', false, 200);
    await addLine('[SYS] Agent ID: ' + this.profile.codename, 'warning', false, 400);
    await addLine('[SYS] Loading biometric signature...', 'info', false, 800);
    await addLine('[SYS] Matching against secure database...', 'info', false, 600);
    await addLine('[OK]  Biometric match confirmed', 'success', false, 500);
    await addLine('', '', false, 300);

    await addLine('> Configuring access permissions...', '', true, 600);
    await addProgress('[SYS] Loading clearance data', 1800);
    await addLine(`[SYS] Clearance level: ${this.profile.level || 1}`, 'warning', false, 400);
    await addLine('[OK]  Access permissions configured', 'success', false, 600);
    await addLine('', '', false, 400);

    await addLine('════════════════════════════════════════════════', 'info', false, 100);
    await addLine('', '', false, 200);
    await addLine('        ██████  ACCESS GRANTED  ██████', 'highlight big', false, 400);
    await addLine('', '', false, 200);
    await addLine(`           Welcome, Agent ${this.profile.codename}`, 'highlight', false, 400);
    await addLine('', '', false, 200);
    await addLine('════════════════════════════════════════════════', 'info', false, 100);
    await addLine('', '', false, 300);
    await addLine('[SYS] Launching terminal interface...', 'info', false, 800);

    await this._delay(1500);
    this._booting = false;
    this.screen = 'main';
  }

  async _typeText(element, text, speed = 30) {
    const textNode = document.createTextNode('');
    element.insertBefore(textNode, element.firstChild);

    for (let i = 0; i < text.length; i++) {
      textNode.textContent += text[i];
      if (text[i] !== ' ') {
        await this._delay(speed + Math.random() * 20);
      }
    }
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ── Render ──

  render() {
    switch (this.screen) {
      case 'connect': return this._renderConnect();
      case 'boot':    return this._renderBoot();
      case 'main':    return this._renderMain();
      case 'locked':  return this._renderLocked();
      default:        return this._renderConnect();
    }
  }

  _renderConnect() {
    return html`
      <div class="connect">
        <h2>CYPHER Terminal</h2>

        <nexus-qrcode
          .value=${this.agentUrl}
          size=${220}
          label="SCAN TO CONNECT"
        ></nexus-qrcode>

        <div>
          <span class="session-label">Session: </span>
          <span class="session-id">${this.sessionId}</span>
        </div>

        <div class="waiting">Waiting for agent...</div>
      </div>
    `;
  }

  _renderBoot() {
    return html`
      <div class="boot">
        <div id="terminal"></div>
      </div>
    `;
  }

  _renderMain() {
    return html`
      <div class="main">
        <nexus-header title="CYPHER">
          <span slot="status" class="status-connected">● CONNECTED</span>
        </nexus-header>

        <div class="main-content">
          <div class="agent-info">
            <nexus-avatar
              .src=${this.profile?.avatar || ''}
              .name=${this.profile?.codename || ''}
              size=${120}
            ></nexus-avatar>
            <div class="agent-codename">${this.profile?.codename}</div>
            <div class="agent-level">Clearance Level ${this.profile?.level || 1}</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderLocked() {
    return html`
      <div class="locked">
        <div class="locked-icon">⊘</div>
        <h2>Connection Lost</h2>
        <p>Agent device disconnected. Start a new session to reconnect.</p>
        <nexus-button @click=${this._onUnlock}>New Session</nexus-button>
      </div>
    `;
  }
}

customElements.define('terminal-app', TerminalApp);
