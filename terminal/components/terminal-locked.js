/**
 * CYPHER Terminal Locked Screen - Disconnected state
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class TerminalLocked extends LitElement {
  static properties = {
    profile: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      text-align: center;
    }

    .lock-icon {
      font-size: 4rem;
      margin: 1rem 0;
    }

    .lock-status {
      color: #ff4444;
      font-size: 1.5rem;
      font-weight: bold;
      margin: 2rem 0;
      letter-spacing: 0.3em;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .profile {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1.5rem;
      margin: 1rem auto;
      border: 2px solid rgba(255, 0, 0, 0.3);
      border-radius: 8px;
      max-width: 400px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%);
      opacity: 0.6;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid #ff4444;
      object-fit: cover;
      background: #000;
      filter: grayscale(100%);
    }

    .info {
      text-align: left;
    }

    .codename {
      font-size: 1.5rem;
      color: #ff4444;
      font-weight: bold;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }

    .level-badge {
      display: inline-block;
      background: #ff4444;
      color: #000;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
    }

    .message {
      color: #666;
      font-size: 0.85rem;
      margin: 1rem 0;
    }

    button {
      background: transparent;
      color: #00FFCC;
      border: 2px solid #00FFCC;
      padding: 1rem 2rem;
      font-family: monospace;
      font-size: 1rem;
      cursor: pointer;
      border-radius: 50px;
      margin-top: 1rem;
      transition: all 0.2s;
    }

    button:hover {
      background: rgba(0, 255, 204, 0.1);
    }
  `;

  _handleUnlock() {
    this.dispatchEvent(new CustomEvent('unlock'));
  }

  render() {
    return html`
      <div class="lock-icon">🔒</div>
      <div class="lock-status">TERMINAL LOCKED</div>

      ${this.profile ? html`
        <div class="profile">
          <img class="avatar" src=${this.profile.avatar || ''} alt="Agent Avatar">
          <div class="info">
            <div class="codename">${this.profile.codename}</div>
            <div class="level-badge">Level ${this.profile.level}</div>
          </div>
        </div>
      ` : ''}

      <p class="message">Agent connection lost</p>
      <button @click=${this._handleUnlock}>UNLOCK TERMINAL</button>
    `;
  }
}

customElements.define('terminal-locked', TerminalLocked);
