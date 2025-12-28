/**
 * CYPHER Terminal Boot Screen - Cyberpunk boot sequence animation
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class TerminalBoot extends LitElement {
  static properties = {
    profile: { type: Object },
    _isBooting: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      padding: 2rem;
      text-align: left;
      overflow-y: auto;
      z-index: 100;
    }

    :host::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      );
      pointer-events: none;
      z-index: 101;
    }

    :host::after {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
      pointer-events: none;
      z-index: 102;
    }

    #terminal {
      position: relative;
      z-index: 103;
      font-size: 0.95rem;
      line-height: 1.8;
      max-width: 800px;
      text-shadow: 0 0 5px rgba(0, 255, 204, 0.3);
    }

    .line {
      min-height: 1.8em;
      white-space: pre-wrap;
    }
    .line.success { color: #00FFCC; }
    .line.warning { color: #ffaa00; }
    .line.error { color: #ff4444; }
    .line.info { color: #555; }
    .line.highlight {
      color: #00FFCC;
      font-weight: bold;
      text-shadow: 0 0 15px rgba(0, 255, 204, 0.8);
      font-size: 1.1rem;
    }
    .line.big {
      font-size: 1.3rem;
      margin: 0.5rem 0;
    }

    .cursor {
      display: inline-block;
      width: 10px;
      height: 1.2em;
      background: #00FFCC;
      animation: blink 0.7s infinite;
      vertical-align: text-bottom;
      margin-left: 2px;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .progress-bar {
      display: inline-block;
      width: 300px;
      height: 14px;
      background: #111;
      border: 1px solid #333;
      margin-left: 10px;
      vertical-align: middle;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00FFCC, #00CCAA);
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
    }
  `;

  constructor() {
    super();
    this._isBooting = false;
  }

  updated(changedProps) {
    if (changedProps.has('profile') && this.profile && !this._isBooting) {
      this._runBootSequence();
    }
  }

  async _runBootSequence() {
    this._isBooting = true;
    const terminal = this.shadowRoot.getElementById('terminal');
    terminal.innerHTML = '';

    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    const addLine = async (text, className = '', typed = false, delay = 300) => {
      const div = document.createElement('div');
      div.className = `line ${className}`;
      terminal.appendChild(div);

      if (typed && text) {
        div.appendChild(cursor);
        await this._typeText(div, text, 25);
        if (cursor.parentNode === div) div.removeChild(cursor);
      } else {
        div.textContent = text;
      }

      this.scrollTop = this.scrollHeight;
      await this._delay(delay);
    };

    const addProgress = async (label, duration = 2000) => {
      const div = document.createElement('div');
      div.className = 'line';

      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.style.width = '0%';
      bar.appendChild(fill);

      const pct = document.createElement('span');
      pct.textContent = ' 0%';

      div.appendChild(document.createTextNode(label + ' '));
      div.appendChild(bar);
      div.appendChild(pct);
      terminal.appendChild(div);
      this.scrollTop = this.scrollHeight;

      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const percent = Math.round((i / steps) * 100);
        fill.style.width = percent + '%';
        pct.textContent = ' ' + percent + '%';
        await this._delay(duration / steps);
      }
      await this._delay(200);
    };

    // Boot sequence
    await this._delay(500);
    await addLine('CYPHER TERMINAL v2.1.0', 'info', false, 200);
    await addLine('Copyright (c) 2025 EU Digital Sovereignty Unit', 'info', false, 400);
    await addLine('', '', false, 300);

    await addLine('> Initializing secure connection...', '', true, 600);
    await addLine('', '', false, 200);

    await addLine('[SYS] Scanning for agent device...', 'info', false, 800);
    await addLine('[SYS] Device found: MOBILE_AGENT_' + Math.random().toString(36).substring(2, 6).toUpperCase(), 'info', false, 400);
    await addLine('[OK]  P2P tunnel established', 'success', false, 600);
    await addLine('', '', false, 300);

    await addLine('> Decrypting security handshake...', '', true, 500);
    await addProgress('[SYS] Decrypting', 2500);
    await addLine('[OK]  Encryption verified (AES-256-GCM)', 'success', false, 500);
    await addLine('', '', false, 300);

    await addLine('> Verifying agent credentials...', '', true, 600);
    await addLine('', '', false, 200);
    await addLine('[SYS] Agent ID: ' + this.profile.codename, 'warning', false, 400);
    await addLine('[SYS] Loading biometric signature...', 'info', false, 800);
    await addLine('[SYS] Matching against secure database...', 'info', false, 600);
    await addLine('[OK]  Biometric match confirmed', 'success', false, 500);
    await addLine('', '', false, 300);

    await addLine('> Configuring access permissions...', '', true, 600);
    await addProgress('[SYS] Loading clearance data', 1800);
    await addLine(`[SYS] Clearance level: ${this.profile.level}`, 'warning', false, 400);
    await addLine('[OK]  Access permissions configured', 'success', false, 600);
    await addLine('', '', false, 400);

    await addLine('════════════════════════════════════════════════', 'info', false, 100);
    await addLine('', '', false, 200);
    await addLine('        ██████  ACCESS GRANTED  ██████', 'highlight big', false, 400);
    await addLine('', '', false, 200);
    await addLine(`           Welcome, Agent ${this.profile.codename}`, 'highlight', false, 400);
    await addLine('', '', false, 200);
    await addLine('════════════════════════════════════════════════', 'info', false, 100);
    await addLine('', '', false, 300);
    await addLine('[SYS] Launching terminal interface...', 'info', false, 800);

    await this._delay(1500);
    this._isBooting = false;
    this.dispatchEvent(new CustomEvent('boot-complete'));
  }

  async _typeText(element, text, speed = 30) {
    const textNode = document.createTextNode('');
    element.insertBefore(textNode, element.firstChild);

    for (let i = 0; i < text.length; i++) {
      textNode.textContent += text[i];
      this.scrollTop = this.scrollHeight;
      if (text[i] !== ' ') {
        await this._delay(speed + Math.random() * 20);
      }
    }
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  render() {
    return html`<div id="terminal"></div>`;
  }
}

customElements.define('terminal-boot', TerminalBoot);
