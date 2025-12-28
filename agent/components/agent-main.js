/**
 * CYPHER Agent Main - Connected view with command input
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { MSG, TERM_MSG } from '../../shared/utils/protocol.js';
import { storageService } from '../../shared/services/storage-service.js';

export class AgentMain extends LitElement {
  static properties = {
    profile: { type: Object },
    sessionId: { type: String },
    peerService: { type: Object },
    _status: { type: String, state: true },
    _isConnected: { type: Boolean, state: true },
    _messages: { type: Array, state: true },
    _command: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      text-align: center;
    }

    .profile-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin: 1rem auto;
      padding: 1rem;
      border: 2px solid rgba(0, 255, 204, 0.3);
      border-radius: 8px;
      max-width: 300px;
      background: linear-gradient(135deg, #0a0a0a 0%, #111 100%);
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #00FFCC;
      background: #000;
    }

    .info { text-align: left; }
    .codename { color: #00FFCC; font-weight: bold; font-size: 1.2rem; }

    .level-badge {
      display: inline-block;
      background: #00FFCC;
      color: #000;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .session { margin: 0.5rem 0; font-size: 0.85rem; color: #888; }
    .session-id { color: #00FFCC; }

    .status {
      padding: 1rem;
      margin: 1rem;
      border: 1px solid rgba(0, 255, 204, 0.3);
    }
    .status.connected { color: #00FFCC; }
    .status.error { color: #ff4444; }

    .command-input {
      margin: 1rem 0;
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    input[type="text"] {
      background: #111;
      border: 1px solid rgba(0, 255, 204, 0.3);
      color: #00FFCC;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 1rem;
      width: 200px;
    }
    input:focus { outline: none; border-color: #00FFCC; }

    button {
      background: transparent;
      color: #00FFCC;
      border: 2px solid #00FFCC;
      padding: 0.75rem 1.5rem;
      font-family: monospace;
      font-size: 1rem;
      cursor: pointer;
      border-radius: 50px;
      transition: all 0.2s;
    }
    button:hover { background: rgba(0, 255, 204, 0.1); }
    button:disabled { border-color: #333; color: #333; cursor: not-allowed; }
    button.danger { border-color: #ff4444; color: #ff4444; }
    button.danger:hover { background: rgba(255, 68, 68, 0.1); }

    .messages {
      text-align: left;
      max-width: 400px;
      margin: 1rem auto;
      padding: 1rem;
      border: 1px solid rgba(0, 255, 204, 0.3);
      min-height: 150px;
      max-height: 250px;
      overflow-y: auto;
      font-size: 0.85rem;
      background: #000;
    }

    .msg-sent { color: #00FFCC; }
    .msg-received { color: #888; }
    .msg-error { color: #ff4444; }
    .msg-download { color: #ff00ff; }

    .disconnect-row { margin-top: 2rem; }
  `;

  constructor() {
    super();
    this._status = 'Connecting...';
    this._isConnected = false;
    this._messages = [];
    this._command = '';
    this._hasConnected = false;
  }

  updated(changedProps) {
    // Connect when we have all required props and haven't connected yet
    if (!this._hasConnected && this.peerService && this.sessionId && this.profile) {
      this._hasConnected = true;
      this._connect();
    }
  }

  _connect() {
    if (!this.sessionId) {
      this._status = 'No session ID. Scan QR from Terminal.';
      return;
    }

    this.peerService.addEventListener('connected', () => {
      this._status = 'Connected to Terminal!';
      this._isConnected = true;

      // Send profile
      this.peerService.send({
        type: MSG.INIT_STATE,
        profile: {
          codename: this.profile.codename,
          level: this.profile.level,
          avatar: this.profile.avatar
        }
      });
    });

    this.peerService.addEventListener('data', e => {
      this._handleData(e.detail.data);
    });

    this.peerService.addEventListener('disconnected', () => {
      this._status = 'Disconnected';
      this._isConnected = false;
    });

    this.peerService.addEventListener('error', () => {
      this._status = 'Connection error';
      this._isConnected = false;
    });

    this.peerService.connectAsAgent(this.sessionId);
  }

  async _handleData(data) {
    console.log('[AgentMain] Received:', data);

    if (data.type === TERM_MSG.FILE_CONTENT) {
      // Store downloaded file
      await storageService.saveDownload({
        filename: data.filename,
        path: data.path,
        content: data.content
      });
      this._addMessage(`Downloaded: ${data.filename}`, 'download');
    } else if (data.type === TERM_MSG.CMD_OUTPUT) {
      this._addMessage(data.output, 'received');
    } else if (data.type === TERM_MSG.CMD_ERROR) {
      this._addMessage(data.error, 'error');
    } else if (data.type === TERM_MSG.DIR_LISTING) {
      this._addMessage(data.listing, 'received');
    } else {
      this._addMessage(JSON.stringify(data), 'received');
    }
  }

  _addMessage(text, type = 'received') {
    this._messages = [...this._messages, { text, type, time: Date.now() }];

    // Auto-scroll
    this.updateComplete.then(() => {
      const msgs = this.shadowRoot.querySelector('.messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    });
  }

  _onCommandInput(e) {
    this._command = e.target.value;
  }

  _onKeyPress(e) {
    if (e.key === 'Enter') this._sendCommand();
  }

  _sendCommand() {
    const text = this._command.trim();
    if (!text || !this._isConnected) return;

    this.peerService.send({
      type: MSG.COMMAND,
      text: text,
      time: Date.now()
    });

    this._addMessage(`> ${text}`, 'sent');
    this._command = '';
  }

  _disconnect() {
    this.peerService.destroy();
    this._status = 'Disconnected by agent';
    this._isConnected = false;
    this._addMessage('// CONNECTION TERMINATED //', 'error');

    this.dispatchEvent(new CustomEvent('disconnect'));
  }

  render() {
    if (!this.profile) return html``;

    return html`
      <div class="profile-display">
        <img class="avatar" src=${this.profile.avatar || ''} alt="Avatar">
        <div class="info">
          <div class="codename">${this.profile.codename}</div>
          <div class="level-badge">LEVEL ${this.profile.level}</div>
        </div>
      </div>

      <div class="session">Session: <span class="session-id">${this.sessionId || '...'}</span></div>
      <div class="status ${this._isConnected ? 'connected' : 'error'}">${this._status}</div>

      <div class="command-input">
        <input
          type="text"
          placeholder="Enter command..."
          .value=${this._command}
          @input=${this._onCommandInput}
          @keypress=${this._onKeyPress}
          ?disabled=${!this._isConnected}
        >
        <button @click=${this._sendCommand} ?disabled=${!this._isConnected}>SEND</button>
      </div>

      <div class="messages">
        ${this._messages.map(m => html`
          <div class="msg-${m.type}">${m.type === 'sent' ? '' : '← '}${m.text}</div>
        `)}
      </div>

      <div class="disconnect-row">
        <button class="danger" @click=${this._disconnect} ?disabled=${!this._isConnected}>
          DISCONNECT
        </button>
      </div>
    `;
  }
}

customElements.define('agent-main', AgentMain);
