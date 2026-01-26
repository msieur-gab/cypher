/**
 * NEXUS Markdown Renderer
 * Styled markdown display using NEXUS tokens
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { unsafeHTML } from 'https://esm.sh/lit@3/directives/unsafe-html.js';

export class NexusMarkdown extends LitElement {
  static properties = {
    content: { type: String },
    filename: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-base, 0.875rem);
      line-height: 1.6;
    }

    .file-header {
      color: var(--nx-primary, #00FFCC);
      padding: var(--nx-sm, 0.5rem);
      margin-bottom: var(--nx-sm, 0.5rem);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
      font-weight: bold;
      letter-spacing: 0.1em;
    }

    .markdown-body {
      padding: var(--nx-sm, 0.5rem);
      background: var(--nx-bg-raised, #111);
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    /* Headers */
    h1, h2, h3, h4 {
      color: var(--nx-primary, #00FFCC);
      margin: var(--nx-md, 1rem) 0 var(--nx-sm, 0.5rem) 0;
      padding-bottom: var(--nx-xs, 0.25rem);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    h1 {
      font-size: var(--nx-text-lg, 1rem);
      text-shadow: var(--nx-glow);
    }

    h3, h4 {
      border-bottom: none;
    }

    h4 {
      color: var(--nx-primary-dim, #00CCAA);
    }

    /* Paragraphs */
    p {
      color: var(--nx-fg-dim, #888);
      margin: var(--nx-sm, 0.5rem) 0;
    }

    /* Strong/Bold */
    strong {
      color: var(--nx-fg, #fff);
      font-weight: bold;
    }

    /* Emphasis */
    em {
      color: var(--nx-fg-muted, #555);
      font-style: italic;
    }

    /* Lists */
    ul, ol {
      color: var(--nx-fg-dim, #888);
      margin: var(--nx-sm, 0.5rem) 0;
      padding-left: var(--nx-lg, 1.5rem);
    }

    li {
      margin: var(--nx-xs, 0.25rem) 0;
    }

    li::marker {
      color: var(--nx-primary, #00FFCC);
    }

    /* Code blocks */
    pre {
      background: var(--nx-bg, #000);
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
      padding: var(--nx-sm, 0.5rem);
      margin: var(--nx-sm, 0.5rem) 0;
      overflow-x: auto;
    }

    code {
      color: var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
    }

    p code {
      background: var(--nx-bg-raised, #111);
      padding: 0.1rem 0.3rem;
    }

    /* Horizontal rule */
    hr {
      border: none;
      border-top: var(--nx-thin, 1px) solid var(--nx-border, #333);
      margin: var(--nx-md, 1rem) 0;
    }

    /* Redacted text */
    .redacted {
      color: var(--nx-fg-muted, #555);
      background: var(--nx-bg-raised, #111);
      padding: 0 0.2rem;
      user-select: none;
    }

    /* Status markers */
    .status-complete { color: var(--nx-primary, #00FFCC); }
    .status-active { color: var(--nx-fg, #fff); }
    .status-pending { color: var(--nx-fg-muted, #555); }

    /* Tables */
    table {
      border-collapse: collapse;
      margin: var(--nx-sm, 0.5rem) 0;
      width: 100%;
    }

    th, td {
      border: var(--nx-thin, 1px) solid var(--nx-border, #333);
      padding: var(--nx-sm, 0.5rem);
      text-align: left;
    }

    th {
      background: var(--nx-bg-raised, #111);
      color: var(--nx-primary, #00FFCC);
    }

    td {
      color: var(--nx-fg-dim, #888);
    }

    /* Blockquotes */
    blockquote {
      border-left: var(--nx-thick, 2px) solid var(--nx-primary, #00FFCC);
      margin: var(--nx-sm, 0.5rem) 0;
      padding-left: var(--nx-md, 1rem);
      color: var(--nx-fg-dim, #888);
      font-style: italic;
    }
  `;

  constructor() {
    super();
    this.content = '';
    this.filename = '';
  }

  _parseMarkdown(md) {
    if (!md) return '';

    let parsed = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')

      // Headers
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')

      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Horizontal rules
      .replace(/^---+$/gm, '<hr>')
      .replace(/^\*\*\*+$/gm, '<hr>')

      // Unordered lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

      // Redacted text
      .replace(/(█+)/g, '<span class="redacted">$1</span>')

      // Status markers
      .replace(/\[COMPLETE\]/g, '<span class="status-complete">[COMPLETE]</span>')
      .replace(/\[ACTIVE\]/g, '<span class="status-active">[ACTIVE]</span>')
      .replace(/\[PENDING\]/g, '<span class="status-pending">[PENDING]</span>')

      // Paragraphs
      .replace(/^(?!<[huplo]|<li|<hr|<pre)(.+)$/gm, '<p>$1</p>')

      // Cleanup
      .replace(/<p><\/p>/g, '')
      .replace(/\n\n/g, '\n');

    return parsed;
  }

  render() {
    const parsed = this._parseMarkdown(this.content);

    return html`
      ${this.filename ? html`
        <div class="file-header">── ${this.filename} ──</div>
      ` : ''}
      <div class="markdown-body">
        ${unsafeHTML(parsed)}
      </div>
    `;
  }
}

customElements.define('nexus-markdown', NexusMarkdown);
