/**
 * CYPHER Terminal Main Screen - Agent profile and command output
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class TerminalMain extends LitElement {
  static properties = {
    profile: { type: Object },
    peerService: { type: Object },
    _output: { type: Array, state: true },
  };

  static styles = css`
    :host {
      display: block;
      text-align: center;
    }

    .profile {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1.5rem;
      margin: 1rem auto;
      border: 2px solid rgba(0, 255, 204, 0.3);
      border-radius: 8px;
      max-width: 400px;
      background: linear-gradient(135deg, #0a0a0a 0%, #111 100%);
      box-shadow: 0 0 30px rgba(0, 255, 204, 0.1);
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid #00FFCC;
      object-fit: cover;
      background: #000;
      box-shadow: 0 0 20px rgba(0, 255, 204, 0.2);
    }

    .info {
      text-align: left;
    }

    .codename {
      font-size: 1.5rem;
      color: #00FFCC;
      font-weight: bold;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }

    .level-badge {
      display: inline-block;
      background: #00FFCC;
      color: #000;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
    }

    .status {
      color: #00FFCC;
      margin-top: 0.5rem;
      font-size: 0.85rem;
    }

    .terminal-output {
      text-align: left;
      max-width: 600px;
      margin: 1rem auto;
      padding: 1rem;
      border: 1px solid rgba(0, 255, 204, 0.3);
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
      font-size: 0.85rem;
      background: #000;
      line-height: 1.6;
    }

    .prompt { color: #00FFCC; }
    .output { color: #888; white-space: pre-wrap; }
    .error { color: #ff4444; }
    .success { color: #00FFCC; }
    .dir { color: #ffaa00; }
  `;

  constructor() {
    super();
    this._output = [];
  }

  addCommandOutput(text) {
    this._output = [...this._output, { type: 'command', text }];
    this.requestUpdate();

    // Auto-scroll
    this.updateComplete.then(() => {
      const output = this.shadowRoot.querySelector('.terminal-output');
      if (output) output.scrollTop = output.scrollHeight;
    });
  }

  render() {
    if (!this.profile) return html``;

    return html`
      <div class="profile">
        <img class="avatar" src=${this.profile.avatar || ''} alt="Agent Avatar">
        <div class="info">
          <div class="codename">${this.profile.codename}</div>
          <div class="level-badge">Level ${this.profile.level}</div>
          <div class="status">Connected</div>
        </div>
      </div>

      <div class="terminal-output">
        ${this._output.map(item => html`
          <div class="prompt">[AGENT]</div>
          <div class="output">${item.text}</div>
        `)}
      </div>
    `;
  }
}

customElements.define('terminal-main', TerminalMain);
