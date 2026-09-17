/**
 * E2EE Key Manager - Handles key derivation and salt generation for
 * end-to-end encrypted documents.
 *
 * Uses PBKDF2 with SHA-256 to derive a 256-bit AES-GCM key from a
 * user-supplied password and a server-stored salt. The salt and
 * iteration count are stored on the server as part of the Document
 * model (Document.e2ee_salt and Document.e2ee_iterations),
 * so the user only needs the password to decrypt from any device.
 *
 * The key is marked as non-extractable for security — it cannot be
 * read back from the CryptoKey object once created.
 */
export declare class E2EEKeyManager {
    /**
     * Derive an AES-GCM key from a password and salt using PBKDF2.
     *
     * @param password - The user-supplied password
     * @param salt - The salt (16 bytes), fetched from the server
     *   as part of the document data (get_doc_data or subscribe)
     * @param iterations - PBKDF2 iteration count
     *   (OWASP 2023 recommendation for PBKDF2-SHA256)
     * @returns A non-extractable AES-GCM 256-bit key
     */
    static deriveKey(password: string, salt: Uint8Array, iterations?: number): Promise<CryptoKey>;
    /**
     * Store an AES-GCM key in sessionStorage for the current browser session.
     * The key is exported as raw bytes and Base64-encoded before storage.
     *
     * @param documentId - The document ID
     * @param key - The AES-GCM key to store
     */
    static storeKeyInSession(documentId: number, key: CryptoKey): Promise<void>;
    /**
     * Retrieve an AES-GCM key from sessionStorage.
     *
     * @param documentId - The document ID
     * @returns The imported key, or null if not found
     */
    static getKeyFromSession(documentId: number): Promise<CryptoKey> | null;
    /**
     * Remove a cached key from sessionStorage.
     *
     * @param documentId - The document ID
     */
    static clearKeyFromSession(documentId: number): void;
    /**
     * Clear all cached E2EE keys from sessionStorage.
     * Should be called on sign-out or session expiration.
     */
    static clearAllKeysFromSession(): void;
    /**
     * Generate a new random salt (16 bytes).
     *
     * Used when creating a new E2EE document or changing the password.
     * The generated salt is sent to the server and stored in
     * Document.e2ee_salt. The salt is not a secret — its purpose
     * is to ensure that two documents with the same password produce
     * different derived keys (preventing rainbow table attacks).
     *
     * @returns A 16-byte random salt
     */
    static generateSalt(): Uint8Array;
    /**
     * Resolve a document password to an AES-GCM key.
     *
     * If the password is a valid base64/base64url-encoded 32-byte string
     * (43 or 44 characters), it is treated as a raw DEK and imported
     * directly without PBKDF2. Otherwise, the key is derived via PBKDF2.
     *
     * @param password - The document password
     * @param salt - The salt (16 bytes)
     * @param iterations - PBKDF2 iteration count
     * @returns The AES-GCM key
     */
    static resolvePasswordToKey(password: string, salt: Uint8Array, iterations?: number): Promise<CryptoKey>;
    /**
     * Store the document password in sessionStorage.
     *
     * @param documentId - The document ID
     * @param password - The document password
     */
    static storePasswordInSession(documentId: number, password: string): void;
    /**
     * Retrieve the document password from sessionStorage.
     *
     * @param documentId - The document ID
     * @returns The password, or null if not found
     */
    static getPasswordFromSession(documentId: number): string | null;
    /**
     * Remove a cached password from sessionStorage.
     *
     * @param documentId - The document ID
     */
    static clearPasswordFromSession(documentId: number): void;
}
//# sourceMappingURL=key-manager.d.ts.map