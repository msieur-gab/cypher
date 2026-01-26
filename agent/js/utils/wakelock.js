/**
 * NEXUS WakeLock — Keeps mobile screen awake during active sessions
 *
 * The browser auto-releases the lock when the tab becomes hidden.
 * This module tracks intent (_wanted) and re-acquires automatically
 * when the tab becomes visible again.
 */

let _lock = null;
let _wanted = false;

async function _acquire() {
  if (!('wakeLock' in navigator) || _lock) return false;

  try {
    _lock = await navigator.wakeLock.request('screen');
    _lock.addEventListener('release', () => { _lock = null; });
    console.log('[WakeLock] Acquired');
    return true;
  } catch (err) {
    console.warn('[WakeLock] Failed:', err.message);
    return false;
  }
}

export async function requestWakeLock() {
  _wanted = true;
  return _acquire();
}

export function releaseWakeLock() {
  _wanted = false;
  if (_lock) {
    _lock.release();
    _lock = null;
    console.log('[WakeLock] Released');
  }
}

export function isWakeLockActive() {
  return _lock !== null && !_lock.released;
}

// Re-acquire when tab becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wanted && !_lock) {
    _acquire();
  }
});
