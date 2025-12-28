/**
 * CYPHER Agent App - Main application shell
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { storageService } from '../../shared/services/storage-service.js';
import { PeerService } from '../../shared/services/peer-service.js';
import { MSG } from '../../shared/utils/protocol.js';
import './agent-setup.js';
import './agent-main.js';

export class AgentApp extends LitElement {
  static properties = {
    screen: { type: String },
    profile: { type: Object },
    sessionId: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: monospace;
      background: #0a0a0a;
      color: #00FFCC;
      min-height: 100vh;
      padding: 1rem;
      box-sizing: border-box;
    }

    h1 {
      color: #00FFCC;
      margin: 0.5rem 0;
      letter-spacing: 0.2em;
      text-align: center;
    }
  `;

  constructor() {
    super();
    this.screen = 'loading';
    this.profile = null;
    this.sessionId = null;
    this.peerService = new PeerService();

    this._parseSession();
  }

  _parseSession() {
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

  async _init() {
    const profile = await storageService.getProfile();

    if (profile) {
      this.profile = profile;
      this.screen = 'main';
    } else {
      this.screen = 'setup';
    }
  }

  async _onProfileCreated(e) {
    this.profile = e.detail.profile;
    await storageService.saveProfile(this.profile);
    this.screen = 'main';
  }

  _onDisconnect() {
    this.peerService.destroy();
    this.peerService = new PeerService();
  }

  render() {
    return html`
      <h1>CYPHER</h1>

      ${this.screen === 'setup' ? html`
        <agent-setup
          @profile-created=${this._onProfileCreated}
        ></agent-setup>
      ` : ''}

      ${this.screen === 'main' ? html`
        <agent-main
          .profile=${this.profile}
          .sessionId=${this.sessionId}
          .peerService=${this.peerService}
          @disconnect=${this._onDisconnect}
        ></agent-main>
      ` : ''}
    `;
  }
}

customElements.define('agent-app', AgentApp);
