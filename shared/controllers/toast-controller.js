/**
 * ToastController — Lit reactive controller for showing toast notifications.
 *
 * Usage:
 *   this._toast = new ToastController(this);
 *   this._toast.show('Connected', 'success');
 */
export class ToastController {
  /**
   * @param {import('lit').ReactiveControllerHost & HTMLElement} host
   * @param {{ duration?: number }} options
   */
  constructor(host, { duration = 3000 } = {}) {
    this._host = host;
    this._duration = duration;
    host.addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}

  /**
   * @param {string} message
   * @param {'info'|'success'|'warning'|'error'} variant
   */
  show(message, variant = 'info') {
    const container = this._host.renderRoot.querySelector('nexus-toast-container');
    if (container) {
      container.add(message, { variant, duration: this._duration });
    }
  }
}
