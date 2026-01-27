/**
 * NEXUS Terminal App — Desktop OS interface
 * State machine: boot → desktop → locked
 *
 * Boot: narrative text + QR code → agent connects → fade to desktop
 * Desktop: header, icon grid, window manager, dock
 * Locked: connection lost, new session
 */
import { LitElement, html } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { STATE, MSG } from '../../shared/utils/protocol.js';
import { TerminalFS } from './services/terminal-fs.js';
import { WindowManager } from './services/window-manager.js';
import { ClockController } from '../../shared/controllers/clock-controller.js';
import { ToastController } from '../../shared/controllers/toast-controller.js';
import { INTEL_FILES } from './data/intel-files.js';
import { terminalAppStyles } from './styles/app-styles.js';
import '../../shared/components/nexus-boot.js';
import '../../shared/components/nexus-qrcode.js';
import '../../shared/components/nexus-header.js';
import '../../shared/components/nexus-avatar.js';
import '../../shared/components/nexus-button.js';
import '../../shared/components/nexus-dock.js';
import '../../shared/components/nexus-desktop-icon.js';
import '../../shared/components/nexus-window.js';
import '../../shared/components/nexus-file-browser.js';
import '../../shared/components/nexus-list.js';
import '../../shared/components/nexus-list-item.js';
import '../../shared/components/nexus-terminal.js';
import '../../shared/components/nexus-toast.js';
import '../../shared/components/nexus-input.js';

export class TerminalApp extends LitElement {
  static properties = {
    screen:             { type: String },   // boot | desktop | locked
    profile:            { type: Object },
    sessionId:          { type: String },
    agentUrl:           { type: String },
    _desktopPattern:    { type: String, state: true },
    _crtActive:         { type: Boolean, state: true },
    _ready:             { type: Boolean, state: true },
    _connectionStatus:  { type: String, state: true },
    _openWindowIds:     { type: Object, state: true },
  };

  static styles = terminalAppStyles;

  // ── App definitions ──

  _appDefs = {
    intel:        { title: 'Intel Browser',    width: 700, height: 450 },
    terminal:     { title: 'Terminal',          width: 500, height: 350 },
    config:       { title: 'Configuration',     width: 420, height: 420 },
    comms:        { title: 'Communications',    width: 450, height: 300 },
    agentStatus:  { title: 'Agent Status',      width: 320, height: 360 },
  };

  constructor() {
    super();
    this.screen = 'boot';
    this.profile = null;
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this._desktopPattern = 'scanlines';
    this._crtActive = false;
    this._ready = false;
    this._connectionStatus = 'offline';
    this._openWindowIds = {};

    // Controllers
    this._clock = new ClockController(this, { seconds: true });
    this._toast = new ToastController(this);

    // Services
    this.peerService = new PeerService();
    this._windowManager = new WindowManager(
      {
        getLayer: () => this.renderRoot.querySelector('.window-layer'),
        getContent: (id) => this._getWindowContent(id),
        setupBehavior: (id, win) => this._setupWindowBehavior(id, win),
        onOpenChange: (ids) => { this._openWindowIds = ids; },
      },
      this._appDefs,
    );

    this._setupPeerEvents();
  }

  connectedCallback() {
    super.connectedCallback();

    if (new URLSearchParams(window.location.search).has('dev')) {
      this.profile = { codename: 'DEV', level: 1, avatar: '' };
      this.screen = 'boot';
      this.updateComplete.then(() => {
        const boot = this.renderRoot.querySelector('nexus-boot');
        if (boot) boot.dismiss();
      });
      return;
    }

    this.peerService.createTerminal(this.sessionId);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.peerService.destroy();
  }

  // ── Helpers ──

  _generateSessionId() {
    return 'NX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  _buildAgentUrl() {
    const basePath = window.location.pathname.replace(/\/terminal\/?.*$/, '');
    return `${window.location.origin}${basePath}/?session=${this.sessionId}`;
  }

  // ── Peer events ──

  _setupPeerEvents() {
    this.peerService.addEventListener('connected', () => {
      console.log('[Terminal] Agent connected');
      this._connectionStatus = 'online';
    });

    this.peerService.addEventListener('data', e => {
      const { data } = e.detail;
      if (data.type === MSG.INIT_STATE && data.profile) {
        this.profile = data.profile;
        this._onAgentConnected();
      }
    });

    this.peerService.addEventListener('disconnected', () => {
      console.log('[Terminal] Agent disconnected');
      this._connectionStatus = 'offline';
      this._windowManager.close('agentStatus');
      if (this.profile) {
        this.screen = 'locked';
      }
    });
  }

  async _onAgentConnected() {
    this._connectionStatus = 'online';

    const boot = this.renderRoot.querySelector('nexus-boot');
    if (boot) boot.dismiss();

    const name = this.profile?.codename || 'AGENT';
    this._toast.show(`Agent ${name} connected — secure channel established`, 'success');
  }

  _applyReadyClasses() {
    const header = this.renderRoot.querySelector('nexus-header');
    const dock = this.renderRoot.querySelector('nexus-dock');
    const icons = this.renderRoot.querySelectorAll('nexus-desktop-icon');

    if (header) header.classList.add('ready');
    setTimeout(() => dock?.classList.add('ready'), 100);
    icons.forEach((icon, i) => {
      setTimeout(() => icon.classList.add('ready'), 200 + i * 100);
    });
  }

  _onBootComplete() {
    this.screen = 'desktop';

    requestAnimationFrame(async () => {
      this._ready = true;
      await this.updateComplete;
      this._applyReadyClasses();

      setTimeout(() => this._windowManager.open('agentStatus'), 600);
      setTimeout(() => this._windowManager.open('intel'), 1000);
    });
  }

  // ── Window Content ──

  _getWindowContent(id) {
    switch (id) {
      case 'intel':       return this._getIntelContent();
      case 'terminal':    return this._getTerminalContent();
      case 'config':      return this._getConfigContent();
      case 'comms':       return this._getCommsContent();
      case 'agentStatus': return this._getAgentStatusContent();
      default:            return '';
    }
  }

  _getIntelContent() {
    const files = INTEL_FILES;
    return `
      <nexus-file-browser list-width="220px" style="height: 100%;">
        <span slot="list-header">Files <span style="color: var(--nx-primary);">(${files.length})</span></span>
        <nexus-list slot="list" id="intel-list">
          ${files.map((f, i) => `
            <nexus-list-item
              icon="file"
              label="${f.name}"
              meta="${f.type} - ${f.size}"
              data-index="${i}"
            ></nexus-list-item>
          `).join('')}
        </nexus-list>
        <span slot="detail-header">Preview</span>
        <div slot="detail" id="intel-preview">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--nx-fg-muted);font-size:var(--nx-text-sm);text-transform:uppercase;letter-spacing:0.1em;">
            Select a file to preview
          </div>
        </div>
      </nexus-file-browser>
    `;
  }

  _getTerminalContent() {
    return `
      <nexus-terminal
        id="app-terminal"
        prompt=">"
        greeting="NEXUS Terminal v2.1.0&#10;(c) 2025 EU Digital Sovereignty Unit&#10;&#10;Type 'help' for available commands."
      ></nexus-terminal>
    `;
  }

  _getConfigContent() {
    const patterns = ['dither', 'grid', 'scanlines', 'matrix', 'hex', 'none'];
    const labels = { dither: 'Dither', grid: 'Dots', scanlines: 'Scan', matrix: 'Matrix', hex: 'Hex', none: 'None' };

    return `
      <div style="padding: var(--nx-md);">
        <div class="setup-section">
          <div class="setup-title">Desktop Pattern</div>
          <div class="pattern-grid">
            ${patterns.map(p => `
              <div class="pattern-preview ${p === this._desktopPattern ? 'active' : ''}"
                   data-pattern="${p}"
                   data-action="set-pattern">
                <div class="pattern-label">${labels[p]}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="setup-section">
          <div class="setup-title">System Info</div>
          <div class="sys-info">
            NEXUS Terminal v2.1.0<br>
            Connection: P2P WebRTC<br>
            Encryption: AES-256-GCM<br>
            Agent Status: <span class="val">${this._connectionStatus === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    `;
  }

  _getCommsContent() {
    const isOnline = this._connectionStatus === 'online';
    const codename = this.profile?.codename || '--';
    return `
      <div class="comms-panel">
        <div class="comms-header">
          <div class="comms-title">SECURE CHANNEL</div>
          <div class="comms-subtitle">End-to-End Encrypted</div>
        </div>
        <div class="comms-stats">
          <div class="comms-row">
            <span class="comms-label">Status:</span>
            <span class="comms-value highlight">${isOnline ? 'ENCRYPTED' : 'OFFLINE'}</span>
          </div>
          <div class="comms-row">
            <span class="comms-label">Agent:</span>
            <span class="comms-value ${isOnline ? 'highlight' : ''}">${isOnline ? codename : '--'}</span>
          </div>
          <div class="comms-row">
            <span class="comms-label">Protocol:</span>
            <span class="comms-value">P2P-AES256</span>
          </div>
          <div class="comms-row">
            <span class="comms-label">Latency:</span>
            <span class="comms-value">${isOnline ? '42ms' : '--'}</span>
          </div>
          <div class="comms-row">
            <span class="comms-label">Signal:</span>
            <span class="comms-value highlight">${isOnline ? 'STRONG' : 'NONE'}</span>
          </div>
        </div>
        <div class="comms-empty">No new messages.</div>
      </div>
    `;
  }

  _getAgentStatusContent() {
    const p = this.profile;
    const codename = p?.codename || 'UNKNOWN';
    const level = p?.level || 1;
    const avatar = p?.avatar || '';
    const isOnline = this._connectionStatus === 'online';

    const levelLabels = {
      1: 'OPERATIVE',
      2: 'FIELD AGENT',
      3: 'SENIOR AGENT',
      4: 'HANDLER',
      5: 'DIRECTOR',
    };
    const levelLabel = levelLabels[level] || `LEVEL ${level}`;

    return `
      <div class="agent-status-panel">
        <div class="agent-avatar">
          ${avatar
            ? `<img src="${avatar}" alt="${codename}">`
            : `<div class="agent-avatar-placeholder">&#x2298;</div>`}
        </div>
        <div class="agent-codename">${codename}</div>
        <div class="agent-level">Clearance: ${levelLabel}</div>
        <div class="agent-details">
          <div class="agent-detail-row">
            <span class="agent-detail-label">Status:</span>
            <span class="agent-detail-value online">${isOnline ? 'CONNECTED' : 'OFFLINE'}</span>
          </div>
          <div class="agent-detail-row">
            <span class="agent-detail-label">Channel:</span>
            <span class="agent-detail-value">P2P ENCRYPTED</span>
          </div>
          <div class="agent-detail-row">
            <span class="agent-detail-label">Session:</span>
            <span class="agent-detail-value">${this.sessionId}</span>
          </div>
          <div class="agent-detail-row">
            <span class="agent-detail-label">Accreditation:</span>
            <span class="agent-detail-value">Level ${level}</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Window Behavior Setup ──

  _setupWindowBehavior(id, win) {
    if (id === 'intel') this._setupIntelBrowser(win);
    if (id === 'terminal') this._setupTerminalApp(win);
    if (id === 'config') this._setupConfig(win);
  }

  _setupIntelBrowser(win) {
    const list = win.querySelector('#intel-list');
    const preview = win.querySelector('#intel-preview');
    if (!list || !preview) return;

    list.addEventListener('selection-change', e => {
      const index = e.detail.index;
      const files = INTEL_FILES;
      if (index >= 0 && index < files.length) {
        const file = files[index];
        preview.innerHTML = `
          <div class="preview-content">
            <div class="preview-header">
              <div class="preview-title">${file.title}</div>
              <div class="preview-meta">
                <span class="preview-classification ${file.classification}">${file.classification}</span>
                <span>${file.size}</span>
              </div>
            </div>
            <div class="preview-body">${file.content}</div>
            <div class="preview-tags">
              ${file.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}
            </div>
            <div class="preview-actions">
              <nexus-button>Download</nexus-button>
              <nexus-button variant="secondary">Export</nexus-button>
            </div>
          </div>
        `;
      }
    });
  }

  _setupTerminalApp(win) {
    const terminal = win.querySelector('#app-terminal');
    if (!terminal) return;

    if (!this._terminalFS) {
      this._terminalFS = new TerminalFS(terminal, this.peerService);
    } else {
      this._terminalFS.setTerminal(terminal);
    }

    terminal.addEventListener('command', e => {
      e.preventDefault();
      this._terminalFS.execute(e.detail.command);
    });
  }

  _setupConfig(win) {
    win.addEventListener('click', e => {
      const preview = e.target.closest('[data-action="set-pattern"]');
      if (preview) {
        const pattern = preview.dataset.pattern;
        this._desktopPattern = pattern;

        win.querySelectorAll('.pattern-preview').forEach(el => {
          el.classList.toggle('active', el.dataset.pattern === pattern);
        });
      }
    });
  }

  // ── Desktop Actions ──

  _toggleCRT() {
    this._crtActive = !this._crtActive;
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // ── Locked / Reset ──

  _onNewSession() {
    this._windowManager.closeAll();

    this.profile = null;
    this._ready = false;
    this._connectionStatus = 'offline';

    this.peerService.destroy();
    this.peerService = new PeerService();
    this._setupPeerEvents();
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this.peerService.createTerminal(this.sessionId);

    this.screen = 'boot';
  }

  // ── Render ──

  render() {
    return html`
      <!-- Desktop (always rendered) -->
      <div class="desktop">
        <nexus-header title="NEXUS">
          <span slot="menu">File</span>
          <span slot="menu">System</span>
          <span slot="menu">Help</span>
          <div slot="status" class="header-right">
            <span class="status-text ${this._connectionStatus === 'online' ? 'online' : ''}">
              AGENT: ${this._connectionStatus === 'online' ? 'CONNECTED' : 'OFFLINE'}
            </span>
            <span>${this._clock.time}</span>
            <button
              class="crt-toggle ${this._crtActive ? 'active' : ''}"
              @click=${this._toggleCRT}
            >CRT</button>
            <nexus-button variant="ghost" icon="fullscreen" icon-only
              @click=${this._toggleFullscreen}></nexus-button>
          </div>
        </nexus-header>

        <main class="desktop-area" data-pattern=${this._desktopPattern}>
          <!-- Left icons -->
          <nav class="icon-grid left" aria-label="Desktop shortcuts">
            <nexus-desktop-icon icon="settings" label="Config"
              @icon-open=${() => this._windowManager.open('config')}></nexus-desktop-icon>
            <nexus-desktop-icon icon="fileText" label="Intel"
              @icon-open=${() => this._windowManager.open('intel')}></nexus-desktop-icon>
          </nav>

          <!-- Right icons -->
          <nav class="icon-grid right" aria-label="Desktop shortcuts">
            <nexus-desktop-icon icon="database" label="Database" disabled></nexus-desktop-icon>
            <nexus-desktop-icon icon="terminal" label="Terminal"
              @icon-open=${() => this._windowManager.open('terminal')}></nexus-desktop-icon>
            <nexus-desktop-icon icon="message" label="Comms"
              @icon-open=${() => this._windowManager.open('comms')}></nexus-desktop-icon>
          </nav>

          <!-- Window layer (managed imperatively) -->
          <div class="window-layer"></div>
        </main>

        <nexus-dock position="float">
          <nexus-dock-item slot="start" label="Search">
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item label="Intel"
            ?active=${!!this._openWindowIds.intel}
            @dock-item-click=${() => this._windowManager.open('intel')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item label="Terminal"
            ?active=${!!this._openWindowIds.terminal}
            @dock-item-click=${() => this._windowManager.open('terminal')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item label="Comms"
            ?active=${!!this._openWindowIds.comms}
            @dock-item-click=${() => this._windowManager.open('comms')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item slot="end" label="Config"
            ?active=${!!this._openWindowIds.config}
            @dock-item-click=${() => this._windowManager.open('config')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            </svg>
          </nexus-dock-item>
        </nexus-dock>
      </div>

      <!-- CRT Scanline Overlay -->
      <div class="crt-overlay ${this._crtActive ? 'active' : ''}"></div>

      <!-- Boot Overlay -->
      <nexus-boot
        mode="terminal"
        qr-value=${this.agentUrl}
        session-id=${this.sessionId}
        ?active=${this.screen === 'boot'}
        @boot-complete=${this._onBootComplete}
      ></nexus-boot>

      <!-- Locked Screen -->
      ${this.screen === 'locked' ? html`
        <div class="locked">
          <div class="locked-icon">\u2298</div>
          <h2>Connection Lost</h2>
          <p>Agent device disconnected. Start a new session to reconnect.</p>
          <nexus-button @click=${this._onNewSession}>New Session</nexus-button>
        </div>
      ` : null}

      <!-- Toast Container -->
      <nexus-toast-container position="top-right"></nexus-toast-container>
    `;
  }
}

customElements.define('terminal-app', TerminalApp);
