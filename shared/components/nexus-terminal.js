/**
 * NEXUS Terminal Component
 * Command-line interface with history and output
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusTerminal extends LitElement {
  static properties = {
    prompt: { type: String },
    greeting: { type: String },
    history: { type: Array, state: true },
    commandHistory: { type: Array, state: true },
    historyIndex: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .terminal {
      flex: 1;
      background: rgba(0, 255, 204, 0.03);
      font-family: var(--nx-font, monospace);
      font-size: 13px;
      padding: var(--nx-md, 1rem);
      overflow-y: auto;
      border: var(--nx-thin, 1px) solid var(--nx-primary-dim, #00CCAA);
      min-height: 0;
    }

    /* Scrollbar */
    .terminal::-webkit-scrollbar {
      width: 10px;
    }

    .terminal::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    .terminal::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    .terminal::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }

    /* Output lines */
    .line {
      margin: 2px 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .line.system {
      color: var(--nx-fg-dim, #888);
    }

    .line.output {
      color: var(--nx-fg, #fff);
    }

    .line.command {
      color: var(--nx-primary, #00FFCC);
    }

    .line.error {
      color: #ff6b6b;
    }

    .line.success {
      color: #69db7c;
    }

    .line.dim {
      color: var(--nx-fg-muted, #555);
    }

    /* Input line */
    .input-line {
      display: flex;
      margin-top: var(--nx-sm, 0.5rem);
    }

    .prompt {
      color: var(--nx-primary, #00FFCC);
      margin-right: var(--nx-sm, 0.5rem);
      flex-shrink: 0;
    }

    .input {
      flex: 1;
      background: none;
      border: none;
      color: var(--nx-primary, #00FFCC);
      outline: none;
      font-family: inherit;
      font-size: inherit;
      caret-color: var(--nx-primary, #00FFCC);
      padding: 0;
    }

    .input::placeholder {
      color: var(--nx-fg-muted, #555);
    }

    /* Cursor blink */
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .cursor {
      display: inline-block;
      width: 8px;
      height: 14px;
      background: var(--nx-primary, #00FFCC);
      animation: blink 1s step-end infinite;
      vertical-align: text-bottom;
    }
  `;

  constructor() {
    super();
    this.prompt = '>';
    this.greeting = '';
    this.history = [];
    this.commandHistory = [];
    this.historyIndex = -1;
  }

  firstUpdated() {
    if (this.greeting) {
      this.addLine(this.greeting, 'system');
    }
    this._focusInput();
  }

  updated() {
    this._scrollToBottom();
  }

  _scrollToBottom() {
    const terminal = this.shadowRoot.querySelector('.terminal');
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }

  _focusInput() {
    const input = this.shadowRoot.querySelector('.input');
    input?.focus();
  }

  _handleKeydown(e) {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value) {
        this._executeCommand(value);
        this.commandHistory = [...this.commandHistory, value];
        this.historyIndex = this.commandHistory.length;
      }
      e.target.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        e.target.value = this.commandHistory[this.historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        e.target.value = this.commandHistory[this.historyIndex] || '';
      } else {
        this.historyIndex = this.commandHistory.length;
        e.target.value = '';
      }
    }
  }

  _executeCommand(command) {
    // Add command to history display
    this.addLine(`${this.prompt} ${command}`, 'command');

    // Dispatch event for external handling
    const event = new CustomEvent('command', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { command, terminal: this }
    });

    const handled = !this.dispatchEvent(event);

    // If not handled externally, show unknown command
    if (!handled && !event.defaultPrevented) {
      this.addLine(`Unknown command: ${command}`, 'dim');
    }
  }

  // Public API
  addLine(text, type = 'output') {
    this.history = [...this.history, { text, type }];
  }

  clear() {
    this.history = [];
  }

  focus() {
    this._focusInput();
  }

  render() {
    return html`
      <div class="terminal" @click=${this._focusInput}>
        ${this.history.map(line => html`
          <div class="line ${line.type}">${line.text}</div>
        `)}
        <div class="input-line">
          <span class="prompt">${this.prompt}</span>
          <input
            type="text"
            class="input"
            @keydown=${this._handleKeydown}
            autocomplete="off"
            spellcheck="false"
          >
        </div>
      </div>
    `;
  }
}

customElements.define('nexus-terminal', NexusTerminal);
