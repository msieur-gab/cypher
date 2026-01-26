/**
 * TerminalFS — Virtual file system + command handler for the NEXUS terminal.
 *
 * Mirrors the /data/ folder on disk and fetches real markdown content via
 * fetch(). The `download` command sends file content to the connected agent
 * over the PeerService P2P channel.
 */
import { TERM_MSG } from '../../../shared/utils/protocol.js';

// Virtual directory tree — must match /data/ on disk
const FILE_SYSTEM = {
  '/':            { dirs: ['intel', 'personnel', 'operations'], files: ['README.md'] },
  '/intel':       { dirs: [], files: ['report-2847.md', 'intercept-445.md'] },
  '/personnel':   { dirs: [], files: ['asset-kondor.md'] },
  '/operations':  { dirs: [], files: ['nightfall-brief.md'] },
};

export class TerminalFS {
  /**
   * @param {HTMLElement} terminal  — <nexus-terminal> element (addLine / clear)
   * @param {PeerService} peerService — for sending files to the agent
   */
  constructor(terminal, peerService) {
    this._terminal = terminal;
    this._peer = peerService;
    this._cwd = '/';
  }

  /** Update terminal ref when window is re-opened */
  setTerminal(terminal) {
    this._terminal = terminal;
  }

  // ── Command Dispatch ──────────────────────────────────────────────

  execute(commandString) {
    const parts = commandString.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (cmd) {
      case 'ls':       this._ls(args);       break;
      case 'cd':       this._cd(args);       break;
      case 'cat':      this._cat(args);      break;
      case 'pwd':      this._pwd();          break;
      case 'download': this._download(args); break;
      case 'help':     this._help();         break;
      case 'clear':    this._clear();        break;
      default:
        this._terminal.addLine(`Unknown command: ${cmd}`, 'error');
    }
  }

  // ── Commands ──────────────────────────────────────────────────────

  _ls(arg) {
    const dir = arg ? this._resolvePath(arg) : this._cwd;
    const entry = FILE_SYSTEM[dir];
    if (!entry) {
      this._terminal.addLine(`ls: ${dir}: No such directory`, 'error');
      return;
    }

    const lines = [];
    for (const d of entry.dirs)  lines.push(`[DIR]  ${d}`);
    for (const f of entry.files) lines.push(`[FILE] ${f}`);

    if (lines.length === 0) {
      this._terminal.addLine('(empty directory)', 'dim');
    } else {
      for (const l of lines) this._terminal.addLine(l, 'output');
    }
  }

  _cd(arg) {
    if (!arg || arg === '~') {
      this._cwd = '/';
      return;
    }

    const target = this._resolvePath(arg);

    if (FILE_SYSTEM[target]) {
      this._cwd = target;
      return;
    }

    this._terminal.addLine(`cd: ${arg}: No such directory`, 'error');
  }

  async _cat(arg) {
    if (!arg) {
      this._terminal.addLine('Usage: cat <filename>', 'error');
      return;
    }

    const filePath = this._resolveFilePath(arg);
    if (!filePath) {
      this._terminal.addLine(`cat: ${arg}: No such file`, 'error');
      return;
    }

    try {
      const content = await this._fetchFile(filePath);
      // Print each line individually so the terminal renders them
      const lines = content.split('\n');
      for (const line of lines) {
        this._terminal.addLine(line, 'output');
      }
    } catch {
      this._terminal.addLine(`cat: ${arg}: Failed to read file`, 'error');
    }
  }

  _pwd() {
    this._terminal.addLine(this._cwd, 'output');
  }

  async _download(arg) {
    if (!arg) {
      this._terminal.addLine('Usage: download <filename>', 'error');
      return;
    }

    const filePath = this._resolveFilePath(arg);
    if (!filePath) {
      this._terminal.addLine(`download: ${arg}: No such file`, 'error');
      return;
    }

    if (!this._peer) {
      this._terminal.addLine('download: No peer connection available', 'error');
      return;
    }

    try {
      const content = await this._fetchFile(filePath);
      const filename = filePath.split('/').pop();

      this._peer.send({
        type: TERM_MSG.FILE_CONTENT,
        filename,
        path: filePath,
        content,
      });

      this._terminal.addLine(`Sent ${filename} to agent`, 'system');
    } catch {
      this._terminal.addLine(`download: ${arg}: Failed to read file`, 'error');
    }
  }

  _help() {
    const cmds = [
      ['ls [dir]',        'List directory contents'],
      ['cd <dir>',        'Change directory (.. for parent)'],
      ['cat <file>',      'Display file contents'],
      ['download <file>', 'Send file to connected agent'],
      ['pwd',             'Print working directory'],
      ['help',            'Show this help message'],
      ['clear',           'Clear terminal output'],
    ];

    this._terminal.addLine('Available commands:', 'system');
    for (const [name, desc] of cmds) {
      this._terminal.addLine(`  ${name.padEnd(18)} ${desc}`, 'output');
    }
  }

  _clear() {
    this._terminal.clear();
  }

  // ── Path Resolution ───────────────────────────────────────────────

  /**
   * Resolve a user-supplied path to an absolute directory path.
   * Handles `/`, `..`, and relative segments.
   */
  _resolvePath(input) {
    let segments;

    if (input.startsWith('/')) {
      segments = input.split('/').filter(Boolean);
    } else {
      segments = [...this._cwd.split('/').filter(Boolean), ...input.split('/').filter(Boolean)];
    }

    const resolved = [];
    for (const seg of segments) {
      if (seg === '..') {
        resolved.pop();
      } else if (seg !== '.') {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/') || '/';
  }

  /**
   * Resolve a filename (relative or absolute) to a full /path/file path.
   * Returns null if the file doesn't exist in the virtual FS.
   */
  _resolveFilePath(input) {
    // If input contains a slash, split into dir + file
    if (input.includes('/')) {
      const lastSlash = input.lastIndexOf('/');
      const dirPart = input.substring(0, lastSlash) || '/';
      const filePart = input.substring(lastSlash + 1);
      const dir = this._resolvePath(dirPart);
      const entry = FILE_SYSTEM[dir];
      if (entry && entry.files.includes(filePart)) {
        return dir === '/' ? `/${filePart}` : `${dir}/${filePart}`;
      }
      return null;
    }

    // Plain filename — look in cwd
    const entry = FILE_SYSTEM[this._cwd];
    if (entry && entry.files.includes(input)) {
      return this._cwd === '/' ? `/${input}` : `${this._cwd}/${input}`;
    }
    return null;
  }

  // ── File Fetching ─────────────────────────────────────────────────

  /**
   * Build a URL pointing at /data/<filePath> relative to the terminal app.
   */
  _buildDataUrl(filePath) {
    const base = window.location.pathname.replace(/\/terminal\/?.*$/, '');
    return `${base}/data${filePath}`;
  }

  /**
   * Fetch a file's text content from /data/.
   */
  async _fetchFile(filePath) {
    const url = this._buildDataUrl(filePath);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
}
