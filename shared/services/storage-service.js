/**
 * CYPHER StorageService - IndexedDB wrapper using Dexie
 */
import Dexie from 'https://esm.sh/dexie@4';

class CypherDatabase extends Dexie {
  constructor() {
    super('CypherAgent');

    this.version(1).stores({
      agent: 'id, codename, level, avatar',
      downloads: '++id, filename, path, content, downloadedAt'
    });
  }
}

export class StorageService {
  constructor() {
    this.db = new CypherDatabase();
  }

  // Agent profile methods
  async getProfile() {
    return await this.db.agent.get('player');
  }

  async saveProfile(profile) {
    return await this.db.agent.put({
      id: 'player',
      codename: profile.codename,
      level: profile.level || 1,
      avatar: profile.avatar
    });
  }

  async updateLevel(level) {
    return await this.db.agent.update('player', { level });
  }

  async clearProfile() {
    return await this.db.agent.delete('player');
  }

  // Downloads/Intel methods
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

  // Session methods (using localStorage for simplicity)
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
