/**
 * CYPHER Terminal Connect Screen - QR code display
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import QRCode from 'https://esm.sh/qrcode@1';

export class TerminalConnect extends LitElement {
  static properties = {
    sessionId: { type: String },
    agentUrl: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      text-align: center;
    }

    p {
      color: #888;
      margin: 0.5rem 0;
    }

    #qr {
      background: #000;
      display: inline-block;
      padding: 1rem;
      margin: 1rem;
      border-radius: 8px;
      border: 2px solid rgba(0, 255, 204, 0.3);
    }

    .agent-url {
      font-size: 0.8rem;
      color: rgba(0, 255, 204, 0.5);
      word-break: break-all;
      max-width: 400px;
      margin: 0.5rem auto;
    }

    .session {
      margin: 1rem 0;
    }

    .session-id {
      color: #00FFCC;
      font-weight: bold;
    }

    .status {
      padding: 1rem;
      margin: 1rem;
      border: 1px solid rgba(0, 255, 204, 0.3);
      color: #ffaa00;
    }
  `;

  updated(changedProps) {
    if (changedProps.has('agentUrl') && this.agentUrl) {
      this._generateQR();
    }
  }

  async _generateQR() {
    const container = this.shadowRoot.getElementById('qr');
    if (!container) return;

    container.innerHTML = '';

    const canvas = await QRCode.toCanvas(document.createElement('canvas'), this.agentUrl, {
      width: 200,
      color: { dark: '#00FFCC', light: '#000000' }
    });

    container.appendChild(canvas);
  }

  render() {
    return html`
      <p>Scan QR with phone to connect</p>

      <div id="qr"></div>
      <div class="agent-url">${this.agentUrl}</div>
      <div class="session">Session: <span class="session-id">${this.sessionId}</span></div>
      <div class="status">Waiting for agent...</div>
    `;
  }
}

customElements.define('terminal-connect', TerminalConnect);
