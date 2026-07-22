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

import { getJson, post, postJson } from "../network.js"
import { apiUrl } from "../settings.js"
import { E2EEKeyManager } from "./key-manager.js"
import { PassphraseCrypto } from "./passphrase-crypto.js"

interface EncryptionKeyData {
    has_key: boolean
    user_salt?: string
    user_iterations?: number
    encrypted_master_key?: string
    encrypted_private_key?: string
    public_key?: string
    encrypted_master_key_backup?: string
}

interface DocumentKeyData {
    has_key: boolean
    encrypted_with_master_key?: boolean
    encrypted_key?: string
    id?: number
}

interface PublicKeyData {
    has_key: boolean
    public_key?: string
}

interface PreferencesData {
    preferences?: {
        has_dismissed_passphrase_offer?: boolean
    }
}

export class PassphraseManager {
    /**
     * Check if the user has set up encryption keys on the server.
     */
    static async hasEncryptionKeys(): Promise<boolean> {
        try {
            const data = (await getJson(
                apiUrl("e2ee.user_encryption_key")
            )) as EncryptionKeyData
            return data.has_key === true
        } catch {
            return false
        }
    }

    /**
     * Check if the master key and private key are in sessionStorage.
     */
    static hasKeysInSession(): boolean {
        return PassphraseCrypto.hasKeysInSession()
    }

    /**
     * Get keys from sessionStorage.
     * Returns {masterKey, privateKey} or {masterKey: null, privateKey: null}
     */
    static getKeysFromSession(): Promise<{
        masterKey: CryptoKey | null
        privateKey: CryptoKey | null
    }> {
        return PassphraseCrypto.getKeysFromSession()
    }

    /**
     * Clear keys from sessionStorage (e.g., on sign-out).
     */
    static clearKeysFromSession(): void {
        PassphraseCrypto.clearKeysFromSession()
    }

    /**
     * Set up encryption keys for the first time.
     *
     * @param passphrase - The user's chosen passphrase
     * @returns {recoveryKey: string} - The recovery key to display
     */
    static async setupEncryption(
        passphrase: string
    ): Promise<{ recoveryKey: string }> {
        // 1. Generate keys
        const masterKey = await PassphraseCrypto.generateMasterKey()
        const keyPair = await PassphraseCrypto.generateKeyPair()
        const recoveryKey = PassphraseCrypto.generateRecoveryKey()
        const salt = PassphraseCrypto.generateSalt()

        // 2. Derive KWK from passphrase
        const kwk = await PassphraseCrypto.deriveKWK(passphrase, salt)

        // 3. Encrypt master key and private key with KWK
        const encryptedMasterKey = await PassphraseCrypto.encryptKey(
            masterKey,
            kwk
        )
        const encryptedPrivateKey = await PassphraseCrypto.encryptPrivateKey(
            keyPair.privateKey,
            kwk
        )

        // 4. Encrypt backup of master key with recovery key
        const recoveryKeyRaw = PassphraseCrypto._hexToBytes(recoveryKey)
        const recoveryKeyCryptoKey = await crypto.subtle.importKey(
            "raw",
            recoveryKeyRaw as Uint8Array<ArrayBuffer>,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        )
        const encryptedMasterKeyBackup = await PassphraseCrypto.encryptKey(
            masterKey,
            recoveryKeyCryptoKey
        )

        // 5. Export public key as JWK
        const publicKeyJwk = await PassphraseCrypto.exportPublicKey(
            keyPair.publicKey
        )

        // 6. Send to server
        const saveData = {
            data: JSON.stringify({
                public_key: publicKeyJwk,
                encrypted_master_key: encryptedMasterKey,
                encrypted_private_key: encryptedPrivateKey,
                user_salt: PassphraseCrypto._bytesToBase64(salt),
                user_iterations: 600000,
                encrypted_master_key_backup: encryptedMasterKeyBackup
            })
        }
        const { status } = await postJson(
            apiUrl("e2ee.user_encryption_key_save"),
            saveData
        )
        if (status >= 400) {
            throw new Error("Failed to save encryption keys")
        }

        // 7. Store in sessionStorage
        await PassphraseCrypto.storeKeysInSession(masterKey, keyPair.privateKey)

        return { recoveryKey }
    }

    /**
     * Unlock encryption keys using the passphrase.
     *
     * @param passphrase - The user's passphrase
     * @returns true if successful
     */
    static async unlockWithPassphrase(passphrase: string): Promise<boolean> {
        // 1. Fetch encrypted keys from server
        const data = (await getJson(
            apiUrl("e2ee.user_encryption_key")
        )) as EncryptionKeyData
        if (!data.has_key) {
            throw new Error("No encryption keys found")
        }

        // 2. Derive KWK
        const salt = PassphraseCrypto._base64ToBytes(data.user_salt!)
        const kwk = await PassphraseCrypto.deriveKWK(
            passphrase,
            salt,
            data.user_iterations!
        )

        // 3. Decrypt master key and private key
        const masterKey = await PassphraseCrypto.decryptKey(
            data.encrypted_master_key!,
            kwk
        )
        const privateKey = await PassphraseCrypto.decryptPrivateKey(
            data.encrypted_private_key!,
            kwk
        )

        // 4. Store in sessionStorage
        await PassphraseCrypto.storeKeysInSession(masterKey, privateKey)

        return true
    }

    /**
     * Change the passphrase without rotating keys.
     *
     * @param oldPassphrase - Current passphrase
     * @param newPassphrase - New passphrase
     * @returns true if successful
     */
    static async changePassphrase(
        oldPassphrase: string,
        newPassphrase: string
    ): Promise<boolean> {
        // 1. Fetch encrypted keys from server
        const data = (await getJson(
            apiUrl("e2ee.user_encryption_key")
        )) as EncryptionKeyData
        if (!data.has_key) {
            throw new Error("No encryption keys found")
        }

        // 2. Derive old KWK and decrypt keys
        const oldSalt = PassphraseCrypto._base64ToBytes(data.user_salt!)
        const oldKwk = await PassphraseCrypto.deriveKWK(
            oldPassphrase,
            oldSalt,
            data.user_iterations!
        )
        const masterKey = await PassphraseCrypto.decryptKey(
            data.encrypted_master_key!,
            oldKwk
        )
        const privateKey = await PassphraseCrypto.decryptPrivateKey(
            data.encrypted_private_key!,
            oldKwk
        )

        // 3. Generate new salt and derive new KWK
        const newSalt = PassphraseCrypto.generateSalt()
        const newKwk = await PassphraseCrypto.deriveKWK(newPassphrase, newSalt)

        // 4. Re-encrypt master key and private key with new KWK
        const encryptedMasterKey = await PassphraseCrypto.encryptKey(
            masterKey,
            newKwk
        )
        const encryptedPrivateKey = await PassphraseCrypto.encryptPrivateKey(
            privateKey,
            newKwk
        )

        // 5. Re-encrypt master key backup with existing recovery key
        // (We keep the same recovery key so the user doesn't need to update
        // their stored backup. The backup is encrypted with the recovery key,
        // not the passphrase, so it remains valid.)
        const encryptedMasterKeyBackup = data.encrypted_master_key_backup!

        // 6. Send updated keys to server
        const saveData = {
            data: JSON.stringify({
                public_key: data.public_key,
                encrypted_master_key: encryptedMasterKey,
                encrypted_private_key: encryptedPrivateKey,
                user_salt: PassphraseCrypto._bytesToBase64(newSalt),
                user_iterations: 600000,
                encrypted_master_key_backup: encryptedMasterKeyBackup
            })
        }
        const { status } = await postJson(
            apiUrl("e2ee.user_encryption_key_save"),
            saveData
        )
        if (status >= 400) {
            throw new Error("Failed to save updated encryption keys")
        }

        // 7. Update sessionStorage
        await PassphraseCrypto.storeKeysInSession(masterKey, privateKey)

        return true
    }

    /**
     * Recover encryption keys using the recovery key.
     *
     * @param recoveryKey - The recovery key (hex string)
     * @param newPassphrase - The new passphrase to set
     * @returns {newRecoveryKey: string}
     */
    static async recoverWithRecoveryKey(
        recoveryKey: string,
        newPassphrase: string
    ): Promise<{ newRecoveryKey: string }> {
        // 1. Fetch encrypted keys from server
        const data = (await getJson(
            apiUrl("e2ee.user_encryption_key")
        )) as EncryptionKeyData
        if (!data.has_key) {
            throw new Error("No encryption keys found")
        }

        // 2. Decrypt master key backup with recovery key
        const recoveryKeyRaw = PassphraseCrypto._hexToBytes(recoveryKey)
        const recoveryKeyCryptoKey = await crypto.subtle.importKey(
            "raw",
            recoveryKeyRaw as Uint8Array<ArrayBuffer>,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        )
        const masterKey = await PassphraseCrypto.decryptKey(
            data.encrypted_master_key_backup!,
            recoveryKeyCryptoKey
        )

        // 3. Generate new key pair
        const newKeyPair = await PassphraseCrypto.generateKeyPair()
        const newRecoveryKey = PassphraseCrypto.generateRecoveryKey()
        const newSalt = PassphraseCrypto.generateSalt()

        // 4. Derive new KWK from new passphrase
        const newKwk = await PassphraseCrypto.deriveKWK(newPassphrase, newSalt)

        // 5. Re-encrypt master key and new private key
        const encryptedMasterKey = await PassphraseCrypto.encryptKey(
            masterKey,
            newKwk
        )
        const encryptedPrivateKey = await PassphraseCrypto.encryptPrivateKey(
            newKeyPair.privateKey,
            newKwk
        )

        // 6. Create new backup
        const newRecoveryKeyRaw = PassphraseCrypto._hexToBytes(newRecoveryKey)
        const newRecoveryKeyCryptoKey = await crypto.subtle.importKey(
            "raw",
            newRecoveryKeyRaw as Uint8Array<ArrayBuffer>,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        )
        const encryptedMasterKeyBackup = await PassphraseCrypto.encryptKey(
            masterKey,
            newRecoveryKeyCryptoKey
        )

        // 7. Export new public key
        const publicKeyJwk = await PassphraseCrypto.exportPublicKey(
            newKeyPair.publicKey
        )

        // 8. Send updated keys to server
        const saveData = {
            data: JSON.stringify({
                public_key: publicKeyJwk,
                encrypted_master_key: encryptedMasterKey,
                encrypted_private_key: encryptedPrivateKey,
                user_salt: PassphraseCrypto._bytesToBase64(newSalt),
                user_iterations: 600000,
                encrypted_master_key_backup: encryptedMasterKeyBackup
            })
        }
        const { status } = await postJson(
            apiUrl("e2ee.user_encryption_key_save"),
            saveData
        )
        if (status >= 400) {
            throw new Error("Failed to save updated encryption keys")
        }

        // 9. Store in sessionStorage
        await PassphraseCrypto.storeKeysInSession(
            masterKey,
            newKeyPair.privateKey
        )

        return { newRecoveryKey }
    }

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
    static async getDocumentPassword(
        documentId: number
    ): Promise<string | null> {
        const { masterKey, privateKey } =
            await PassphraseCrypto.getKeysFromSession()
        if (!masterKey || !privateKey) {
            return null
        }

        const { json } = await postJson(
            apiUrl("e2ee.document_encryption_key_get"),
            {
                document_id: documentId
            }
        )
        const documentKeyData = json as DocumentKeyData
        if (!documentKeyData.has_key) {
            return null
        }

        let password: string
        if (documentKeyData.encrypted_with_master_key) {
            password = await PassphraseCrypto.decryptString(
                documentKeyData.encrypted_key!,
                masterKey
            )
        } else {
            const parts = documentKeyData.encrypted_key!.split(":")
            if (parts.length !== 2) {
                return null
            }
            password = await PassphraseCrypto.decryptStringWithPrivateKey(
                parts[1],
                parts[0],
                privateKey
            )
            // Upgrade to master-key encryption for next time
            const upgradedEncryptedPassword =
                await PassphraseCrypto.encryptString(password, masterKey)
            await postJson(apiUrl("e2ee.document_encryption_key_update"), {
                id: documentKeyData.id,
                encrypted_key: upgradedEncryptedPassword,
                encrypted_with_master_key: true
            })
        }

        return password
    }

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
    static async saveDocumentPassword(
        documentId: number,
        password: string,
        holderId: number | null = null,
        _holderType: string = "user",
        encryptedWithMasterKey: boolean = true
    ): Promise<unknown> {
        let encryptedKey: string
        if (encryptedWithMasterKey) {
            const { masterKey } = await PassphraseCrypto.getKeysFromSession()
            if (!masterKey) {
                throw new Error("Master key not available in session")
            }
            encryptedKey = await PassphraseCrypto.encryptString(
                password,
                masterKey
            )
        } else {
            if (holderId === null) {
                throw new Error(
                    "holderId is required for public-key encryption"
                )
            }
            const pkJson = (await getJson(
                apiUrl("e2ee.user_public_key", { userId: String(holderId) })
            )) as PublicKeyData
            if (!pkJson.has_key) {
                throw new Error("Recipient has not set up encryption")
            }
            const recipientPublicKey = await PassphraseCrypto.importPublicKey(
                pkJson.public_key!
            )
            const encryptedData =
                await PassphraseCrypto.encryptStringWithPublicKey(
                    password,
                    recipientPublicKey
                )
            encryptedKey = `${encryptedData.ephemeralPublicKeyJwk}:${encryptedData.encryptedData}`
        }

        const saveData: Record<string, unknown> = {
            document_id: documentId,
            encrypted_key: encryptedKey,
            encrypted_with_master_key: encryptedWithMasterKey
        }
        if (holderId) {
            saveData.holder_id = holderId
        }
        const { json, status } = await postJson(
            apiUrl("e2ee.document_encryption_key_save"),
            saveData
        )
        if (status >= 400) {
            throw new Error("Failed to save document password")
        }
        return json
    }

    /**
     * Generate a new random document password that is itself a valid raw DEK.
     * Returns a 44-character base64-encoded 32-byte AES key.
     */
    static generateDocumentPassword(): Promise<string> {
        return PassphraseCrypto.generateDocumentPassword()
    }

    /**
     * Resolve a document password to an AES-GCM key.
     * If the password is a raw DEK (43/44 char base64), use it directly.
     * Otherwise, derive the key via PBKDF2.
     */
    static resolvePasswordToKey(
        password: string,
        salt: Uint8Array,
        iterations: number
    ): Promise<CryptoKey> {
        return E2EEKeyManager.resolvePasswordToKey(password, salt, iterations)
    }

    /**
     * Check if a user has set up encryption keys (for sharing).
     *
     * @param userId - The user ID to check
     */
    static async userHasEncryptionKeys(userId: number): Promise<boolean> {
        try {
            const data = (await getJson(
                apiUrl("e2ee.user_public_key", { userId: String(userId) })
            )) as PublicKeyData
            return data.has_key === true
        } catch {
            return false
        }
    }

    /**
     * Check if user has dismissed the passphrase setup offer.
     */
    static async hasUserDismissedPassphraseOffer(): Promise<boolean> {
        try {
            const data = (await getJson(
                apiUrl("user.preferences")
            )) as PreferencesData
            return data.preferences?.has_dismissed_passphrase_offer === true
        } catch {
            return false
        }
    }

    /**
     * Mark that user has dismissed the passphrase setup offer.
     */
    static async markPassphraseDismissed(): Promise<void> {
        try {
            await post(apiUrl("user.preferences_update"), {
                has_dismissed_passphrase_offer: true
            })
        } catch {
            // Silently fail - preference saving is best-effort
        }
    }
}
