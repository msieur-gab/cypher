/**
 * NEXUS File Browser Component
 * Two-pane list-detail view
 * Left: file list, Right: preview/detail
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusFileBrowser extends LitElement {
  static properties = {
    listWidth: { type: String, attribute: 'list-width' },
    selectedIndex: { type: Number, attribute: 'selected-index' },
    collapsed: { type: Boolean, reflect: true }, // Mobile: show only one pane
    showDetail: { type: Boolean, reflect: true, attribute: 'show-detail' }, // Mobile: which pane
  };

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      min-height: 0;
    }

    /* List pane */
    .list-pane {
      width: var(--list-width, 240px);
      min-width: 180px;
      max-width: 50%;
      border-right: var(--nx-thin, 1px) solid var(--nx-border, #333);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    /* Detail pane */
    .detail-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Pane headers */
    .pane-header {
      flex-shrink: 0;
      padding: var(--nx-sm, 0.5rem) var(--nx-md, 1rem);
      border-bottom: var(--nx-thin, 1px) solid var(--nx-border, #333);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-dim, #888);
      background: var(--nx-bg-raised, #111);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pane-header .count {
      color: var(--nx-primary, #00FFCC);
    }

    /* Back button for mobile */
    .back-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--nx-primary, #00FFCC);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      cursor: pointer;
      padding: 0;
      margin-right: var(--nx-sm, 0.5rem);
    }

    /* Pane body */
    .pane-body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--nx-fg-muted, #555);
      font-family: var(--nx-font, monospace);
      font-size: var(--nx-text-sm, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Scrollbar */
    .pane-body::-webkit-scrollbar {
      width: 10px;
    }

    .pane-body::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    .pane-body::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    .pane-body::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }

    /* Responsive - collapsed mode */
    @media (max-width: 640px) {
      :host {
        display: block;
      }

      .list-pane,
      .detail-pane {
        width: 100%;
        max-width: none;
        height: 100%;
        border-right: none;
      }

      :host(:not([show-detail])) .detail-pane {
        display: none;
      }

      :host([show-detail]) .list-pane {
        display: none;
      }

      :host([show-detail]) .back-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--nx-xs, 0.25rem);
      }
    }
  `;

  constructor() {
    super();
    this.listWidth = '240px';
    this.selectedIndex = -1;
    this.collapsed = false;
    this.showDetail = false;
  }

  updated(changedProperties) {
    if (changedProperties.has('listWidth')) {
      this.style.setProperty('--list-width', this.listWidth);
    }
  }

  _handleSelectionChange(e) {
    this.selectedIndex = e.detail.index;

    // On mobile, show detail pane when item selected
    if (window.innerWidth <= 640) {
      this.showDetail = true;
    }

    // Re-dispatch the event
    this.dispatchEvent(new CustomEvent('selection-change', {
      bubbles: true,
      composed: true,
      detail: e.detail
    }));
  }

  _showList() {
    this.showDetail = false;
  }

  render() {
    return html`
      <div class="list-pane">
        <div class="pane-header">
          <slot name="list-header">
            <span>Files</span>
          </slot>
        </div>
        <div class="pane-body" @selection-change=${this._handleSelectionChange}>
          <slot name="list"></slot>
        </div>
      </div>

      <div class="detail-pane">
        <div class="pane-header">
          <button class="back-btn" @click=${this._showList}>
            ← Back
          </button>
          <slot name="detail-header">
            <span>Preview</span>
          </slot>
        </div>
        <div class="pane-body">
          <slot name="detail">
            <div class="empty-state">Select a file to preview</div>
          </slot>
        </div>
      </div>
    `;
  }
}

customElements.define('nexus-file-browser', NexusFileBrowser);
