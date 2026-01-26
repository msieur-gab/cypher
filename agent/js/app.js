/**
 * NEXUS Agent App — Mobile vault interface
 * State machine: loading → boot → setup (new) / lock (returning) → main
 *                                                                   ↕ sub-apps (profile, intel, comms, settings)
 *                                                                   ↕ scanner sheet (nexus-overlay)
 *                                                                   → lock (on lock action)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { storageService } from '../../shared/services/storage-service.js';
import { MSG, TERM_MSG } from '../../shared/utils/protocol.js';
import { generateMnemonic, deriveIdentity, encrypt } from '../../shared/utils/crypto.js';
import '../../shared/components/nexus-boot.js';
import '../../shared/components/nexus-scanner.js';
import '../../shared/components/nexus-avatar.js';
import '../../shared/components/nexus-input.js';
import '../../shared/components/nexus-button.js';
import '../../shared/components/nexus-overlay.js';
import '../../shared/components/nexus-toast.js';
import '../../shared/components/nexus-status-badge.js';
import '../../shared/components/nexus-desktop-icon.js';
import '../../shared/components/nexus-dock.js';
import '../../shared/components/nexus-file-browser.js';
import '../../shared/components/nexus-list.js';
import '../../shared/components/nexus-list-item.js';
import '../../shared/components/nexus-markdown.js';
import '../../shared/components/nexus-view.js';
import '../../shared/components/nexus-card.js';
import { requestWakeLock, releaseWakeLock } from './utils/wakelock.js';

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
    _downloads:        { type: Array, state: true },
    _selectedIntel:    { type: Object, state: true },
    _agentId:          { type: String, state: true },
    _identity:         { type: Object, state: true },   // { did, publicKey } or null
    _vaultOpen:        { type: Boolean, state: true },   // secure vault overlay
    _vaultStep:        { type: String, state: true },    // generate | mnemonic | confirm | done
    _mnemonic:         { type: String, state: true },
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

    .disconnect-btn {
      --nx-fg-dim: var(--nx-danger, #ff4444);
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
      text-align: center;
    }

    nexus-card {
      margin-top: var(--nx-lg);
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

    /* ========== Vault Activation ========== */
    .vault-content {
      padding: var(--nx-lg);
      text-align: center;
    }

    .vault-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-sm);
    }

    .vault-desc {
      font-size: 11px;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-lg);
      line-height: 1.6;
    }

    .vault-warning {
      font-size: 10px;
      color: var(--nx-danger, #ff4444);
      border: var(--nx-thin) solid var(--nx-danger, #ff4444);
      padding: var(--nx-sm) var(--nx-md);
      margin-bottom: var(--nx-lg);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mnemonic-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-sm);
      margin-bottom: var(--nx-lg);
      text-align: left;
    }

    .mnemonic-word {
      font-size: 12px;
      padding: var(--nx-xs) var(--nx-sm);
      border: var(--nx-thin) solid var(--nx-border);
      background: var(--nx-bg-raised);
    }

    .mnemonic-word .num {
      color: var(--nx-fg-muted);
      font-size: 9px;
      margin-right: var(--nx-xs);
    }

    .vault-did {
      font-size: 9px;
      color: var(--nx-primary);
      word-break: break-all;
      padding: var(--nx-sm);
      border: var(--nx-thin) solid var(--nx-primary);
      margin-bottom: var(--nx-md);
      text-align: left;
      font-family: var(--nx-font);
    }

    .vault-did-label {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xs);
    }

    .vault-check {
      font-size: 32px;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow-lg);
      margin-bottom: var(--nx-md);
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
    this._downloads = [];
    this._selectedIntel = null;
    this._agentId = '';
    this._identity = null;
    this._vaultOpen = false;
    this._vaultStep = 'generate';
    this._mnemonic = '';
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
    releaseWakeLock();
    if (this._clockInterval) clearInterval(this._clockInterval);
    this.peerService.destroy();
  }

  // ── Init ──

  async _init() {
    // Always show boot splash first; store profile for routing after boot
    this._loadedProfile = await storageService.getProfile();
    this.screen = 'boot';
  }

  async _onBootComplete() {
    if (!this._loadedProfile) {
      // New user — go to setup
      this.screen = 'setup';
    } else {
      this.profile = this._loadedProfile;
      this._agentId = 'AG-' + Math.floor(1000 + Math.random() * 9000) + '-X';

      // Load identity if exists
      try {
        const id = await storageService.getIdentity();
        if (id) this._identity = { did: id.did, publicKey: id.publicKey };
      } catch { /* empty */ }

      if (this.sessionId) {
        // Has session from QR URL — skip lock, go to main and auto-connect
        this.screen = 'main';
        requestWakeLock();
        this._connectToTerminal();
        try { this._downloads = await storageService.getDownloads(); } catch { /* empty */ }
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

  async _unlock() {
    this.screen = 'main';
    requestWakeLock();

    // Load downloads
    try {
      this._downloads = await storageService.getDownloads();
    } catch { /* empty */ }
  }

  // ── App Navigation ──

  _openApp(id) {
    this.activeApp = id;
  }

  _closeApp() {
    this.activeApp = null;
    this._selectedIntel = null;
  }

  _goHome() {
    this.activeApp = null;
  }

  _lockDevice() {
    releaseWakeLock();
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

    if (!this._peerListenersBound) {
      this._peerListenersBound = true;

      this.peerService.addEventListener('connected', () => {
        this._connectionStatus = 'online';
        this._toast('Terminal connected', 'success');

        this.peerService.send({
          type: MSG.INIT_STATE,
          profile: this.profile,
          did: this._identity?.did || null,
        });
      });

      this.peerService.addEventListener('disconnected', () => {
        this._connectionStatus = 'offline';
        this._toast('Terminal disconnected', 'warning');
      });

      this.peerService.addEventListener('data', async (e) => {
        const { data } = e.detail;
        if (data.type === 'FILE_CONTENT') {
          try {
            await storageService.saveDownload({
              filename: data.filename,
              path: data.path,
              content: data.content,
            });
            this._downloads = await storageService.getDownloads();
            this._toast(`Intel acquired: ${data.filename}`, 'success');
          } catch (err) {
            console.error('[Agent] Failed to save download:', err);
            this._toast('Failed to save intel', 'error');
          }
        }
        if (data.type === TERM_MSG.MISSION_TRIGGER && data.mission === 'SECURE_VAULT') {
          if (!this._identity) {
            this._toast('Vault breach detected — secure your identity', 'warning');
            this._openSecureVault();
          }
        }
      });

      this.peerService.addEventListener('error', e => {
        console.error('[Agent] Peer error:', e.detail.error);
        this._connectionStatus = 'offline';
      });
    }

    this.peerService.connectAsAgent(this.sessionId);
  }

  // ── Vault Activation (DID) ──

  _openSecureVault() {
    this._vaultStep = 'generate';
    this._mnemonic = '';
    this._vaultOpen = true;
  }

  _closeVault() {
    this._vaultOpen = false;
  }

  async _generateVaultKeys() {
    this._vaultStep = 'generating';
    try {
      const mnemonic = await generateMnemonic();
      this._mnemonic = mnemonic;
      this._vaultStep = 'mnemonic';
    } catch (err) {
      console.error('[Agent] Key generation failed:', err);
      this._toast('Key generation failed', 'error');
      this._vaultStep = 'generate';
    }
  }

  _mnemonicConfirmed() {
    this._vaultStep = 'confirm';
  }

  async _activateVault() {
    this._vaultStep = 'activating';
    try {
      const identity = await deriveIdentity(this._mnemonic);

      // Encrypt private key with storage key before persisting
      const encryptedKey = await encrypt(identity.storageKey, identity.privateKey);

      await storageService.saveIdentity({
        did: identity.did,
        publicKey: identity.publicKey,
        encryptedKey,
        storageKey: identity.storageKey,
      });

      // Update profile with DID and bump clearance
      await storageService.updateDid(identity.did);
      const newLevel = Math.max((this.profile?.level || 1) + 1, 2);
      await storageService.updateLevel(newLevel);

      this.profile = { ...this.profile, did: identity.did, level: newLevel };
      this._identity = { did: identity.did, publicKey: identity.publicKey };

      this._vaultStep = 'done';
      this._toast('Vault secured — DID activated', 'success');
    } catch (err) {
      console.error('[Agent] Vault activation failed:', err);
      this._toast('Vault activation failed', 'error');
      this._vaultStep = 'confirm';
    }
  }

  _finishVault() {
    this._vaultOpen = false;
    this._mnemonic = '';  // Clear sensitive data from memory
  }

  // ── Disconnect ──

  _disconnectTerminal() {
    releaseWakeLock();
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._peerListenersBound = false;
    this._connectionStatus = 'offline';
    this.sessionId = null;

    // Clear session from URL
    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);

    this._toast('Terminal disconnected', 'info');
  }

  // ── Reset ──

  async _resetAgent() {
    releaseWakeLock();
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._peerListenersBound = false;
    await storageService.clearProfile();
    await storageService.clearDownloads();
    await storageService.clearIdentity();

    this.profile = null;
    this.sessionId = null;
    this.activeApp = null;
    this._connectionStatus = 'offline';
    this._codename = '';
    this._avatarSrc = '';
    this._downloads = [];
    this._identity = null;
    this._mnemonic = '';
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

      <!-- Vault Activation Sheet -->
      <nexus-overlay
        variant="sheet"
        title="Secure Vault"
        ?open=${this._vaultOpen}
        @close=${this._vaultStep === 'done' ? this._finishVault : this._closeVault}
      >
        ${this._renderVaultContent()}
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
      <nexus-boot
        mode="agent"
        ?active=${this.screen === 'boot'}
        @boot-complete=${this._onBootComplete}
      ></nexus-boot>
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

        <!-- Sub-App Views (nexus-view handles visibility via ?active) -->
        ${this._renderProfileApp()}
        ${this._renderIntelApp()}
        ${this._renderCommsApp()}
        ${this._renderSettingsApp()}

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
          ${this._connectionStatus !== 'offline' ? html`
            <nexus-dock-item
              slot="end"
              class="disconnect-btn"
              label="End"
              @dock-item-click=${this._disconnectTerminal}
            >
              <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </nexus-dock-item>
          ` : null}
        </nexus-dock>
      </div>
    `;
  }

  _renderProfileApp() {
    return html`
      <nexus-view title="Agent Profile" ?active=${this.activeApp === 'profile'} @close=${this._closeApp}>
        <div class="profile-card">
          <nexus-avatar
            size="100"
            .src=${this.profile?.avatar || ''}
            .name=${this.profile?.codename || ''}
          ></nexus-avatar>
          <div class="profile-codename">${this.profile?.codename || 'AGENT'}</div>
          <div class="profile-level">Clearance Level ${this.profile?.level || 1}</div>
          ${this._identity ? html`
            <div class="vault-did-label" style="margin-top: var(--nx-md);">DID</div>
            <div class="vault-did" style="font-size: 8px;">${this._identity.did}</div>
          ` : html`
            <div style="margin-top: var(--nx-md);">
              <nexus-button variant="secondary" style="width: 100%;" @click=${this._openSecureVault}>
                Secure Vault
              </nexus-button>
            </div>
          `}
          <nexus-card>
            <div class="profile-stats">
              <div><div class="stat-value">0</div><div class="stat-label">Missions</div></div>
              <div><div class="stat-value">${this._downloads.length}</div><div class="stat-label">Intel</div></div>
              <div><div class="stat-value">--</div><div class="stat-label">Rating</div></div>
            </div>
          </nexus-card>
        </div>
      </nexus-view>
    `;
  }

  _renderIntelApp() {
    return html`
      <nexus-view title="Downloaded Intel" ?active=${this.activeApp === 'intel'} @close=${this._closeApp}>
        ${this._downloads.length === 0 ? html`
          <div class="comms-empty">
            <div class="comms-empty-title">No intel downloaded</div>
            <div class="comms-empty-sub">Connect to Terminal to access files</div>
          </div>
        ` : html`
          <nexus-file-browser
            style="height: 100%;"
            @selection-change=${this._onIntelSelect}
          >
            <nexus-list slot="list" selectable>
              ${this._downloads.map(dl => html`
                <nexus-list-item
                  icon="file"
                  label=${dl.filename}
                  meta="${this._formatTime(dl.downloadedAt)} — ${dl.content?.length || 0} bytes"
                ></nexus-list-item>
              `)}
            </nexus-list>
            ${this._selectedIntel ? html`
              <nexus-markdown
                slot="detail"
                .content=${this._selectedIntel.content || ''}
                .filename=${this._selectedIntel.filename || ''}
              ></nexus-markdown>
            ` : null}
          </nexus-file-browser>
        `}
      </nexus-view>
    `;
  }

  _onIntelSelect(e) {
    const idx = e.detail.index;
    if (idx >= 0 && idx < this._downloads.length) {
      this._selectedIntel = this._downloads[idx];
    }
  }

  _renderVaultContent() {
    switch (this._vaultStep) {
      case 'generate':
        return html`
          <div class="vault-content">
            <div class="vault-title">Vault Compromised</div>
            <div class="vault-desc">
              Your data is stored unencrypted. Anyone with access to this device
              can read your intel files and profile data.
            </div>
            <div class="vault-warning">
              Activate decentralized identity to secure your vault
            </div>
            <nexus-button variant="primary" style="width: 100%;" @click=${this._generateVaultKeys}>
              Generate Identity Keys
            </nexus-button>
          </div>
        `;

      case 'generating':
        return html`
          <div class="vault-content">
            <div class="vault-title">Generating Keys...</div>
            <div class="vault-desc">
              Deriving Ed25519 key pair and AES-256-GCM storage key.
            </div>
          </div>
        `;

      case 'mnemonic':
        return html`
          <div class="vault-content">
            <div class="vault-title">Recovery Phrase</div>
            <div class="vault-desc">
              Write down these 12 words in order. This is the only way to
              recover your identity if your vault is destroyed.
            </div>
            <div class="mnemonic-grid">
              ${this._mnemonic.split(' ').map((word, i) => html`
                <div class="mnemonic-word">
                  <span class="num">${i + 1}.</span>${word}
                </div>
              `)}
            </div>
            <div class="vault-warning">
              Do not share this phrase. Do not store it digitally.
            </div>
            <nexus-button variant="primary" style="width: 100%;" @click=${this._mnemonicConfirmed}>
              I Have Saved My Phrase
            </nexus-button>
          </div>
        `;

      case 'confirm':
        return html`
          <div class="vault-content">
            <div class="vault-title">Activate Encryption</div>
            <div class="vault-desc">
              Your recovery phrase is your last line of defense.
              Once activated, all vault data will be encrypted with AES-256-GCM
              and your identity secured with an Ed25519 DID.
            </div>
            <nexus-button variant="primary" style="width: 100%;" @click=${this._activateVault}>
              Activate Secure Vault
            </nexus-button>
            <nexus-button variant="ghost" style="width: 100%; margin-top: var(--nx-sm);" @click=${() => { this._vaultStep = 'mnemonic'; }}>
              Show Phrase Again
            </nexus-button>
          </div>
        `;

      case 'activating':
        return html`
          <div class="vault-content">
            <div class="vault-title">Activating...</div>
            <div class="vault-desc">
              Deriving identity and encrypting vault storage.
            </div>
          </div>
        `;

      case 'done':
        return html`
          <div class="vault-content">
            <div class="vault-check">[OK]</div>
            <div class="vault-title">Vault Secured</div>
            <div class="vault-did-label">Your Decentralized Identity</div>
            <div class="vault-did">${this._identity?.did || ''}</div>
            <div class="vault-desc">
              Clearance level upgraded. Your vault is now encrypted.
            </div>
            <nexus-button variant="primary" style="width: 100%;" @click=${this._finishVault}>
              Continue
            </nexus-button>
          </div>
        `;

      default:
        return null;
    }
  }

  _renderCommsApp() {
    return html`
      <nexus-view title="Communications" ?active=${this.activeApp === 'comms'} @close=${this._closeApp}>
        <div class="comms-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div class="comms-empty-title">No messages</div>
          <div class="comms-empty-sub">Connect to Terminal to receive comms</div>
        </div>
      </nexus-view>
    `;
  }

  _renderSettingsApp() {
    return html`
      <nexus-view title="Configuration" ?active=${this.activeApp === 'settings'} @close=${this._closeApp}>
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
          <span class="settings-value" style=${this._identity ? '' : 'color: var(--nx-danger, #ff4444)'}>
            ${this._identity ? 'AES-256-GCM' : 'NONE'}
          </span>
        </div>
        <div class="settings-item">
          <span class="settings-label">DID</span>
          <span class="settings-value" style="font-size: 9px; max-width: 180px; overflow: hidden; text-overflow: ellipsis;">
            ${this._identity?.did || 'Not activated'}
          </span>
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
      </nexus-view>
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
