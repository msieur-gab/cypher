/**
 * CYPHER Markdown Renderer - Cyberpunk styled markdown display
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { unsafeHTML } from 'https://esm.sh/lit@3/directives/unsafe-html.js';

export class CypherMarkdown extends LitElement {
  static properties = {
    content: { type: String },
    filename: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: monospace;
      font-size: 0.85rem;
      line-height: 1.6;
    }

    .file-header {
      color: #ff00ff;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 0, 255, 0.3);
      font-weight: bold;
      letter-spacing: 0.1em;
    }

    .markdown-body {
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 255, 204, 0.2);
      border-radius: 4px;
    }

    /* Headers */
    h1, h2, h3, h4 {
      color: #00FFCC;
      margin: 1rem 0 0.5rem 0;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid rgba(0, 255, 204, 0.2);
    }
    h1 { font-size: 1.3rem; text-shadow: 0 0 10px rgba(0, 255, 204, 0.5); }
    h2 { font-size: 1.1rem; }
    h3 { font-size: 1rem; border-bottom: none; }
    h4 { font-size: 0.9rem; border-bottom: none; color: #00CCAA; }

    /* Paragraphs */
    p {
      color: #aaa;
      margin: 0.5rem 0;
    }

    /* Strong/Bold - classification labels */
    strong {
      color: #ffaa00;
      font-weight: bold;
    }

    /* Emphasis/Italic */
    em {
      color: #888;
      font-style: italic;
    }

    /* Lists */
    ul, ol {
      color: #888;
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    li {
      margin: 0.25rem 0;
    }
    li::marker {
      color: #00FFCC;
    }

    /* Code blocks */
    pre {
      background: #000;
      border: 1px solid #333;
      padding: 0.75rem;
      margin: 0.5rem 0;
      overflow-x: auto;
      border-radius: 4px;
    }
    code {
      color: #00FF00;
      font-family: monospace;
      font-size: 0.85rem;
    }
    p code {
      background: rgba(0, 255, 0, 0.1);
      padding: 0.1rem 0.3rem;
      border-radius: 2px;
    }

    /* Horizontal rule */
    hr {
      border: none;
      border-top: 1px solid rgba(0, 255, 204, 0.3);
      margin: 1rem 0;
    }

    /* Redacted text - the █ characters */
    .redacted {
      color: #333;
      background: linear-gradient(90deg, #222 0%, #333 50%, #222 100%);
      padding: 0 0.2rem;
      border-radius: 2px;
      user-select: none;
    }

    /* Status markers */
    .status-complete { color: #00FF00; }
    .status-active { color: #ffaa00; }
    .status-pending { color: #666; }

    /* Tables (basic) */
    table {
      border-collapse: collapse;
      margin: 0.5rem 0;
      width: 100%;
    }
    th, td {
      border: 1px solid #333;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: rgba(0, 255, 204, 0.1);
      color: #00FFCC;
    }
    td {
      color: #888;
    }

    /* Blockquotes */
    blockquote {
      border-left: 3px solid #ff00ff;
      margin: 0.5rem 0;
      padding-left: 1rem;
      color: #888;
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

    let html = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Code blocks (before other processing)
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

      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

      // Redacted text (█ characters)
      .replace(/(█+)/g, '<span class="redacted">$1</span>')

      // Status markers
      .replace(/\[COMPLETE\]/g, '<span class="status-complete">[COMPLETE]</span>')
      .replace(/\[ACTIVE\]/g, '<span class="status-active">[ACTIVE]</span>')
      .replace(/\[PENDING\]/g, '<span class="status-pending">[PENDING]</span>')

      // Paragraphs (lines not already wrapped)
      .replace(/^(?!<[huplo]|<li|<hr|<pre)(.+)$/gm, '<p>$1</p>')

      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')

      // Line breaks
      .replace(/\n\n/g, '\n');

    return html;
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

customElements.define('cypher-markdown', CypherMarkdown);
