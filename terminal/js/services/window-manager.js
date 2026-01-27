/**
 * WindowManager — imperative window lifecycle for the terminal desktop.
 *
 * Manages: element creation, z-index stacking, cascade offset, open/close tracking.
 * The host passes content-generation and post-render setup as callbacks.
 */
export class WindowManager {
  /**
   * @param {{
   *   getLayer: () => Element|null,
   *   getContent: (id: string) => string,
   *   setupBehavior: (id: string, win: Element) => void,
   *   onOpenChange: (openIds: Record<string, boolean>) => void,
   * }} callbacks
   * @param {Record<string, { title: string, width: number, height: number }>} appDefs
   */
  constructor(callbacks, appDefs) {
    this._cb = callbacks;
    this._apps = appDefs;
    this._elements = new Map();
    this._zCounter = 100;
    this._offset = 0;
    this._openIds = {};
  }

  /** @returns {Record<string, boolean>} */
  get openIds() {
    return this._openIds;
  }

  open(id) {
    if (this._elements.has(id)) {
      this.focus(id);
      return;
    }

    const app = this._apps[id];
    if (!app) return;

    const layer = this._cb.getLayer();
    if (!layer) return;

    const win = document.createElement('nexus-window');
    win.id = `window-${id}`;
    win.title = app.title;
    win.width = app.width;
    win.height = app.height;
    win.x = 150 + this._offset * 30;
    win.y = 80 + this._offset * 30;
    this._offset = (this._offset + 1) % 5;

    win.addEventListener('close', () => this.close(id));
    win.addEventListener('focus-window', () => this.focus(id));

    win.innerHTML = this._cb.getContent(id);

    layer.appendChild(win);
    this._elements.set(id, win);
    this._openIds = { ...this._openIds, [id]: true };
    this._cb.onOpenChange(this._openIds);
    this.focus(id);

    requestAnimationFrame(() => this._cb.setupBehavior(id, win));
  }

  close(id) {
    const win = this._elements.get(id);
    if (win) {
      win.remove();
      this._elements.delete(id);
      const { [id]: _, ...rest } = this._openIds;
      this._openIds = rest;
      this._cb.onOpenChange(this._openIds);
    }
  }

  focus(id) {
    this._elements.forEach(w => { w.style.zIndex = '40'; });
    const win = this._elements.get(id);
    if (win) {
      win.style.zIndex = String(++this._zCounter);
    }
  }

  closeAll() {
    this._elements.forEach(w => w.remove());
    this._elements.clear();
    this._openIds = {};
    this._offset = 0;
    this._cb.onOpenChange(this._openIds);
  }
}
