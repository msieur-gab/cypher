/**
 * ClockController — Lit reactive controller for live clock display.
 *
 * Usage:
 *   this._clock = new ClockController(this, { seconds: true });
 *   // In template: ${this._clock.time}  ${this._clock.date}
 */
export class ClockController {
  /**
   * @param {import('lit').ReactiveControllerHost} host
   * @param {{ seconds?: boolean }} options
   */
  constructor(host, { seconds = false } = {}) {
    this._host = host;
    this._seconds = seconds;
    this._interval = null;
    this.time = '';
    this.date = '';
    host.addController(this);
  }

  hostConnected() {
    this._update();
    this._interval = setInterval(() => this._update(), 1000);
  }

  hostDisconnected() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _update() {
    const now = new Date();
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    if (this._seconds) opts.second = '2-digit';
    this.time = now.toLocaleTimeString([], opts);
    this.date = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    this._host.requestUpdate();
  }
}
