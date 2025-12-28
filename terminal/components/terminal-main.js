/**
 * CYPHER Terminal Main Screen - Agent profile and command output
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { TERM_MSG } from '../../shared/utils/protocol.js';
import '../../shared/components/cypher-markdown.js';

export class TerminalMain extends LitElement {
  static properties = {
    profile: { type: Object },
    peerService: { type: Object },
    pendingCommands: { type: Array },
    _output: { type: Array, state: true },
    _cwd: { type: String, state: true },
    _processedCount: { type: Number, state: true },
  };

  // Virtual file system structure
  static FILE_SYSTEM = {
    '/': ['intel', 'personnel', 'operations', 'README.md'],
    '/intel': ['report-2847.md', 'intercept-445.md'],
    '/personnel': ['asset-kondor.md'],
    '/operations': ['nightfall-brief.md'],
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

    .file-header {
      color: #ff00ff;
      margin-top: 0.5rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255, 0, 255, 0.3);
    }

    .file-content {
      color: #aaa;
      white-space: pre-wrap;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.02);
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      line-height: 1.4;
    }
  `;

  constructor() {
    super();
    this._output = [];
    this._cwd = '/';
    this._processedCount = 0;
    this.pendingCommands = [];
  }

  updated(changedProps) {
    if (changedProps.has('pendingCommands') && this.pendingCommands) {
      // Process any new commands
      while (this._processedCount < this.pendingCommands.length) {
        const cmd = this.pendingCommands[this._processedCount];
        this._processCommand(cmd.text);
        this._processedCount++;
      }
    }
  }

  _processCommand(text) {
    // Parse and execute command
    const result = this._executeCommand(text);

    this._output = [...this._output, {
      type: 'command',
      command: text,
      result: result.output,
      isError: result.isError
    }];

    // Auto-scroll after update
    this.updateComplete.then(() => {
      const output = this.shadowRoot.querySelector('.terminal-output');
      if (output) output.scrollTop = output.scrollHeight;
    });
  }

  _executeCommand(text) {
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'pwd':
        return { output: this._cwd, isError: false };

      case 'ls':
        return this._cmdLs(args[0]);

      case 'cd':
        return this._cmdCd(args[0]);

      case 'cat':
        return this._cmdCat(args[0]);

      case 'download':
        return this._cmdDownload(args[0]);

      case 'help':
        return {
          output: 'Available commands:\n  ls [dir]     - List directory\n  cd <dir>     - Change directory\n  cat <file>   - Read file\n  download <file> - Transfer to agent\n  pwd          - Current directory\n  help         - Show this help',
          isError: false
        };

      default:
        return { output: `Unknown command: ${cmd}. Type 'help' for commands.`, isError: true };
    }
  }

  _cmdLs(path) {
    const targetPath = this._resolvePath(path || '.');
    const contents = TerminalMain.FILE_SYSTEM[targetPath];

    if (!contents) {
      return { output: `ls: cannot access '${path || '.'}': No such directory`, isError: true };
    }

    const listing = contents.map(item => {
      const isDir = TerminalMain.FILE_SYSTEM[targetPath === '/' ? `/${item}` : `${targetPath}/${item}`];
      return isDir ? `[DIR]  ${item}/` : `[FILE] ${item}`;
    }).join('\n');

    return { output: listing || '(empty)', isError: false };
  }

  _cmdCd(path) {
    if (!path || path === '~') {
      this._cwd = '/';
      return { output: '', isError: false };
    }

    const targetPath = this._resolvePath(path);

    if (TerminalMain.FILE_SYSTEM[targetPath]) {
      this._cwd = targetPath;
      return { output: '', isError: false };
    }

    return { output: `cd: no such directory: ${path}`, isError: true };
  }

  _cmdCat(filename) {
    if (!filename) {
      return { output: 'cat: missing file operand', isError: true };
    }

    // Auto-append .md extension if missing
    if (!filename.includes('.')) {
      filename = filename + '.md';
    }

    const filePath = this._resolvePath(filename);

    // Check if it's a file (not a directory)
    if (TerminalMain.FILE_SYSTEM[filePath]) {
      return { output: `cat: ${filename}: Is a directory`, isError: true };
    }

    // Fetch the actual file content
    this._fetchFile(filePath, filename);
    return { output: `Reading ${filename}...`, isError: false };
  }

  _cmdDownload(filename) {
    if (!filename) {
      return { output: 'download: missing file operand', isError: true };
    }

    // Auto-append .md extension if missing
    if (!filename.includes('.')) {
      filename = filename + '.md';
    }

    const filePath = this._resolvePath(filename);

    // Fetch and send to agent
    this._fetchAndSendFile(filePath, filename);
    return { output: `Initiating transfer: ${filename}...`, isError: false };
  }

  _resolvePath(path) {
    if (!path || path === '.') return this._cwd;
    if (path === '..') {
      if (this._cwd === '/') return '/';
      const parts = this._cwd.split('/').filter(p => p);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }
    if (path.startsWith('/')) return path;

    // Relative path
    if (this._cwd === '/') return '/' + path;
    return this._cwd + '/' + path;
  }

  _buildDataUrl(filePath) {
    // On GitHub Pages, fetch raw files from raw.githubusercontent.com
    // URL format: msieur-gab.github.io/cypher/...
    if (window.location.hostname.endsWith('.github.io')) {
      const owner = window.location.hostname.split('.')[0]; // msieur-gab
      const repo = window.location.pathname.split('/')[1];   // cypher
      return `https://raw.githubusercontent.com/${owner}/${repo}/main/data${filePath}`;
    }
    // Local development - fetch from same origin
    const basePath = window.location.pathname.replace(/\/terminal\/?.*$/, '');
    return `${basePath}/data${filePath}`;
  }

  async _fetchFile(filePath, filename) {
    try {
      const url = this._buildDataUrl(filePath);

      const response = await fetch(url);
      if (!response.ok) throw new Error('File not found');

      const content = await response.text();

      this._output = [...this._output, {
        type: 'file-content',
        filename,
        content
      }];
      this.requestUpdate();

      this.updateComplete.then(() => {
        const output = this.shadowRoot.querySelector('.terminal-output');
        if (output) output.scrollTop = output.scrollHeight;
      });
    } catch (err) {
      this._output = [...this._output, {
        type: 'error',
        content: `cat: ${filename}: No such file`
      }];
      this.requestUpdate();
    }
  }

  async _fetchAndSendFile(filePath, filename) {
    try {
      const url = this._buildDataUrl(filePath);

      const response = await fetch(url);
      if (!response.ok) throw new Error('File not found');

      const content = await response.text();

      // Send to agent
      if (this.peerService) {
        this.peerService.send({
          type: TERM_MSG.FILE_CONTENT,
          filename,
          path: filePath,
          content
        });
      }

      this._output = [...this._output, {
        type: 'download-success',
        content: `Transfer complete: ${filename}`
      }];
      this.requestUpdate();
    } catch (err) {
      this._output = [...this._output, {
        type: 'error',
        content: `download: ${filename}: Transfer failed`
      }];
      this.requestUpdate();
    }
  }

  _renderOutput(item) {
    if (item.type === 'command') {
      return html`
        <div class="prompt">${this._cwd}> ${item.command}</div>
        ${item.result ? html`<div class="${item.isError ? 'error' : 'output'}">${item.result}</div>` : ''}
      `;
    }
    if (item.type === 'file-content') {
      return html`
        <cypher-markdown
          .filename=${item.filename}
          .content=${item.content}
        ></cypher-markdown>
      `;
    }
    if (item.type === 'download-success') {
      return html`<div class="success">${item.content}</div>`;
    }
    if (item.type === 'error') {
      return html`<div class="error">${item.content}</div>`;
    }
    return html`<div class="output">${JSON.stringify(item)}</div>`;
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
        <div class="output">Type 'help' for available commands.</div>
        ${this._output.map(item => this._renderOutput(item))}
      </div>
    `;
  }
}

customElements.define('terminal-main', TerminalMain);
