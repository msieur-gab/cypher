/**
 * NEXUS View Component
 * A full-screen view container for mobile apps
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import './nexus-button.js';

export class NexusView extends LitElement {
  static properties = {
    title: { type: String },
    active: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: none;
      position: fixed;
      top: 36px;
      left: 0;
      right: 0;
      bottom: 64px;
      background: var(--nx-bg);
      z-index: 50;
      flex-direction: column;
    }

    :host([active]) {
      display: flex;
    }

    .header {
      height: 44px;
      border-bottom: var(--nx-thin) solid var(--nx-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--nx-md);
      background: var(--nx-bg-raised);
      flex-shrink: 0;
    }

    .title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .body {
      flex: 1;
      overflow-y: auto;
      padding: var(--nx-md);
    }
  `;

  _close() {
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="header">
        <span class="title">${this.title}</span>
        <div style="display: flex; align-items: center; gap: var(--nx-xs);">
          <slot name="header-right"></slot>
          <nexus-button variant="ghost" icon="close" icon-only @click=${this._close}></nexus-button>
        </div>
      </div>
      <div class="body">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('nexus-view', NexusView);
