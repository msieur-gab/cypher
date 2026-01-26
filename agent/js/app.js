/**
 * NEXUS Agent App — Mobile vault interface
 * State machine: loading → setup → lock → boot → main
 *                                             ↕ sub-apps (profile, intel, comms, settings)
 *                                             ↕ scanner sheet (nexus-overlay)
 *                                             → lock (on lock action)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { storageService } from '../../shared/services/storage-service.js';
import { MSG } from '../../shared/utils/protocol.js';
import '../../shared/components/nexus-scanner.js';
import '../../shared/components/nexus-avatar.js';
import '../../shared/components/nexus-input.js';
import '../../shared/components/nexus-button.js';
import '../../shared/components/nexus-overlay.js';
import '../../shared/components/nexus-toast.js';
import '../../shared/components/nexus-status-badge.js';
import '../../shared/components/nexus-desktop-icon.js';
import '../../shared/components/nexus-dock.js';

export class AgentApp extends LitElement {
  static properties = {
    screen:            { type: String },   // loading | setup | lock | boot | main
    activeApp:         { type: String },   // null | profile | intel | comms | settings
    profile:           { type: Object },
    sessionId:         { type: String },
    _codename:         { type: String, state: true },
    _avatarSrc:        { type: String, state: true },
    _scannerOpen:      { type: Boolean, state: true },
    _connectionStatus: { type: String, state: true },  // offline | connecting | online
    _clockTime:        { type: String, state: true },
    _clockDate:        { type: String, state: true },
    _bootLines:        { type: Array, state: true },
    _bootCursor:       { type: Boolean, state: true },
    _downloads:        { type: Array, state: true },
    _agentId:          { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: var(--nx-bg);
      color: var(--nx-fg);
      font-family: var(--nx-font);
    }

    .agent-app {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ========== Loading ========== */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--nx-fg-dim);
      font-size: var(--nx-text-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ========== Setup View ========== */
    .setup-view {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--nx-lg);
    }

    .setup-title {
      font-size: 24px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      margin-bottom: var(--nx-xs);
    }

    .setup-subtitle {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xl);
    }

    .setup-form {
      width: 100%;
      max-width: 280px;
    }

    .setup-form .form-group {
      margin-bottom: var(--nx-md);
    }

    .setup-form .form-label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-xs);
    }

    .setup-badge {
      display: inline-block;
      background: var(--nx-primary);
      color: var(--nx-bg);
      padding: 4px 12px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: var(--nx-md) 0;
    }

    /* ========== Lock Screen ========== */
    .lock-screen {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 1500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .lock-time {
      font-size: 4rem;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow-lg);
      margin-bottom: var(--nx-xs);
    }

    .lock-date {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: var(--nx-xl);
    }

    .lock-avatar {
      margin-bottom: var(--nx-md);
    }

    .lock-codename {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-fg);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xl);
    }

    .lock-status {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-lg);
    }

    /* Swipe track */
    .swipe-track {
      width: 200px;
      height: 44px;
      border: var(--nx-thin) solid var(--nx-primary);
      display: flex;
      align-items: center;
      padding: 4px;
      position: relative;
    }

    .swipe-handle {
      width: 36px;
      height: 36px;
      background: var(--nx-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--nx-bg);
      font-size: 14px;
      cursor: pointer;
      box-shadow: var(--nx-glow);
      touch-action: none;
      user-select: none;
    }

    .swipe-text {
      position: absolute;
      width: 100%;
      text-align: center;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-fg-muted);
      pointer-events: none;
    }

    /* ========== Boot Screen ========== */
    .boot-screen {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 1400;
      display: flex;
      flex-direction: column;
      padding: var(--nx-lg);
      overflow: hidden;
    }

    .boot-header {
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-sm);
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }

    .boot-log {
      flex: 1;
      font-size: 12px;
      line-height: 1.8;
      overflow-y: auto;
    }

    .boot-line {
      opacity: 0;
      animation: bootFadeIn 0.15s forwards;
      white-space: nowrap;
    }

    .boot-line.dim { color: var(--nx-fg-dim); }
    .boot-line.success { color: var(--nx-primary); }

    .boot-cursor {
      display: inline-block;
      width: 8px;
      height: 14px;
      background: var(--nx-primary);
      animation: blink 0.8s step-end infinite;
      vertical-align: text-bottom;
      margin-left: 2px;
    }

    @keyframes bootFadeIn {
      to { opacity: 1; }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* ========== Main UI ========== */
    .main-ui {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Status bar */
    .status-bar {
      height: 36px;
      background: var(--nx-bg);
      border-bottom: var(--nx-thin) solid var(--nx-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--nx-md);
      font-size: 11px;
      flex-shrink: 0;
    }

    .status-bar .system-name {
      display: flex;
      align-items: center;
      gap: var(--nx-xs);
      font-weight: bold;
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }

    .status-bar .clock {
      color: var(--nx-fg-dim);
    }

    /* Main area */
    .main-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--nx-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Icon grid */
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-lg);
      max-width: 300px;
      justify-items: center;
    }

    /* App screens */
    .app-screen {
      position: fixed;
      top: 36px;
      left: 0;
      right: 0;
      bottom: 64px;
      background: var(--nx-bg);
      z-index: 50;
      display: flex;
      flex-direction: column;
    }

    .app-header {
      height: 44px;
      border-bottom: var(--nx-thin) solid var(--nx-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--nx-md);
      background: var(--nx-bg-raised);
      flex-shrink: 0;
    }

    .app-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .app-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--nx-md);
    }

    /* Profile content */
    .profile-card {
      text-align: center;
      padding: var(--nx-md);
    }

    .profile-codename {
      font-size: 20px;
      font-weight: bold;
      margin-top: var(--nx-md);
    }

    .profile-level {
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-md);
      margin-top: var(--nx-lg);
      padding: var(--nx-md);
      border: var(--nx-thin) solid var(--nx-border);
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: var(--nx-primary);
    }

    .stat-label {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
    }

    /* Intel list */
    .intel-item {
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-bottom: var(--nx-sm);
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .intel-item:active {
      border-color: var(--nx-primary);
    }

    .intel-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-xs);
    }

    .intel-item-name {
      font-size: 12px;
      font-weight: bold;
    }

    .intel-item-badge {
      font-size: 9px;
      padding: 2px 6px;
      border: var(--nx-thin) solid var(--nx-primary);
      text-transform: uppercase;
    }

    .intel-item-meta {
      font-size: 10px;
      color: var(--nx-fg-muted);
    }

    /* Settings */
    .settings-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--nx-md) 0;
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }

    .settings-label { font-size: 12px; }
    .settings-value { font-size: 11px; color: var(--nx-fg-dim); }

    /* Comms empty state */
    .comms-empty {
      text-align: center;
      padding: var(--nx-xl);
      color: var(--nx-fg-muted);
    }

    .comms-empty svg {
      margin-bottom: var(--nx-md);
      opacity: 0.4;
    }

    .comms-empty-title {
      font-size: 11px;
      text-transform: uppercase;
    }

    .comms-empty-sub {
      font-size: 10px;
      margin-top: var(--nx-sm);
    }

    /* Scanner content */
    .scanner-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-lg);
    }

    .scanner-hint {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-align: center;
      margin-top: var(--nx-md);
    }

    /* Override nexus-dock to sit in the flex layout */
    nexus-dock {
      position: relative;
      left: auto;
      right: auto;
      bottom: auto;
      z-index: auto;
      pointer-events: auto;
    }
  `;

  // ── Boot sequence lines ──

  _bootSequence = [
    { text: 'NEXUS AGENT OS v2.1.0', cls: 'success' },
    { text: 'Initializing secure environment...', cls: 'dim' },
    { text: '[OK] Cryptographic modules loaded', cls: '' },
    { text: '[OK] Secure enclave verified', cls: '' },
    { text: '[OK] Agent credentials validated', cls: '' },
    { text: 'Loading profile...', cls: 'dim' },
    { text: '[OK] Memory isolation active', cls: '' },
    { text: '[OK] Network stack initialized', cls: '' },
    { text: 'Scanning for Terminal signals...', cls: 'dim' },
    { text: '[--] No Terminal detected', cls: 'dim' },
    { text: '[OK] Offline mode enabled', cls: '' },
    { text: 'System ready.', cls: 'success' },
    { text: '> Entering main interface...', cls: 'success' },
  ];

  constructor() {
    super();
    this.screen = 'loading';
    this.activeApp = null;
    this.profile = null;
    this.sessionId = null;
    this._codename = '';
    this._avatarSrc = '';
    this._scannerOpen = false;
    this._connectionStatus = 'offline';
    this._clockTime = '00:00';
    this._clockDate = '';
    this._bootLines = [];
    this._bootCursor = false;
    this._downloads = [];
    this._agentId = '';
    this._clockInterval = null;
    this._swipeState = { active: false, startX: 0 };
    this.peerService = new PeerService();

    // Parse session from URL
    const params = new URLSearchParams(window.location.search);
    this.sessionId = params.get('session');
  }

  async connectedCallback() {
    super.connectedCallback();
    this._startClock();
    await this._init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._clockInterval) clearInterval(this._clockInterval);
    this.peerService.destroy();
  }

  // ── Init ──

  async _init() {
    const profile = await storageService.getProfile();

    if (!profile) {
      this.screen = 'setup';
    } else {
      this.profile = profile;
      this._agentId = 'AG-' + Math.floor(1000 + Math.random() * 9000) + '-X';

      if (this.sessionId) {
        // Has session from QR URL — skip to main and auto-connect
        this.screen = 'main';
        this._connectToTerminal();
      } else {
        this.screen = 'lock';
      }
    }
  }

  // ── Clock ──

  _startClock() {
    this._updateClock();
    this._clockInterval = setInterval(() => this._updateClock(), 1000);
  }

  _updateClock() {
    const now = new Date();
    this._clockTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    this._clockDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // ── Toast helper ──

  _toast(message, variant = 'info') {
    const container = this.renderRoot.querySelector('nexus-toast-container');
    if (container) {
      container.add(message, { variant, duration: 3000 });
    }
  }

  // ── Setup ──

  _onCodenameInput(e) {
    this._codename = e.detail?.value ?? e.target?.value ?? '';
  }

  _onAvatarConfirmed(e) {
    this._avatarSrc = e.detail.src;
  }

  async _completeSetup() {
    const codename = (this._codename || '').trim().toUpperCase();
    if (!codename) return;

    const profile = {
      codename,
      level: 1,
      avatar: this._avatarSrc || '',
    };

    await storageService.saveProfile(profile);
    this.profile = profile;
    this._agentId = 'AG-' + Math.floor(1000 + Math.random() * 9000) + '-X';

    this._toast(`Agent ${codename} initialized`, 'success');
    this.screen = 'lock';
  }

  // ── Lock Screen ──

  _onSwipeStart(e) {
    const touch = e.touches?.[0] || e;
    this._swipeState = { active: true, startX: touch.clientX };
  }

  _onSwipeMove(e) {
    if (!this._swipeState.active) return;
    const touch = e.touches?.[0] || e;
    const handle = this.renderRoot.querySelector('.swipe-handle');
    const track = this.renderRoot.querySelector('.swipe-track');
    if (!handle || !track) return;

    let dx = touch.clientX - this._swipeState.startX;
    const maxX = track.offsetWidth - handle.offsetWidth - 8;
    dx = Math.max(0, Math.min(dx, maxX));
    handle.style.transform = `translateX(${dx}px)`;

    if (dx >= maxX) {
      this._swipeState.active = false;
      this._unlock();
    }
  }

  _onSwipeEnd() {
    if (this._swipeState.active) {
      const handle = this.renderRoot.querySelector('.swipe-handle');
      if (handle) handle.style.transform = 'translateX(0)';
      this._swipeState.active = false;
    }
  }

  _unlock() {
    this._runBoot();
  }

  // ── Boot Sequence ──

  async _runBoot() {
    this.screen = 'boot';
    this._bootLines = [];
    this._bootCursor = true;

    // Update profile line
    this._bootSequence[5] = {
      text: `Loading profile: ${this.profile?.codename || 'AGENT'}`,
      cls: 'dim',
    };

    for (const line of this._bootSequence) {
      this._bootLines = [...this._bootLines, line];
      const delay = line.cls === 'dim' ? 450 : 180;
      await this._delay(delay);
    }

    // Boot complete
    this._bootCursor = false;
    await this._delay(600);
    this.screen = 'main';

    // Load downloads
    try {
      this._downloads = await storageService.getDownloads();
    } catch { /* empty */ }
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ── App Navigation ──

  _openApp(id) {
    this.activeApp = id;
  }

  _closeApp() {
    this.activeApp = null;
  }

  _goHome() {
    this.activeApp = null;
  }

  _lockDevice() {
    this.activeApp = null;
    this.screen = 'lock';
  }

  // ── Scanner ──

  _openScanner() {
    this._scannerOpen = true;
  }

  _closeScanner() {
    this._scannerOpen = false;
  }

  _onScanSuccess(e) {
    this._scannerOpen = false;
    const scannedData = e.detail.data;

    // Extract session ID from URL or use raw data
    try {
      const url = new URL(scannedData);
      const session = url.searchParams.get('session');
      if (session) {
        this.sessionId = session;
        this._connectToTerminal();
        return;
      }
    } catch { /* not a URL */ }

    this.sessionId = scannedData;
    this._connectToTerminal();
  }

  // ── Connection ──

  _connectToTerminal() {
    this._connectionStatus = 'connecting';

    this.peerService.addEventListener('connected', () => {
      this._connectionStatus = 'online';
      this._toast('Terminal connected', 'success');

      this.peerService.send({
        type: MSG.INIT_STATE,
        profile: this.profile,
      });
    });

    this.peerService.addEventListener('disconnected', () => {
      this._connectionStatus = 'offline';
      this._toast('Terminal disconnected', 'warning');
    });

    this.peerService.addEventListener('data', e => {
      const { data } = e.detail;
      // Handle incoming data from terminal
      if (data.type === 'FILE_CONTENT') {
        this._toast('Intel received');
      }
    });

    this.peerService.addEventListener('error', e => {
      console.error('[Agent] Peer error:', e.detail.error);
      this._connectionStatus = 'offline';
    });

    this.peerService.connectAsAgent(this.sessionId);
  }

  // ── Reset ──

  async _resetAgent() {
    this.peerService.destroy();
    this.peerService = new PeerService();
    await storageService.clearProfile();
    await storageService.clearDownloads();

    this.profile = null;
    this.sessionId = null;
    this.activeApp = null;
    this._connectionStatus = 'offline';
    this._codename = '';
    this._avatarSrc = '';
    this._downloads = [];
    this.screen = 'setup';

    // Clear session from URL
    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);
  }

  // ── Render ──

  render() {
    return html`
      <div class="agent-app">
        ${this.screen === 'loading' ? this._renderLoading() : null}
        ${this.screen === 'setup' ? this._renderSetup() : null}
        ${this.screen === 'lock' ? this._renderLock() : null}
        ${this.screen === 'boot' ? this._renderBoot() : null}
        ${this.screen === 'main' ? this._renderMain() : null}
      </div>

      <!-- Scanner Bottom Sheet -->
      <nexus-overlay
        variant="sheet"
        title="Terminal Scanner"
        ?open=${this._scannerOpen}
        @close=${this._closeScanner}
      >
        <div class="scanner-content">
          <nexus-scanner
            ?active=${this._scannerOpen}
            size="220"
            label="Scan QR Code"
            @scan-success=${this._onScanSuccess}
          ></nexus-scanner>
          <p class="scanner-hint">
            Point camera at Terminal QR code to establish secure connection
          </p>
        </div>
        <nexus-button slot="footer" variant="secondary" @click=${this._closeScanner}>
          Cancel
        </nexus-button>
      </nexus-overlay>

      <!-- Toast Container -->
      <nexus-toast-container position="bottom-center"></nexus-toast-container>
    `;
  }

  _renderLoading() {
    return html`<div class="loading">Initializing...</div>`;
  }

  _renderSetup() {
    const canSave = (this._codename || '').trim().length > 0;

    return html`
      <div class="setup-view">
        <h1 class="setup-title">NEXUS</h1>
        <p class="setup-subtitle">Agent Registration</p>

        <nexus-avatar
          size="120"
          editable
          .src=${this._avatarSrc}
          .name=${this._codename}
          @avatar-confirmed=${this._onAvatarConfirmed}
        ></nexus-avatar>

        <div class="setup-form">
          <div class="form-group">
            <label class="form-label">Codename</label>
            <nexus-input
              placeholder="Enter codename"
              .value=${this._codename}
              @input=${this._onCodenameInput}
            ></nexus-input>
          </div>

          <div class="setup-badge">Clearance Level 1</div>

          <nexus-button
            variant="primary"
            style="width: 100%; margin-top: var(--nx-md);"
            ?disabled=${!canSave}
            @click=${this._completeSetup}
          >Initialize Agent</nexus-button>
        </div>
      </div>
    `;
  }

  _renderLock() {
    const statusMap = { offline: 'offline', connecting: 'connecting', online: 'online' };

    return html`
      <div class="lock-screen">
        <div class="lock-time">${this._clockTime}</div>
        <div class="lock-date">${this._clockDate}</div>

        <div class="lock-avatar">
          <nexus-avatar
            size="80"
            .src=${this.profile?.avatar || ''}
            .name=${this.profile?.codename || ''}
          ></nexus-avatar>
        </div>
        <div class="lock-codename">${this.profile?.codename || 'AGENT'}</div>

        <div class="lock-status">
          <nexus-status-badge
            status=${statusMap[this._connectionStatus] || 'offline'}
            label="Terminal"
          ></nexus-status-badge>
        </div>

        <div class="swipe-track">
          <span class="swipe-text">Slide to unlock</span>
          <div
            class="swipe-handle"
            @touchstart=${this._onSwipeStart}
            @touchmove=${this._onSwipeMove}
            @touchend=${this._onSwipeEnd}
            @click=${this._unlock}
          >&rarr;</div>
        </div>
      </div>
    `;
  }

  _renderBoot() {
    return html`
      <div class="boot-screen">
        <div class="boot-header">System Boot Sequence</div>
        <div class="boot-log">
          ${this._bootLines.map((line, i) => html`
            <div class="boot-line ${line.cls || ''}">
              ${line.text}${i === this._bootLines.length - 1 && this._bootCursor
                ? html`<span class="boot-cursor"></span>`
                : null}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  _renderMain() {
    return html`
      <div class="main-ui">
        <!-- Status Bar -->
        <div class="status-bar">
          <div class="system-name">
            <nexus-status-badge
              status=${this._connectionStatus === 'online' ? 'online' : this._connectionStatus === 'connecting' ? 'connecting' : 'offline'}
              size="sm"
            ></nexus-status-badge>
            <span>NEXUS</span>
          </div>
          <div class="clock">${this._clockTime}</div>
        </div>

        <!-- Main Area (icon grid) -->
        <div class="main-area">
          <div class="icon-grid">
            <nexus-desktop-icon
              icon="scan"
              label="Scan"
              @icon-click=${this._openScanner}
            ></nexus-desktop-icon>
            <nexus-desktop-icon
              icon="user"
              label="Profile"
              @icon-click=${() => this._openApp('profile')}
            ></nexus-desktop-icon>
            <nexus-desktop-icon
              icon="fileText"
              label="Intel"
              @icon-click=${() => this._openApp('intel')}
            ></nexus-desktop-icon>
            <nexus-desktop-icon
              icon="message"
              label="Comms"
              @icon-click=${() => this._openApp('comms')}
            ></nexus-desktop-icon>
            <nexus-desktop-icon
              icon="settings"
              label="Config"
              @icon-click=${() => this._openApp('settings')}
            ></nexus-desktop-icon>
            <nexus-desktop-icon
              icon="lock"
              label="Lock"
              @icon-click=${this._lockDevice}
            ></nexus-desktop-icon>
          </div>
        </div>

        <!-- Sub-App Screens -->
        ${this.activeApp ? this._renderActiveApp() : null}

        <!-- Dock -->
        <nexus-dock>
          <nexus-dock-item
            label="Home"
            ?active=${!this.activeApp}
            @dock-item-click=${this._goHome}
          >
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </nexus-dock-item>
          <nexus-dock-item
            label="Scan"
            @dock-item-click=${this._openScanner}
          >
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            </svg>
          </nexus-dock-item>
          <nexus-dock-item
            label="Intel"
            ?active=${this.activeApp === 'intel'}
            @dock-item-click=${() => this._openApp('intel')}
          >
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </nexus-dock-item>
        </nexus-dock>
      </div>
    `;
  }

  _renderActiveApp() {
    switch (this.activeApp) {
      case 'profile':  return this._renderProfileApp();
      case 'intel':    return this._renderIntelApp();
      case 'comms':    return this._renderCommsApp();
      case 'settings': return this._renderSettingsApp();
      default:         return null;
    }
  }

  _renderProfileApp() {
    return html`
      <div class="app-screen">
        <div class="app-header">
          <span class="app-title">Agent Profile</span>
          <nexus-button variant="ghost" icon="close" icon-only @click=${this._closeApp}></nexus-button>
        </div>
        <div class="app-body">
          <div class="profile-card">
            <nexus-avatar
              size="100"
              .src=${this.profile?.avatar || ''}
              .name=${this.profile?.codename || ''}
            ></nexus-avatar>
            <div class="profile-codename">${this.profile?.codename || 'AGENT'}</div>
            <div class="profile-level">Clearance Level ${this.profile?.level || 1}</div>
            <div class="profile-stats">
              <div><div class="stat-value">0</div><div class="stat-label">Missions</div></div>
              <div><div class="stat-value">${this._downloads.length}</div><div class="stat-label">Intel</div></div>
              <div><div class="stat-value">--</div><div class="stat-label">Rating</div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderIntelApp() {
    return html`
      <div class="app-screen">
        <div class="app-header">
          <span class="app-title">Downloaded Intel</span>
          <nexus-button variant="ghost" icon="close" icon-only @click=${this._closeApp}></nexus-button>
        </div>
        <div class="app-body">
          ${this._downloads.length > 0
            ? this._downloads.map(dl => html`
                <div class="intel-item">
                  <div class="intel-item-header">
                    <span class="intel-item-name">${dl.filename}</span>
                    <span class="intel-item-badge">Intel</span>
                  </div>
                  <div class="intel-item-meta">
                    Downloaded ${this._formatTime(dl.downloadedAt)} — ${dl.content?.length || 0} bytes
                  </div>
                </div>
              `)
            : html`
                <div class="comms-empty">
                  <div class="comms-empty-title">No intel downloaded</div>
                  <div class="comms-empty-sub">Connect to Terminal to access files</div>
                </div>
              `
          }
        </div>
      </div>
    `;
  }

  _renderCommsApp() {
    return html`
      <div class="app-screen">
        <div class="app-header">
          <span class="app-title">Communications</span>
          <nexus-button variant="ghost" icon="close" icon-only @click=${this._closeApp}></nexus-button>
        </div>
        <div class="app-body">
          <div class="comms-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div class="comms-empty-title">No messages</div>
            <div class="comms-empty-sub">Connect to Terminal to receive comms</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderSettingsApp() {
    return html`
      <div class="app-screen">
        <div class="app-header">
          <span class="app-title">Configuration</span>
          <nexus-button variant="ghost" icon="close" icon-only @click=${this._closeApp}></nexus-button>
        </div>
        <div class="app-body">
          <div class="settings-item">
            <span class="settings-label">Terminal Status</span>
            <nexus-status-badge
              status=${this._connectionStatus === 'online' ? 'online' : 'offline'}
              size="sm"
              label=${this._connectionStatus === 'online' ? 'Connected' : 'Disconnected'}
            ></nexus-status-badge>
          </div>
          <div class="settings-item">
            <span class="settings-label">Agent ID</span>
            <span class="settings-value">${this._agentId || 'AG-0000-X'}</span>
          </div>
          <div class="settings-item">
            <span class="settings-label">Encryption</span>
            <span class="settings-value">AES-256-GCM</span>
          </div>
          <div class="settings-item">
            <span class="settings-label">Version</span>
            <span class="settings-value">2.1.0</span>
          </div>
          <div style="margin-top: var(--nx-xl);">
            <nexus-button
              variant="secondary"
              style="width: 100%;"
              @click=${this._resetAgent}
            >Reset Agent</nexus-button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Helpers ──

  _formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}

customElements.define('agent-app', AgentApp);
