/**
 * CYPHER Agent Main - Connected view with command input
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { MSG, TERM_MSG } from '../../shared/utils/protocol.js';
import { storageService } from '../../shared/services/storage-service.js';
import '../../shared/components/cypher-markdown.js';

export class AgentMain extends LitElement {
  static properties = {
    profile: { type: Object },
    sessionId: { type: String },
    peerService: { type: Object },
    _status: { type: String, state: true },
    _isConnected: { type: Boolean, state: true },
    _messages: { type: Array, state: true },
    _command: { type: String, state: true },
    _downloads: { type: Array, state: true },
    _viewingFile: { type: Object, state: true },
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

    /* Downloads section */
    .intel-section {
      margin: 1rem auto;
      max-width: 400px;
      text-align: left;
    }
    .intel-header {
      color: #ff00ff;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }
    .intel-list {
      border: 1px solid rgba(255, 0, 255, 0.3);
      background: #000;
      max-height: 150px;
      overflow-y: auto;
    }
    .intel-item {
      padding: 0.5rem;
      border-bottom: 1px solid #222;
      cursor: pointer;
      font-size: 0.8rem;
      color: #888;
    }
    .intel-item:hover {
      background: rgba(255, 0, 255, 0.1);
      color: #ff00ff;
    }
    .intel-empty {
      padding: 0.5rem;
      color: #444;
      font-size: 0.8rem;
      text-align: center;
    }

    /* File viewer overlay */
    .file-viewer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 100;
      padding: 1rem;
      overflow-y: auto;
    }
    .file-viewer-close {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: #ff4444;
      color: #000;
      border: none;
      padding: 0.5rem 1rem;
      font-family: monospace;
      cursor: pointer;
      z-index: 101;
    }
  `;

  constructor() {
    super();
    this._status = 'Connecting...';
    this._isConnected = false;
    this._messages = [];
    this._command = '';
    this._hasConnected = false;
    this._downloads = [];
    this._viewingFile = null;
  }

  updated(changedProps) {
    // Connect when we have all required props and haven't connected yet
    if (!this._hasConnected && this.peerService && this.sessionId && this.profile) {
      this._hasConnected = true;
      this._connect();
      this._loadDownloads();
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
      await this._loadDownloads();
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

  async _loadDownloads() {
    this._downloads = await storageService.getDownloads();
  }

  _viewFile(file) {
    this._viewingFile = file;
  }

  _closeFile() {
    this._viewingFile = null;
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

      <div class="intel-section">
        <div class="intel-header">ACQUIRED INTEL (${this._downloads.length})</div>
        <div class="intel-list">
          ${this._downloads.length === 0
            ? html`<div class="intel-empty">No files downloaded</div>`
            : this._downloads.map(f => html`
                <div class="intel-item" @click=${() => this._viewFile(f)}>
                  ${f.filename}
                </div>
              `)
          }
        </div>
      </div>

      <div class="disconnect-row">
        <button class="danger" @click=${this._disconnect} ?disabled=${!this._isConnected}>
          DISCONNECT
        </button>
      </div>

      ${this._viewingFile ? html`
        <div class="file-viewer">
          <button class="file-viewer-close" @click=${this._closeFile}>CLOSE</button>
          <cypher-markdown
            .filename=${this._viewingFile.filename}
            .content=${this._viewingFile.content}
          ></cypher-markdown>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('agent-main', AgentMain);
