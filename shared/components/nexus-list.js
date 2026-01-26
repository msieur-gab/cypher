/**
 * NEXUS List Component
 * Scrollable list container with keyboard navigation and selection
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class NexusList extends LitElement {
  static properties = {
    selectable: { type: Boolean },
    selectedIndex: { type: Number, attribute: 'selected-index' },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* Header slot */
    .header {
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

    .header:empty {
      display: none;
    }

    .header ::slotted(.count) {
      color: var(--nx-primary, #00FFCC);
    }

    /* List container */
    .list {
      flex: 1;
      overflow-y: auto;
      outline: none;
    }

    /* Scrollbar */
    .list::-webkit-scrollbar {
      width: 10px;
    }

    .list::-webkit-scrollbar-track {
      background: var(--nx-bg, #000);
      border-left: var(--nx-thin, 1px) solid var(--nx-border, #333);
    }

    .list::-webkit-scrollbar-thumb {
      background-color: var(--nx-bg, #000);
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
      border: var(--nx-thin, 1px) solid var(--nx-primary, #00FFCC);
    }

    .list::-webkit-scrollbar-thumb:hover {
      background-color: var(--nx-primary, #00FFCC);
      background-image: none;
    }

    /* Focused list - enhance selected item */
    .list:focus ::slotted(nexus-list-item[selected])::before {
      opacity: 1 !important;
    }

    /* Empty state */
    .empty {
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
  `;

  constructor() {
    super();
    this.selectable = true;
    this.selectedIndex = -1;
    this._items = [];
  }

  firstUpdated() {
    this._updateItems();

    // Listen for slotchange to track items
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    slot?.addEventListener('slotchange', () => this._updateItems());
  }

  _updateItems() {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    this._items = slot?.assignedElements().filter(
      el => el.tagName === 'NEXUS-LIST-ITEM'
    ) || [];

    // Apply initial selection
    if (this.selectedIndex >= 0 && this.selectedIndex < this._items.length) {
      this._selectItem(this.selectedIndex);
    }
  }

  _handleKeydown(e) {
    if (!this.selectable || this._items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._selectItem(Math.min(this.selectedIndex + 1, this._items.length - 1));
        this._scrollToSelected();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._selectItem(Math.max(this.selectedIndex - 1, 0));
        this._scrollToSelected();
        break;
      case 'Home':
        e.preventDefault();
        this._selectItem(0);
        this._scrollToSelected();
        break;
      case 'End':
        e.preventDefault();
        this._selectItem(this._items.length - 1);
        this._scrollToSelected();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this._activateItem(this.selectedIndex);
        }
        break;
    }
  }

  _handleItemClick(e) {
    if (!this.selectable) return;

    const item = e.detail?.item;
    const index = this._items.indexOf(item);
    if (index >= 0) {
      this._selectItem(index);
      this._activateItem(index);
    }
  }

  _selectItem(index) {
    // Clear previous selection
    this._items.forEach((item, i) => {
      item.selected = (i === index);
    });

    this.selectedIndex = index;

    this.dispatchEvent(new CustomEvent('selection-change', {
      bubbles: true,
      composed: true,
      detail: {
        index,
        item: this._items[index]
      }
    }));
  }

  _activateItem(index) {
    this.dispatchEvent(new CustomEvent('item-activate', {
      bubbles: true,
      composed: true,
      detail: {
        index,
        item: this._items[index]
      }
    }));
  }

  _scrollToSelected() {
    const selected = this._items[this.selectedIndex];
    selected?.scrollIntoView({ block: 'nearest' });
  }

  // Public methods
  selectIndex(index) {
    if (index >= 0 && index < this._items.length) {
      this._selectItem(index);
    }
  }

  getSelectedItem() {
    return this._items[this.selectedIndex] || null;
  }

  render() {
    return html`
      <div class="header">
        <slot name="header"></slot>
      </div>

      <div
        class="list"
        tabindex="0"
        @keydown=${this._handleKeydown}
        @item-click=${this._handleItemClick}
      >
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('nexus-list', NexusList);
