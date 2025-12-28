/**
 * CYPHER Terminal App - Main application shell
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { PeerService } from '../../shared/services/peer-service.js';
import { STATE, MSG } from '../../shared/utils/protocol.js';
import './terminal-connect.js';
import './terminal-boot.js';
import './terminal-main.js';
import './terminal-locked.js';

export class TerminalApp extends LitElement {
  static properties = {
    screen: { type: String },
    sessionId: { type: String },
    agentUrl: { type: String },
    profile: { type: Object },
    _pendingCommands: { type: Array, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: monospace;
      background: #0a0a0a;
      color: #00FFCC;
      min-height: 100vh;
      padding: 2rem;
      box-sizing: border-box;
    }

    h1 {
      color: #00FFCC;
      letter-spacing: 0.2em;
      text-align: center;
      margin: 0 0 1rem 0;
    }

    .screen {
      display: none;
    }

    .screen.active {
      display: block;
    }
  `;

  constructor() {
    super();
    this.screen = 'connect';
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this.profile = null;
    this._pendingCommands = [];
    this.peerService = new PeerService();

    this._setupPeerEvents();
  }

  _generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  _buildAgentUrl() {
    const basePath = window.location.pathname.replace(/\/terminal\/?.*$/, '');
    return `${window.location.origin}${basePath}/agent/?session=${this.sessionId}`;
  }

  _setupPeerEvents() {
    this.peerService.addEventListener('connected', () => {
      console.log('[TerminalApp] Agent connected');
    });

    this.peerService.addEventListener('data', e => {
      const { data } = e.detail;
      console.log('[TerminalApp] Received:', data);

      if (data.type === MSG.INIT_STATE && data.profile) {
        this.profile = data.profile;
        this.screen = 'boot';
      }

      if (data.type === MSG.COMMAND) {
        this._handleCommand(data.text);
      }
    });

    this.peerService.addEventListener('disconnected', () => {
      console.log('[TerminalApp] Agent disconnected');
      if (this.profile) {
        this.screen = 'locked';
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.peerService.createTerminal(this.sessionId);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.peerService.destroy();
  }

  _handleCommand(text) {
    // Add command to pending list - terminal-main will process it
    this._pendingCommands = [...this._pendingCommands, { text, time: Date.now() }];
  }

  _onBootComplete() {
    this.screen = 'main';
  }

  _onUnlock() {
    this.profile = null;
    this.sessionId = this._generateSessionId();
    this.agentUrl = this._buildAgentUrl();
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._setupPeerEvents();
    this.peerService.createTerminal(this.sessionId);
    this.screen = 'connect';
  }

  render() {
    return html`
      <h1>CYPHER Terminal</h1>

      <terminal-connect
        class="screen ${this.screen === 'connect' ? 'active' : ''}"
        .sessionId=${this.sessionId}
        .agentUrl=${this.agentUrl}
      ></terminal-connect>

      <terminal-boot
        class="screen ${this.screen === 'boot' ? 'active' : ''}"
        .profile=${this.profile}
        @boot-complete=${this._onBootComplete}
      ></terminal-boot>

      <terminal-main
        class="screen ${this.screen === 'main' ? 'active' : ''}"
        .profile=${this.profile}
        .peerService=${this.peerService}
        .pendingCommands=${this._pendingCommands}
      ></terminal-main>

      <terminal-locked
        class="screen ${this.screen === 'locked' ? 'active' : ''}"
        .profile=${this.profile}
        @unlock=${this._onUnlock}
      ></terminal-locked>
    `;
  }
}

customElements.define('terminal-app', TerminalApp);
