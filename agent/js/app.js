/**
 * CYPHER Agent App — Single-file state machine
 * Screens: setup → scanner → main
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { storageService } from '../../shared/services/storage-service.js';
import { MSG } from '../../shared/utils/protocol.js';
import '../../shared/components/nexus-scanner.js';
import '../../shared/components/nexus-avatar.js';
import '../../shared/components/nexus-input.js';
import '../../shared/components/nexus-button.js';
import '../../shared/components/nexus-header.js';

export class AgentApp extends LitElement {
  static properties = {
    screen: { type: String },
    profile: { type: Object },
    sessionId: { type: String },
    _codename: { type: String, state: true },
    _avatarSrc: { type: String, state: true },
    _scannerActive: { type: Boolean, state: true },
    _connectionStatus: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--nx-bg, #000);
      color: var(--nx-fg, #fff);
      font-family: var(--nx-font, monospace);
    }

    /* ── Setup screen ── */
    .setup {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-xl, 2rem) var(--nx-md, 1rem);
      gap: var(--nx-lg, 1.5rem);
      min-height: 100vh;
    }

    .setup h2 {
      color: var(--nx-primary, #00FFCC);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg, 1rem);
      margin: 0;
    }

    .setup-subtitle {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      text-align: center;
      max-width: 280px;
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-md, 1rem);
      width: 100%;
      max-width: 300px;
    }

    .setup-form nexus-input {
      width: 100%;
    }

    /* ── Scanner screen ── */
    .scanner {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-xl, 2rem) var(--nx-md, 1rem);
      gap: var(--nx-lg, 1.5rem);
      min-height: 100vh;
    }

    .scanner h2 {
      color: var(--nx-primary, #00FFCC);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg, 1rem);
      margin: 0;
    }

    .scanner-greeting {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
    }

    .scanner-greeting strong {
      color: var(--nx-primary, #00FFCC);
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
      padding: var(--nx-xl, 2rem) var(--nx-md, 1rem);
    }

    .profile-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--nx-md, 1rem);
    }

    .profile-codename {
      color: var(--nx-primary, #00FFCC);
      font-size: var(--nx-text-lg, 1rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      text-shadow: var(--nx-glow);
    }

    .profile-level {
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

    .status-connecting {
      font-size: var(--nx-text-sm, 0.75rem);
      color: var(--nx-fg-dim, #888);
      letter-spacing: 0.1em;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Loading screen ── */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: var(--nx-fg-dim, #888);
      font-size: var(--nx-text-sm, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  `;

  constructor() {
    super();
    this.screen = 'loading';
    this.profile = null;
    this.sessionId = null;
    this._codename = '';
    this._avatarSrc = '';
    this._scannerActive = false;
    this._connectionStatus = '';
    this.peerService = new PeerService();

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
    this.peerService.destroy();
  }

  // ── Init ──

  async _init() {
    const profile = await storageService.getProfile();

    if (!profile) {
      this.screen = 'setup';
    } else {
      this.profile = profile;
      if (this.sessionId) {
        // Has session from QR URL — connect directly
        this.screen = 'main';
        this._connectToTerminal();
      } else {
        this.screen = 'scanner';
        // Activate scanner after render
        await this.updateComplete;
        this._scannerActive = true;
      }
    }
  }

  // ── Setup screen handlers ──

  _onCodenameInput(e) {
    this._codename = e.detail?.value ?? '';
  }

  _onAvatarConfirmed(e) {
    this._avatarSrc = e.detail.src;
  }

  async _onSaveProfile() {
    const codename = (this._codename || '').trim();
    if (!codename) return;

    const profile = {
      codename,
      level: 1,
      avatar: this._avatarSrc || '',
    };

    await storageService.saveProfile(profile);
    this.profile = profile;

    if (this.sessionId) {
      this.screen = 'main';
      this._connectToTerminal();
    } else {
      this.screen = 'scanner';
      await this.updateComplete;
      this._scannerActive = true;
    }
  }

  // ── Scanner screen handlers ──

  _onScanSuccess(e) {
    this._scannerActive = false;
    const scannedData = e.detail.data;

    // Extract session ID from URL
    try {
      const url = new URL(scannedData);
      const session = url.searchParams.get('session');
      if (session) {
        this.sessionId = session;
        this.screen = 'main';
        this._connectToTerminal();
        return;
      }
    } catch {
      // Not a URL — try using raw data as session ID
    }

    // Fallback: use raw scanned data as session ID
    this.sessionId = scannedData;
    this.screen = 'main';
    this._connectToTerminal();
  }

  // ── Connection ──

  _connectToTerminal() {
    this._connectionStatus = 'connecting';

    this.peerService.addEventListener('connected', () => {
      console.log('[Agent] Connected to terminal');
      this._connectionStatus = 'connected';

      // Send profile to terminal
      this.peerService.send({
        type: MSG.INIT_STATE,
        profile: this.profile,
      });
    });

    this.peerService.addEventListener('disconnected', () => {
      console.log('[Agent] Disconnected from terminal');
      this._onDisconnect();
    });

    this.peerService.addEventListener('error', e => {
      console.error('[Agent] Peer error:', e.detail.error);
    });

    this.peerService.connectAsAgent(this.sessionId);
  }

  _onDisconnect() {
    this.peerService.destroy();
    this.peerService = new PeerService();
    this.sessionId = null;
    this._connectionStatus = '';

    // Clear session from URL
    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);

    this.screen = 'scanner';
    this.updateComplete.then(() => {
      this._scannerActive = true;
    });
  }

  _onDisconnectClick() {
    this._onDisconnect();
  }

  // ── Render ──

  render() {
    switch (this.screen) {
      case 'setup':   return this._renderSetup();
      case 'scanner': return this._renderScanner();
      case 'main':    return this._renderMain();
      default:        return this._renderLoading();
    }
  }

  _renderLoading() {
    return html`<div class="loading">Initializing...</div>`;
  }

  _renderSetup() {
    const canSave = (this._codename || '').trim().length > 0;

    return html`
      <div class="setup">
        <h2>CYPHER</h2>
        <p class="setup-subtitle">Create your agent profile to begin.</p>

        <nexus-avatar
          size=${140}
          .src=${this._avatarSrc}
          .name=${this._codename}
          editable
          @avatar-confirmed=${this._onAvatarConfirmed}
        ></nexus-avatar>

        <div class="setup-form">
          <nexus-input
            label="Codename"
            placeholder="Enter your codename"
            .value=${this._codename}
            @input=${this._onCodenameInput}
          ></nexus-input>

          <nexus-button
            ?disabled=${!canSave}
            @click=${this._onSaveProfile}
          >Save Profile</nexus-button>
        </div>
      </div>
    `;
  }

  _renderScanner() {
    return html`
      <div class="scanner">
        <h2>CYPHER</h2>

        ${this.profile ? html`
          <p class="scanner-greeting">
            Agent <strong>${this.profile.codename}</strong> — scan terminal QR to connect.
          </p>
        ` : null}

        <nexus-scanner
          ?active=${this._scannerActive}
          size=${280}
          label="TERMINAL QR"
          @scan-success=${this._onScanSuccess}
        ></nexus-scanner>
      </div>
    `;
  }

  _renderMain() {
    const isConnected = this._connectionStatus === 'connected';

    return html`
      <div class="main">
        <nexus-header title="CYPHER">
          <span slot="status" class="${isConnected ? 'status-connected' : 'status-connecting'}">
            ${isConnected ? '● CONNECTED' : '● CONNECTING...'}
          </span>
        </nexus-header>

        <div class="main-content">
          <div class="profile-card">
            <nexus-avatar
              .src=${this.profile?.avatar || ''}
              .name=${this.profile?.codename || ''}
              size=${100}
            ></nexus-avatar>
            <div class="profile-codename">${this.profile?.codename}</div>
            <div class="profile-level">Clearance Level ${this.profile?.level || 1}</div>
          </div>

          ${isConnected ? html`
            <nexus-button variant="secondary" @click=${this._onDisconnectClick}>
              Disconnect
            </nexus-button>
          ` : null}
        </div>
      </div>
    `;
  }
}

customElements.define('agent-app', AgentApp);
