/**
 * PassphraseCrypto - Client-side cryptography for the Personal Passphrase system.
 *
 * Handles:
 * - Master key (MK) generation and storage
 * - ECDH P-256 key pair generation and storage
 * - Recovery key generation
 * - Key-wrapping key (KWK) derivation from passphrase via PBKDF2
 * - Encryption of MK and private key (SK) with KWK
 * - Backup encryption of MK with recovery key
 * - ECIES-style encryption of DEK with recipient's public key
 * - Session storage management for MK and SK
 */
export type PassphraseKeyType = "AES-GCM" | "HMAC";
export interface EncryptedDEKData {
    ephemeralPublicKeyJwk: string;
    encryptedDEK: string;
}
export interface EncryptedStringData {
    ephemeralPublicKeyJwk: string;
    encryptedData: string;
}
export interface SessionKeys {
    masterKey: CryptoKey | null;
    privateKey: CryptoKey | null;
}
export declare class PassphraseCrypto {
    /**
     * Generate a new 256-bit AES-GCM master key.
     * The key is marked extractable so it can be exported for sessionStorage.
     */
    static generateMasterKey(): Promise<CryptoKey>;
    /**
     * Generate a random document password that is itself a valid raw DEK.
     * Returns a 44-character base64-encoded 32-byte AES key.
     * This password can be used directly as the encryption key without PBKDF2.
     */
    static generateDocumentPassword(): Promise<string>;
    /**
     * Generate a new ECDH P-256 key pair.
     * Both keys are marked extractable so the private key can be stored encrypted.
     */
    static generateKeyPair(): Promise<CryptoKeyPair>;
    /**
     * Generate a 128-bit recovery key as a hex string.
     * This is shown to the user once during setup.
     */
    static generateRecoveryKey(): string;
    /**
     * Generate a random 16-byte salt for PBKDF2.
     */
    static generateSalt(): Uint8Array;
    /**
     * Derive a key-wrapping key (KWK) from a passphrase and salt using PBKDF2.
     *
     * @param passphrase - The user's personal passphrase
     * @param salt - 16-byte random salt
     * @param iterations - PBKDF2 iteration count (default 600000)
     * @returns An extractable AES-GCM-256 key
     */
    static deriveKWK(passphrase: string, salt: Uint8Array, iterations?: number): Promise<CryptoKey>;
    /**
     * Wrap (encrypt) a CryptoKey with a wrapping key using AES-KW.
     * Returns a Base64-encoded wrapped key.
     */
    static wrapKey(keyToWrap: CryptoKey, wrappingKey: CryptoKey): Promise<string>;
    /**
     * Unwrap (decrypt) a wrapped key with a wrapping key.
     * Returns the original CryptoKey.
     */
    static unwrapKey(wrappedKeyBase64: string, wrappingKey: CryptoKey, keyType?: PassphraseKeyType): Promise<CryptoKey>;
    /**
     * Wrap a private key (JWK format) with a wrapping key.
     * Returns a Base64-encoded wrapped JWK.
     */
    static wrapPrivateKey(privateKey: CryptoKey, wrappingKey: CryptoKey): Promise<string>;
    /**
     * Unwrap a private key (JWK format) with a wrapping key.
     */
    static unwrapPrivateKey(wrappedKeyBase64: string, wrappingKey: CryptoKey): Promise<CryptoKey>;
    /**
     * Encrypt a raw key with AES-GCM.
     * Returns Base64 string: iv (12 bytes) + ciphertext.
     */
    static encryptKey(key: CryptoKey, encryptionKey: CryptoKey): Promise<string>;
    /**
     * Decrypt a raw key with AES-GCM.
     */
    static decryptKey(encryptedKeyBase64: string, encryptionKey: CryptoKey, keyType?: PassphraseKeyType): Promise<CryptoKey>;
    /**
     * Encrypt a private key (exported as JWK JSON string) with AES-GCM.
     */
    static encryptPrivateKey(privateKey: CryptoKey, encryptionKey: CryptoKey): Promise<string>;
    /**
     * Decrypt a private key (as JWK JSON string) with AES-GCM.
     */
    static decryptPrivateKey(encryptedPrivateKeyBase64: string, encryptionKey: CryptoKey): Promise<CryptoKey>;
    /**
     * Export a public key to JWK JSON string for sharing.
     */
    static exportPublicKey(publicKey: CryptoKey): Promise<string>;
    /**
     * Import a public key from JWK JSON string.
     */
    static importPublicKey(jwkString: string): Promise<CryptoKey>;
    /**
     * Encrypt a DEK with a recipient's public key using ECIES-style encryption.
     *
     * 1. Generate an ephemeral ECDH key pair.
     * 2. Derive a shared AES-GCM key from ephemeral private + recipient public.
     * 3. Encrypt the DEK with the shared key.
     * 4. Return ephemeral public key + encrypted DEK.
     *
     * @param dek - The document encryption key (AES-GCM key)
     * @param recipientPublicKey - The recipient's ECDH public key
     * @returns {ephemeralPublicKeyJwk: string, encryptedDEK: string}
     */
    static encryptDEKWithPublicKey(dek: CryptoKey, recipientPublicKey: CryptoKey): Promise<EncryptedDEKData>;
    /**
     * Decrypt a DEK that was encrypted with the user's public key.
     *
     * @param encryptedDEKBase64 - iv + ciphertext
     * @param ephemeralPublicKeyJwk - JSON string of ephemeral public key JWK
     * @param privateKey - The user's ECDH private key
     * @returns The decrypted DEK (AES-GCM key)
     */
    static decryptDEKWithPrivateKey(encryptedDEKBase64: string, ephemeralPublicKeyJwk: string, privateKey: CryptoKey): Promise<CryptoKey>;
    /**
     * Encrypt a string with AES-GCM using a direct key (e.g. master key).
     */
    static encryptString(str: string, encryptionKey: CryptoKey): Promise<string>;
    /**
     * Decrypt a string with AES-GCM using a direct key.
     */
    static decryptString(encryptedBase64: string, encryptionKey: CryptoKey): Promise<string>;
    /**
     * Encrypt a string with a recipient's public key using ECIES-style encryption.
     * Same as encryptDEKWithPublicKey but for string data instead of a CryptoKey.
     */
    static encryptStringWithPublicKey(str: string, recipientPublicKey: CryptoKey): Promise<EncryptedStringData>;
    /**
     * Decrypt a string that was encrypted with the user's public key.
     * Returns the plaintext string.
     */
    static decryptStringWithPrivateKey(encryptedDataBase64: string, ephemeralPublicKeyJwk: string, privateKey: CryptoKey): Promise<string>;
    /**
     * Store the master key and private key in sessionStorage.
     * Both keys are exported and Base64-encoded.
     */
    static storeKeysInSession(masterKey: CryptoKey, privateKey: CryptoKey): Promise<void>;
    /**
     * Retrieve the master key and private key from sessionStorage.
     * Returns {masterKey: CryptoKey|null, privateKey: CryptoKey|null}
     */
    static getKeysFromSession(): Promise<SessionKeys>;
    /**
     * Check if keys are present in sessionStorage.
     */
    static hasKeysInSession(): boolean;
    /**
     * Clear master key and private key from sessionStorage.
     */
    static clearKeysFromSession(): void;
    static _bytesToBase64(bytes: Uint8Array): string;
    static _base64ToBytes(base64: string): Uint8Array;
    static _bytesToHex(bytes: Uint8Array): string;
    static _hexToBytes(hex: string): Uint8Array;
}
//# sourceMappingURL=passphrase-crypto.d.ts.map