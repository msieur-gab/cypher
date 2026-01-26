/**
 * NEXUS Terminal App — Desktop OS interface
 * State machine: boot → desktop → locked
 *
 * Boot: narrative text + QR code → agent connects → fade to desktop
 * Desktop: header, icon grid, window manager, dock
 * Locked: connection lost, new session
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { STATE, MSG } from '../../shared/utils/protocol.js';
import { TerminalFS } from './services/terminal-fs.js';
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
    _clockTime:         { type: String, state: true },
    _desktopPattern:    { type: String, state: true },
    _crtActive:         { type: Boolean, state: true },
    _ready:             { type: Boolean, state: true },
    _connectionStatus:  { type: String, state: true },
    _openWindowIds:     { type: Object, state: true },  // { intel: true, terminal: true, ... }
  };

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
      background: var(--nx-bg);
      color: var(--nx-fg);
      font-family: var(--nx-font);
    }

    /* ========== Desktop Layout ========== */
    .desktop {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .desktop-area {
      flex: 1;
      position: relative;
      min-height: 0;
      overflow: hidden;
      z-index: 1;
      isolation: isolate;
    }

    /* Desktop background pattern */
    .desktop-area::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-pattern-scanlines);
      background-size: 100% 2px;
      opacity: 0.15;
      pointer-events: none;
    }

    .desktop-area[data-pattern="dither"]::before {
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
    }

    .desktop-area[data-pattern="grid"]::before {
      background-image: var(--nx-pattern-grid);
      background-size: var(--nx-pattern-grid-size);
    }

    .desktop-area[data-pattern="scanlines"]::before {
      background-image: var(--nx-pattern-scanlines);
      background-size: var(--nx-pattern-scanlines-size);
    }

    .desktop-area[data-pattern="matrix"]::before {
      background-image:
        linear-gradient(var(--nx-primary) 0.5px, transparent 0.5px),
        linear-gradient(90deg, var(--nx-primary) 0.5px, transparent 0.5px);
      background-size: 20px 20px;
    }

    .desktop-area[data-pattern="hex"]::before {
      background-image: radial-gradient(var(--nx-primary) 1px, transparent 1px);
      background-size: 16px 16px;
    }

    .desktop-area[data-pattern="none"]::before {
      background-image: none;
    }

    /* Icon grids */
    .icon-grid {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      padding: 1.5rem;
      z-index: 1;
    }

    .icon-grid.left { left: 0; }
    .icon-grid.right { right: 0; }

    /* Window layer */
    .window-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .window-layer nexus-window {
      pointer-events: auto;
    }

    /* ========== Entry Animations ========== */
    nexus-header {
      opacity: 0;
      transform: translateY(-100%);
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
                  opacity 0.4s ease-out;
    }

    nexus-header.ready {
      opacity: 1;
      transform: translateY(0);
    }

    nexus-dock {
      opacity: 0;
      transition: opacity 0.6s ease-out 0.2s;
    }

    nexus-dock.ready {
      opacity: 1;
    }

    nexus-desktop-icon {
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    }

    nexus-desktop-icon.ready {
      opacity: 1;
      transform: scale(1);
    }

    /* ========== CRT Overlay ========== */
    .crt-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
      );
      opacity: 0;
      transition: opacity 0.3s;
    }

    .crt-overlay.active { opacity: 1; }

    .crt-toggle {
      background: none;
      border: var(--nx-thin) solid var(--nx-primary-dim);
      color: var(--nx-primary);
      padding: 4px 8px;
      font-family: var(--nx-font);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s, background 0.15s;
    }

    .crt-toggle:hover {
      opacity: 1;
      background: var(--nx-primary-dim);
    }

    .crt-toggle.active {
      background: var(--nx-primary);
      color: var(--nx-bg);
      opacity: 1;
    }

    /* ========== Header extras ========== */
    .status-text {
      font-size: var(--nx-text-sm);
      color: var(--nx-fg-dim);
      letter-spacing: 0.05em;
    }

    .status-text.online { color: var(--nx-primary); }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--nx-md);
    }

    /* ========== Locked Screen ========== */
    .locked {
      position: fixed;
      inset: 0;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: var(--nx-lg);
      padding: var(--nx-xl);
      background: var(--nx-bg);
    }

    .locked-icon {
      font-size: 3rem;
      color: var(--nx-fg-muted);
    }

    .locked h2 {
      color: var(--nx-fg-dim);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg);
      margin: 0;
    }

    .locked p {
      color: var(--nx-fg-muted);
      font-size: var(--nx-text-sm);
      text-align: center;
      max-width: 300px;
    }

    /* ========== Config Window Styles ========== */
    .setup-section {
      margin-bottom: var(--nx-lg);
    }

    .setup-title {
      font-size: var(--nx-text-sm);
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-xs);
      border-bottom: var(--nx-thin) solid var(--nx-border);
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }

    .pattern-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-sm);
    }

    .pattern-preview {
      aspect-ratio: 1;
      border: var(--nx-thin) solid var(--nx-border);
      cursor: pointer;
      position: relative;
      background-color: var(--nx-bg);
      transition: all 0.15s;
    }

    .pattern-preview[data-pattern="dither"] {
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
    }
    .pattern-preview[data-pattern="grid"] {
      background-image: var(--nx-pattern-grid);
    }
    .pattern-preview[data-pattern="scanlines"] {
      background-image: var(--nx-pattern-scanlines);
    }
    .pattern-preview[data-pattern="matrix"] {
      background-image:
        linear-gradient(var(--nx-primary) 0.5px, transparent 0.5px),
        linear-gradient(90deg, var(--nx-primary) 0.5px, transparent 0.5px);
      background-size: 10px 10px;
    }
    .pattern-preview[data-pattern="hex"] {
      background-image: radial-gradient(var(--nx-primary) 1px, transparent 1px);
      background-size: 8px 8px;
    }

    .pattern-preview:hover { box-shadow: var(--nx-glow); }
    .pattern-preview.active {
      outline: 2px solid var(--nx-primary);
      outline-offset: 2px;
    }

    .pattern-label {
      position: absolute;
      bottom: 2px;
      left: 2px;
      font-size: 7px;
      background: var(--nx-bg);
      border: var(--nx-thin) solid var(--nx-border);
      padding: 1px 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nx-fg-dim);
    }

    /* ========== Comms Window ========== */
    .comms-panel {
      padding: var(--nx-md);
      font-family: var(--nx-font);
    }

    .comms-header {
      text-align: center;
      margin-bottom: var(--nx-lg);
    }

    .comms-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      margin-bottom: var(--nx-sm);
    }

    .comms-subtitle {
      font-size: 11px;
      color: var(--nx-fg-dim);
    }

    .comms-stats {
      background: var(--nx-bg-raised);
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-bottom: var(--nx-md);
    }

    .comms-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-sm);
      font-size: 11px;
    }

    .comms-row:last-child { margin-bottom: 0; }
    .comms-label { color: var(--nx-fg-dim); }
    .comms-value { color: var(--nx-fg); }
    .comms-value.highlight { color: var(--nx-primary); }

    .comms-empty {
      text-align: center;
      color: var(--nx-fg-muted);
      font-size: 12px;
      padding: var(--nx-md);
    }

    /* ========== Agent Status Window ========== */
    .agent-status-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-lg);
      gap: var(--nx-md);
      font-family: var(--nx-font);
    }

    .agent-avatar {
      width: 80px;
      height: 80px;
      border: var(--nx-thick) solid var(--nx-primary);
      box-shadow: var(--nx-glow-lg);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--nx-bg);
    }

    .agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      image-rendering: pixelated;
    }

    .agent-avatar-placeholder {
      font-size: 28px;
      color: var(--nx-fg-muted);
    }

    .agent-codename {
      font-size: 18px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .agent-level {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-fg-dim);
      border: var(--nx-thin) solid var(--nx-border);
      padding: 4px 12px;
    }

    .agent-details {
      width: 100%;
      background: var(--nx-bg-raised);
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-top: var(--nx-sm);
    }

    .agent-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-sm);
      font-size: 11px;
    }

    .agent-detail-row:last-child { margin-bottom: 0; }
    .agent-detail-label { color: var(--nx-fg-dim); }
    .agent-detail-value { color: var(--nx-fg); }
    .agent-detail-value.online { color: var(--nx-primary); }

    /* Preview content */
    .preview-content { padding: var(--nx-md); }
    .preview-header {
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-sm);
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }
    .preview-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--nx-primary);
      margin-bottom: var(--nx-xs);
      text-shadow: var(--nx-glow);
    }
    .preview-meta {
      display: flex;
      gap: var(--nx-md);
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preview-classification {
      padding: 2px 8px;
      border: var(--nx-thin) solid var(--nx-primary);
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }
    .preview-classification.secret {
      background: var(--nx-primary);
      color: var(--nx-bg);
    }
    .preview-body {
      font-size: 13px;
      line-height: 1.7;
      color: var(--nx-fg);
    }
    .preview-body p { margin-bottom: var(--nx-sm); }
    .preview-body .redacted {
      background: var(--nx-fg-muted);
      color: var(--nx-fg-muted);
      padding: 0 4px;
      border-radius: 2px;
      user-select: none;
    }
    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--nx-sm);
      margin-top: var(--nx-md);
      padding-top: var(--nx-md);
      border-top: var(--nx-thin) solid var(--nx-border);
    }
    .preview-tag {
      padding: 4px 10px;
      border: var(--nx-thin) solid var(--nx-border);
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preview-actions {
      margin-top: var(--nx-lg);
      display: flex;
      gap: var(--nx-sm);
    }

    /* System info in config */
    .sys-info {
      font-size: 12px;
      line-height: 1.8;
      color: var(--nx-fg-dim);
    }

    .sys-info .val { color: var(--nx-primary); }
  `;

  // ── Intel files ──

  static _intelFiles = [
    {
      name: 'OPERATION_NEXUS.md', type: 'document', classification: 'secret', size: '4.2 KB',
      title: 'Operation Nexus - Mission Brief',
      content: '<p>Priority mission targeting DataVault Corp\'s illegal data harvesting operations.</p><p>Primary objective: Identify and document the scope of unauthorized personal data collection affecting EU citizens.</p><p>Agent <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span> has confirmed insider access. Extraction window: 72 hours.</p>',
      tags: ['Active', 'Priority-1', 'DataVault'],
    },
    {
      name: 'PERSONNEL_CHEN.md', type: 'personnel', classification: 'confidential', size: '2.8 KB',
      title: 'Personnel File: Dr. Sarah Chen',
      content: '<p>Former DataVault Corp lead architect. Turned whistleblower after discovering Project Panopticon.</p><p>Current status: Under DSU protection program.</p><p>Expertise: Distributed systems, encryption protocols, data anonymization.</p>',
      tags: ['Whistleblower', 'Protected', 'Technical'],
    },
    {
      name: 'INTERCEPT_7734.md', type: 'intercept', classification: 'secret', size: '1.5 KB',
      title: 'Intercepted Communication #7734',
      content: '<p>Source: Internal DataVault Slack channel</p><p>Timestamp: 2025-03-14 02:34 UTC</p><p>"The regulators are getting close. Start the <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span> protocol immediately."</p>',
      tags: ['Urgent', 'Evidence', 'Destruction'],
    },
    {
      name: 'FACILITY_MAP.md', type: 'document', classification: 'confidential', size: '8.1 KB',
      title: 'DataVault Frankfurt Facility',
      content: '<p>Primary data center location confirmed: Frankfurt Industrial District, Building 7.</p><p>Security: 24/7 guards, biometric access, internal network air-gapped.</p>',
      tags: ['Location', 'Security', 'Frankfurt'],
    },
    {
      name: 'DECRYPTED_LOGS.md', type: 'data', classification: 'unclassified', size: '156 KB',
      title: 'Decrypted Access Logs',
      content: '<p>Successfully decrypted server access logs from February 2025.</p><p>Key findings: 47 million unique EU citizen records accessed.</p>',
      tags: ['Evidence', 'Logs', 'GDPR-Violation'],
    },
    {
      name: 'CONTACT_RAVEN.md', type: 'personnel', classification: 'secret', size: '1.2 KB',
      title: 'Asset: RAVEN',
      content: '<p>Codename: RAVEN</p><p>Position: DataVault Corp - Senior Systems Administrator</p><p>Recruitment date: <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span></p><p>Motivation: Financial + ideological</p><p>Reliability rating: B+</p><p>Handler: <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span></p>',
      tags: ['Asset', 'Inside-Source', 'Active'],
    },
  ];

  // ── App definitions ──

  _apps = {
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
    this._clockTime = '00:00:00';
    this._desktopPattern = 'scanlines';
    this._crtActive = false;
    this._ready = false;
    this._connectionStatus = 'offline';
    this._openWindowIds = {};

    this.peerService = new PeerService();
    this._windowElements = new Map();
    this._windowZCounter = 100;
    this._windowOffset = 0;
    this._clockInterval = null;

    this._setupPeerEvents();
  }

  connectedCallback() {
    super.connectedCallback();
    this._startClock();

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
    if (this._clockInterval) clearInterval(this._clockInterval);
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

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ── Clock ──

  _startClock() {
    this._updateClock();
    this._clockInterval = setInterval(() => this._updateClock(), 1000);
  }

  _updateClock() {
    const now = new Date();
    this._clockTime = now.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  }

  // ── Toast ──

  _toast(message, variant = 'info') {
    const container = this.renderRoot.querySelector('nexus-toast-container');
    if (container) container.add(message, { variant, duration: 3000 });
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
      this._closeApp('agentStatus');
      if (this.profile) {
        this.screen = 'locked';
      }
    });
  }

  async _onAgentConnected() {
    this._connectionStatus = 'online';

    // Fade boot overlay via nexus-boot component
    const boot = this.renderRoot.querySelector('nexus-boot');
    if (boot) boot.dismiss();

    const name = this.profile?.codename || 'AGENT';
    this._toast(`Agent ${name} connected — secure channel established`, 'success');
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

    // Run entry animations
    requestAnimationFrame(async () => {
      this._ready = true;
      await this.updateComplete;
      this._applyReadyClasses();

      // Auto-open agent status + intel browser
      setTimeout(() => this._openApp('agentStatus'), 600);
      setTimeout(() => this._openApp('intel'), 1000);
    });
  }

  // ── Desktop: Window Management (imperative) ──

  _openApp(id) {
    if (this._windowElements.has(id)) {
      this._focusWindow(id);
      return;
    }

    const app = this._apps[id];
    if (!app) return;

    const layer = this.renderRoot.querySelector('.window-layer');
    if (!layer) return;

    const win = document.createElement('nexus-window');
    win.id = `window-${id}`;
    win.title = app.title;
    win.width = app.width;
    win.height = app.height;
    win.x = 150 + this._windowOffset * 30;
    win.y = 80 + this._windowOffset * 30;
    this._windowOffset = (this._windowOffset + 1) % 5;

    win.addEventListener('close', () => this._closeApp(id));
    win.addEventListener('focus-window', () => this._focusWindow(id));

    // Set window content
    win.innerHTML = this._getWindowContent(id);

    layer.appendChild(win);
    this._windowElements.set(id, win);
    this._openWindowIds = { ...this._openWindowIds, [id]: true };
    this._focusWindow(id);

    // Post-render setup
    requestAnimationFrame(() => this._setupWindowBehavior(id, win));
  }

  _closeApp(id) {
    const win = this._windowElements.get(id);
    if (win) {
      win.remove();
      this._windowElements.delete(id);
      const { [id]: _, ...rest } = this._openWindowIds;
      this._openWindowIds = rest;
    }
  }

  _focusWindow(id) {
    this._windowElements.forEach(w => { w.style.zIndex = '40'; });
    const win = this._windowElements.get(id);
    if (win) {
      win.style.zIndex = String(++this._windowZCounter);
    }
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
    const files = TerminalApp._intelFiles;
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
      const files = TerminalApp._intelFiles;
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

        // Update active state in config
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
    // Clean up windows
    this._windowElements.forEach(w => w.remove());
    this._windowElements.clear();
    this._openWindowIds = {};
    this._windowOffset = 0;

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
            <span>${this._clockTime}</span>
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
              @icon-open=${() => this._openApp('config')}></nexus-desktop-icon>
            <nexus-desktop-icon icon="fileText" label="Intel"
              @icon-open=${() => this._openApp('intel')}></nexus-desktop-icon>
          </nav>

          <!-- Right icons -->
          <nav class="icon-grid right" aria-label="Desktop shortcuts">
            <nexus-desktop-icon icon="database" label="Database" disabled></nexus-desktop-icon>
            <nexus-desktop-icon icon="terminal" label="Terminal"
              @icon-open=${() => this._openApp('terminal')}></nexus-desktop-icon>
            <nexus-desktop-icon icon="message" label="Comms"
              @icon-open=${() => this._openApp('comms')}></nexus-desktop-icon>
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
            @dock-item-click=${() => this._openApp('intel')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item label="Terminal"
            ?active=${!!this._openWindowIds.terminal}
            @dock-item-click=${() => this._openApp('terminal')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item label="Comms"
            ?active=${!!this._openWindowIds.comms}
            @dock-item-click=${() => this._openApp('comms')}>
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </nexus-dock-item>

          <nexus-dock-item slot="end" label="Config"
            ?active=${!!this._openWindowIds.config}
            @dock-item-click=${() => this._openApp('config')}>
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
