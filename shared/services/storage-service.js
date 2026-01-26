/**
 * CYPHER StorageService - IndexedDB wrapper using Dexie
 *
 * Schema v2 adds the `identity` table for DID key storage.
 * CryptoKey objects (AES-GCM storageKey) are stored directly —
 * IndexedDB supports structured-cloneable CryptoKey objects.
 * The Ed25519 private key is stored encrypted under the storage key.
 */
import Dexie from 'https://esm.sh/dexie@4';

class CypherDatabase extends Dexie {
  constructor() {
    super('CypherAgent');

    this.version(1).stores({
      agent: 'id, codename, level, avatar',
      downloads: '++id, filename, path, content, downloadedAt'
    });

    // v2: add identity table, add 'did' to agent profile
    this.version(2).stores({
      agent: 'id, codename, level, avatar, did',
      downloads: '++id, filename, path, content, downloadedAt',
      identity: 'id'
    });
  }
}

export class StorageService {
  constructor() {
    this.db = new CypherDatabase();
  }

  // ── Agent profile ──

  async getProfile() {
    return await this.db.agent.get('player');
  }

  async saveProfile(profile) {
    return await this.db.agent.put({
      id: 'player',
      codename: profile.codename,
      level: profile.level || 1,
      avatar: profile.avatar,
      did: profile.did || null,
    });
  }

  async updateLevel(level) {
    return await this.db.agent.update('player', { level });
  }

  async updateDid(did) {
    return await this.db.agent.update('player', { did });
  }

  async clearProfile() {
    return await this.db.agent.delete('player');
  }

  // ── Identity (DID keys) ──
  //
  // Stores:
  //   did            - did:key:z... string (public)
  //   publicKey      - Uint8Array, 32 bytes (public)
  //   encryptedKey   - Uint8Array, encrypted Ed25519 private key
  //   storageKey     - CryptoKey (AES-GCM, non-extractable)

  async getIdentity() {
    return await this.db.identity.get('keys');
  }

  async saveIdentity({ did, publicKey, encryptedKey, storageKey }) {
    return await this.db.identity.put({
      id: 'keys',
      did,
      publicKey,
      encryptedKey,
      storageKey,
    });
  }

  async clearIdentity() {
    return await this.db.identity.delete('keys');
  }

  // ── Downloads / Intel ──

  async saveDownload(file) {
    return await this.db.downloads.add({
      filename: file.filename,
      path: file.path,
      content: file.content,
      downloadedAt: Date.now()
    });
  }

  async getDownloads() {
    return await this.db.downloads.orderBy('downloadedAt').reverse().toArray();
  }

  async getDownload(id) {
    return await this.db.downloads.get(id);
  }

  async hasDownload(path) {
    const count = await this.db.downloads.where('path').equals(path).count();
    return count > 0;
  }

  async clearDownloads() {
    return await this.db.downloads.clear();
  }

  // ── Session (localStorage) ──

  getLastSession() {
    return localStorage.getItem('cypher_last_session');
  }

  saveSession(sessionId) {
    localStorage.setItem('cypher_last_session', sessionId);
  }

  clearSession() {
    localStorage.removeItem('cypher_last_session');
  }
}

// Singleton instance
export const storageService = new StorageService();
