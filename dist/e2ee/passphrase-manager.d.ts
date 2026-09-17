/**
 * PassphraseManager - Manages the personal passphrase system for E2EE.
 *
 * This module ties together PassphraseCrypto with the server API to provide:
 * - Setup flow: generate keys, derive KWK, encrypt, send to server
 * - Unlock flow: fetch from server, derive KWK, decrypt, store in sessionStorage
 * - Recovery flow: use recovery key to decrypt backup, re-encrypt with new passphrase
 * - Key checking: determine if user has encryption keys set up
 * - DEK retrieval: get the document encryption key for a document
 * - DEK sharing: encrypt DEK with recipient's public key
 */
export declare class PassphraseManager {
    /**
     * Check if the user has set up encryption keys on the server.
     */
    static hasEncryptionKeys(): Promise<boolean>;
    /**
     * Check if the master key and private key are in sessionStorage.
     */
    static hasKeysInSession(): boolean;
    /**
     * Get keys from sessionStorage.
     * Returns {masterKey, privateKey} or {masterKey: null, privateKey: null}
     */
    static getKeysFromSession(): Promise<{
        masterKey: CryptoKey | null;
        privateKey: CryptoKey | null;
    }>;
    /**
     * Clear keys from sessionStorage (e.g., on sign-out).
     */
    static clearKeysFromSession(): void;
    /**
     * Set up encryption keys for the first time.
     *
     * @param passphrase - The user's chosen passphrase
     * @returns {recoveryKey: string} - The recovery key to display
     */
    static setupEncryption(passphrase: string): Promise<{
        recoveryKey: string;
    }>;
    /**
     * Unlock encryption keys using the passphrase.
     *
     * @param passphrase - The user's passphrase
     * @returns true if successful
     */
    static unlockWithPassphrase(passphrase: string): Promise<boolean>;
    /**
     * Change the passphrase without rotating keys.
     *
     * @param oldPassphrase - Current passphrase
     * @param newPassphrase - New passphrase
     * @returns true if successful
     */
    static changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<boolean>;
    /**
     * Recover encryption keys using the recovery key.
     *
     * @param recoveryKey - The recovery key (hex string)
     * @param newPassphrase - The new passphrase to set
     * @returns {newRecoveryKey: string}
     */
    static recoverWithRecoveryKey(recoveryKey: string, newPassphrase: string): Promise<{
        newRecoveryKey: string;
    }>;
    /**
     * Get the document password for a document.
     *
     * If encrypted with the user's master key, decrypts it directly.
     * If encrypted with the user's public key, decrypts with private key and
     * upgrades to master-key encryption.
     *
     * @param documentId - The document ID
     * @returns The document password, or null if not available
     */
    static getDocumentPassword(documentId: number): Promise<string | null>;
    /**
     * Create or store a document password for a document.
     *
     * Used when:
     * - Creating a new encrypted document (owner's password encrypted with MK)
     * - Sharing with another passphrase user (password encrypted with their public key)
     *
     * @param documentId - The document ID
     * @param password - The document password
     * @param holderId - The user ID to store the password for (default: current user)
     * @param _holderType - "user" or "userinvite"
     * @param encryptedWithMasterKey - Whether to encrypt with MK or public key
     * @returns Server response
     */
    static saveDocumentPassword(documentId: number, password: string, holderId?: number | null, _holderType?: string, encryptedWithMasterKey?: boolean): Promise<unknown>;
    /**
     * Generate a new random document password that is itself a valid raw DEK.
     * Returns a 44-character base64-encoded 32-byte AES key.
     */
    static generateDocumentPassword(): Promise<string>;
    /**
     * Resolve a document password to an AES-GCM key.
     * If the password is a raw DEK (43/44 char base64), use it directly.
     * Otherwise, derive the key via PBKDF2.
     */
    static resolvePasswordToKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey>;
    /**
     * Check if a user has set up encryption keys (for sharing).
     *
     * @param userId - The user ID to check
     */
    static userHasEncryptionKeys(userId: number): Promise<boolean>;
    /**
     * Check if user has dismissed the passphrase setup offer.
     */
    static hasUserDismissedPassphraseOffer(): Promise<boolean>;
    /**
     * Mark that user has dismissed the passphrase setup offer.
     */
    static markPassphraseDismissed(): Promise<void>;
}
//# sourceMappingURL=passphrase-manager.d.ts.map