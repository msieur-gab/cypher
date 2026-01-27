/**
 * ConnectionManager — wraps PeerService lifecycle, wake lock, and message routing.
 *
 * Extends EventTarget to emit semantic events:
 *   'status-change'   — detail: { status: 'offline'|'connecting'|'online' }
 *   'file-received'   — detail: { filename, path, content }
 *   'mission-trigger'  — detail: { mission: string }
 *   'error'           — detail: { error }
 */
import { PeerService } from '../../../shared/services/peer-service.js';
import { storageService } from '../../../shared/services/storage-service.js';
import { MSG, TERM_MSG } from '../../../shared/utils/protocol.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakelock.js';

export class ConnectionManager extends EventTarget {
  constructor() {
    super();
    this.peerService = new PeerService();
    this._bound = false;
    this._status = 'offline';
  }

  get status() {
    return this._status;
  }

  /**
   * Connect to a terminal session.
   * @param {string} sessionId
   * @param {{ profile: object, did: string|null }} initPayload - data sent on connect
   */
  connect(sessionId, initPayload) {
    this._setStatus('connecting');

    if (!this._bound) {
      this._bound = true;

      this.peerService.addEventListener('connected', () => {
        this._setStatus('online');
        requestWakeLock();

        this.peerService.send({
          type: MSG.INIT_STATE,
          profile: initPayload.profile,
          did: initPayload.did,
        });
      });

      this.peerService.addEventListener('disconnected', () => {
        this._setStatus('offline');
        releaseWakeLock();
      });

      this.peerService.addEventListener('data', async (e) => {
        const { data } = e.detail;

        if (data.type === 'FILE_CONTENT') {
          try {
            await storageService.saveDownload({
              filename: data.filename,
              path: data.path,
              content: data.content,
            });
            const downloads = await storageService.getDownloads();
            this.dispatchEvent(new CustomEvent('file-received', {
              detail: { filename: data.filename, downloads },
            }));
          } catch (err) {
            console.error('[Agent] Failed to save download:', err);
            this.dispatchEvent(new CustomEvent('error', {
              detail: { error: err, context: 'save-download' },
            }));
          }
        }

        if (data.type === TERM_MSG.MISSION_TRIGGER) {
          this.dispatchEvent(new CustomEvent('mission-trigger', {
            detail: { mission: data.mission },
          }));
        }
      });

      this.peerService.addEventListener('error', (e) => {
        console.error('[Agent] Peer error:', e.detail.error);
        this._setStatus('offline');
      });
    }

    this.peerService.connectAsAgent(sessionId);
  }

  /**
   * Disconnect from the terminal and clean up.
   */
  disconnect() {
    releaseWakeLock();
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._bound = false;
    this._setStatus('offline');
  }

  /**
   * Full teardown — used during agent reset.
   */
  destroy() {
    releaseWakeLock();
    this.peerService.destroy();
    this.peerService = new PeerService();
    this._bound = false;
    this._status = 'offline';
  }

  _setStatus(status) {
    this._status = status;
    this.dispatchEvent(new CustomEvent('status-change', {
      detail: { status },
    }));
  }
}
