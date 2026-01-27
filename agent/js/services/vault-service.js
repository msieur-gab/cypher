/**
 * VaultService — orchestrates DID identity generation and vault activation.
 *
 * Encapsulates calls to crypto utilities and storage service so app.js
 * only handles UI state transitions.
 */
import { generateMnemonic, deriveIdentity, encrypt } from '../../../shared/utils/crypto.js';
import { storageService } from '../../../shared/services/storage-service.js';

export class VaultService {
  /**
   * Generate a new BIP-39 mnemonic phrase.
   * @returns {Promise<string>} 12-word mnemonic
   */
  async generateKeys() {
    return generateMnemonic();
  }

  /**
   * Derive identity from mnemonic, encrypt the private key,
   * persist to storage, and update the profile.
   *
   * @param {string} mnemonic - 12-word recovery phrase
   * @param {{ codename: string, level: number, avatar: string, did?: string }} profile
   * @returns {Promise<{ identity: { did: string, publicKey: string }, profile: object }>}
   */
  async activate(mnemonic, profile) {
    const identity = await deriveIdentity(mnemonic);

    // Encrypt private key with storage key before persisting
    const encryptedKey = await encrypt(identity.storageKey, identity.privateKey);

    await storageService.saveIdentity({
      did: identity.did,
      publicKey: identity.publicKey,
      encryptedKey,
      storageKey: identity.storageKey,
    });

    // Update profile with DID and bump clearance
    await storageService.updateDid(identity.did);
    const newLevel = Math.max((profile?.level || 1) + 1, 2);
    await storageService.updateLevel(newLevel);

    const updatedProfile = { ...profile, did: identity.did, level: newLevel };

    return {
      identity: { did: identity.did, publicKey: identity.publicKey },
      profile: updatedProfile,
    };
  }

  /**
   * Load a previously stored identity, if any.
   * @returns {Promise<{ did: string, publicKey: string }|null>}
   */
  async loadIdentity() {
    try {
      const id = await storageService.getIdentity();
      if (id) return { did: id.did, publicKey: id.publicKey };
    } catch { /* empty */ }
    return null;
  }
}
