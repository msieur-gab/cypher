/**
 * NEXUS Agent App — Mobile vault interface
 * State machine: loading → boot → setup (new) / lock (returning) → main
 *                                                                   ↕ sub-apps (profile, intel, comms, settings)
 *                                                                   ↕ scanner sheet (nexus-overlay)
 *                                                                   → lock (on lock action)
 */
import { LitElement, html } from 'https://esm.sh/lit@3';
import { storageService } from '../../shared/services/storage-service.js';
import { ClockController } from '../../shared/controllers/clock-controller.js';
import { ToastController } from '../../shared/controllers/toast-controller.js';
import { ConnectionManager } from './services/connection-manager.js';
import { VaultService } from './services/vault-service.js';
import { relativeTime } from '../../shared/utils/format.js';
import { agentAppStyles } from './styles/app-styles.js';
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
import { icons } from '../../shared/components/nexus-icons.js';

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
    _downloads:        { type: Array, state: true },
    _selectedIntel:    { type: Object, state: true },
    _agentId:          { type: String, state: true },
    _identity:         { type: Object, state: true },   // { did, publicKey } or null
    _vaultOpen:        { type: Boolean, state: true },
    _vaultStep:        { type: String, state: true },    // generate | mnemonic | confirm | done
    _mnemonic:         { type: String, state: true },
  };

  static styles = agentAppStyles;

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
    this._downloads = [];
    this._selectedIntel = null;
    this._agentId = '';
    this._identity = null;
    this._vaultOpen = false;
    this._vaultStep = 'generate';
    this._mnemonic = '';
    this._swipeState = { active: false, startX: 0 };

    // Controllers
    this._clock = new ClockController(this);
    this._toast = new ToastController(this);

    // Services
    this._connectionManager = new ConnectionManager();
    this._vaultService = new VaultService();

    this._setupConnectionEvents();

    // Parse session from URL
    const params = new URLSearchParams(window.location.search);
    this.sessionId = params.get('session');
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._connectionManager.destroy();
  }

  // ── Connection events ──

  _setupConnectionEvents() {
    this._connectionManager.addEventListener('status-change', (e) => {
      const oldStatus = this._connectionStatus;
      const { status } = e.detail;
      this._connectionStatus = status;

      if (status === 'online' && oldStatus !== 'online') {
        this._toast.show('Terminal connected', 'success');
      } else if (status === 'offline' && oldStatus !== 'offline') {
        this._toast.show('Terminal disconnected', 'warning');
      }
    });

    this._connectionManager.addEventListener('file-received', (e) => {
      this._downloads = e.detail.downloads;
      this._toast.show(`Intel acquired: ${e.detail.filename}`, 'success');
    });

    this._connectionManager.addEventListener('error', (e) => {
      if (e.detail.context === 'save-download') {
        this._toast.show('Failed to save intel', 'error');
      }
    });

    this._connectionManager.addEventListener('mission-trigger', (e) => {
      if (e.detail.mission === 'SECURE_VAULT' && !this._identity) {
        this._toast.show('Vault breach detected — secure your identity', 'warning');
        this._openSecureVault();
      }
    });
  }

  // ── Init ──

  async _init() {
    this._loadedProfile = await storageService.getProfile();
    this.screen = 'boot';
  }

  async _onBootComplete() {
    if (!this._loadedProfile) {
      this.screen = 'setup';
    } else {
      this.profile = this._loadedProfile;
      this._agentId = 'AG-' + Math.floor(1000 + Math.random() * 9000) + '-X';

      this._identity = await this._vaultService.loadIdentity();

      if (this.sessionId) {
        this.screen = 'main';
        this._connectToTerminal();
        try { this._downloads = await storageService.getDownloads(); } catch { /* empty */ }
      } else {
        this.screen = 'lock';
      }
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

    this._toast.show(`Agent ${codename} initialized`, 'success');
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
    this._connectionManager.connect(this.sessionId, {
      profile: this.profile,
      did: this._identity?.did || null,
    });
  }

  _disconnectTerminal() {
    this._connectionManager.disconnect();
    this.sessionId = null;

    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);
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
      this._mnemonic = await this._vaultService.generateKeys();
      this._vaultStep = 'mnemonic';
    } catch (err) {
      console.error('[Agent] Key generation failed:', err);
      this._toast.show('Key generation failed', 'error');
      this._vaultStep = 'generate';
    }
  }

  _mnemonicConfirmed() {
    this._vaultStep = 'confirm';
  }

  async _activateVault() {
    this._vaultStep = 'activating';
    try {
      const result = await this._vaultService.activate(this._mnemonic, this.profile);
      this.profile = result.profile;
      this._identity = result.identity;
      this._vaultStep = 'done';
      this._toast.show('Vault secured — DID activated', 'success');
    } catch (err) {
      console.error('[Agent] Vault activation failed:', err);
      this._toast.show('Vault activation failed', 'error');
      this._vaultStep = 'confirm';
    }
  }

  _finishVault() {
    this._vaultOpen = false;
    this._mnemonic = '';
  }

  // ── Reset ──

  async _resetAgent() {
    this._connectionManager.destroy();
    this._connectionManager = new ConnectionManager();
    this._setupConnectionEvents();

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
        <div class="lock-time">${this._clock.time}</div>
        <div class="lock-date">${this._clock.date}</div>

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
          <div class="clock">${this._clock.time}</div>
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
              <svg slot="icon" viewBox="0 0 24 24" fill="none">${icons.power}</svg>
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
                  meta="${relativeTime(dl.downloadedAt)} — ${dl.content?.length || 0} bytes"
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
}

customElements.define('agent-app', AgentApp);
