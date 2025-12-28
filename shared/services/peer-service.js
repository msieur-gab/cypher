/**
 * CYPHER PeerService - WebRTC connection management via PeerJS
 */
import { Peer } from 'https://esm.sh/peerjs@1';
import { STATE, HEARTBEAT, MSG } from '../utils/protocol.js';

export class PeerService extends EventTarget {
  constructor() {
    super();
    this.peer = null;
    this.connection = null;
    this.state = STATE.DISCONNECTED;
    this.heartbeatInterval = null;
    this.lastPong = 0;
  }

  /**
   * Create a terminal peer (waits for incoming connections)
   * @param {string} sessionId - Unique session identifier
   */
  createTerminal(sessionId) {
    this.peer = new Peer(`cypher-${sessionId}`, { debug: 1 });

    this.peer.on('open', id => {
      console.log('[PeerService] Terminal ready:', id);
      this._emit('ready', { peerId: id });
    });

    this.peer.on('connection', conn => {
      this.connection = conn;
      this._setState(STATE.CONNECTING);
      this._setupConnection(conn, true);
    });

    this.peer.on('disconnected', () => {
      console.log('[PeerService] Signaling server disconnected, attempting reconnect...');
      // Try to reconnect to signaling server (doesn't affect existing P2P connections)
      this.peer.reconnect();
    });

    this.peer.on('error', err => {
      console.error('[PeerService] Peer error:', err);
      // Don't emit error for server disconnect if we have an active connection
      if (err.type !== 'server-error' || !this.connection?.open) {
        this._emit('error', { error: err });
      }
    });
  }

  /**
   * Create an agent peer and connect to terminal
   * @param {string} sessionId - Session ID from QR code
   */
  connectAsAgent(sessionId) {
    this.peer = new Peer();

    this.peer.on('open', id => {
      console.log('[PeerService] Agent ready:', id);

      this.connection = this.peer.connect(`cypher-${sessionId}`, { reliable: true });
      this._setState(STATE.CONNECTING);
      this._setupConnection(this.connection, false);
    });

    this.peer.on('disconnected', () => {
      console.log('[PeerService] Signaling server disconnected, attempting reconnect...');
      this.peer.reconnect();
    });

    this.peer.on('error', err => {
      console.error('[PeerService] Peer error:', err);
      if (err.type !== 'server-error' || !this.connection?.open) {
        this._emit('error', { error: err });
      }
    });
  }

  /**
   * Set up connection event handlers
   * @param {DataConnection} conn
   * @param {boolean} isTerminal
   */
  _setupConnection(conn, isTerminal) {
    conn.on('open', () => {
      console.log('[PeerService] Connection open');
      this._setState(STATE.CONNECTED);
      this.lastPong = Date.now();

      if (isTerminal) {
        this._startHeartbeat();
      }

      this._emit('connected', { connection: conn });
    });

    conn.on('data', data => {
      // Handle heartbeat internally
      if (data.type === 'HEARTBEAT') {
        this.send({ type: MSG.PONG });
        return;
      }
      if (data.type === MSG.PONG) {
        this.lastPong = Date.now();
        return;
      }

      this._emit('data', { data });
    });

    conn.on('close', () => {
      console.log('[PeerService] Connection closed');
      this._stopHeartbeat();
      this._setState(STATE.LOCKED);
      this._emit('disconnected', {});
    });

    conn.on('error', err => {
      console.error('[PeerService] Connection error:', err);
      this._stopHeartbeat();
      this._emit('error', { error: err });
    });
  }

  /**
   * Send data to connected peer
   * @param {object} data - Data to send
   */
  send(data) {
    if (this.connection?.open) {
      this.connection.send(data);
      return true;
    }
    return false;
  }

  /**
   * Start heartbeat (terminal only)
   */
  _startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastPong > HEARTBEAT.TIMEOUT) {
        console.log('[PeerService] Heartbeat timeout');
        this._stopHeartbeat();
        this.connection?.close();
        this._setState(STATE.LOCKED);
        this._emit('disconnected', { reason: 'timeout' });
      } else if (this.connection?.open) {
        this.send({ type: 'HEARTBEAT' });
      }
    }, HEARTBEAT.INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Update connection state
   * @param {string} newState
   */
  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this._emit('statechange', { state: newState, previousState: oldState });
  }

  /**
   * Emit custom event
   * @param {string} type
   * @param {object} detail
   */
  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Clean up and disconnect
   */
  destroy() {
    this._stopHeartbeat();
    this.connection?.close();
    this.peer?.destroy();
    this._setState(STATE.DISCONNECTED);
  }
}
