/**
 * E2EE Encryptor - Handles encryption and decryption of document content
 * for end-to-end encrypted documents.
 *
 * Uses AES-GCM (256-bit) for all encryption operations. Each encryption
 * operation generates a random 12-byte IV (initialization vector) to
 * ensure that encrypting the same plaintext twice produces different
 * ciphertext.
 *
 * Encrypted data format (Appendix A of the E2EE plan):
 *   [IV (12 bytes)][Ciphertext (variable length)][Auth Tag (16 bytes, implicit in AES-GCM)]
 *
 * When stored as a string (e.g., in JSON fields), the entire structure
 * is Base64-encoded.
 */
export declare class E2EEEncryptor {
    /**
     * Encrypt a string with AES-GCM.
     *
     * @param plaintext - The plaintext string to encrypt
     * @param key - An AES-GCM key (from E2EEKeyManager.deriveKey)
     * @returns Base64-encoded string (iv + ciphertext + auth tag)
     */
    static encrypt(plaintext: string, key: CryptoKey): Promise<string>;
    /**
     * Decrypt a Base64-encoded AES-GCM ciphertext.
     *
     * @param ciphertextBase64 - Base64-encoded (iv + ciphertext + auth tag)
     * @param key - An AES-GCM key (from E2EEKeyManager.deriveKey)
     * @returns The decrypted plaintext string
     */
    static decrypt(ciphertextBase64: string, key: CryptoKey): Promise<string>;
    /**
     * Encrypt a JSON-serializable object.
     *
     * Serializes the object to JSON, then encrypts the JSON string.
     *
     * @param obj - A JSON-serializable object
     * @param key - An AES-GCM key
     * @returns Base64-encoded encrypted data
     */
    static encryptObject(obj: unknown, key: CryptoKey): Promise<string>;
    /**
     * Decrypt to a JSON-serializable object.
     *
     * Decrypts the Base64-encoded ciphertext, then parses the result as JSON.
     *
     * @param ciphertextBase64 - Base64-encoded encrypted data
     * @param key - An AES-GCM key
     * @returns The decrypted and parsed object
     */
    static decryptObject(ciphertextBase64: string, key: CryptoKey): Promise<unknown>;
    /**
     * Encrypt an ArrayBuffer (for images and other binary data).
     *
     * @param buffer - The binary data to encrypt
     * @param key - An AES-GCM key
     * @returns Base64-encoded encrypted data (iv + ciphertext)
     */
    static encryptBuffer(buffer: ArrayBuffer, key: CryptoKey): Promise<string>;
    /**
     * Decrypt to an ArrayBuffer.
     *
     * @param ciphertextBase64 - Base64-encoded encrypted data
     * @param key - An AES-GCM key
     * @returns The decrypted binary data
     */
    static decryptBuffer(ciphertextBase64: string, key: CryptoKey): Promise<ArrayBuffer>;
    /**
     * Encrypt an image File/Blob for upload.
     *
     * Reads the file as an ArrayBuffer, encrypts it, and returns
     * a Blob with application/octet-stream type (since the encrypted
     * data is opaque binary).
     *
     * @param file - The image file to encrypt
     * @param key - An AES-GCM key
     * @returns An encrypted Blob with type application/octet-stream
     */
    static encryptImage(file: Blob, key: CryptoKey): Promise<Blob>;
    /**
     * Decrypt an encrypted image back to an ArrayBuffer.
     *
     * @param ciphertextBase64 - Base64-encoded encrypted image data
     * @param key - An AES-GCM key
     * @returns The decrypted image data
     */
    static decryptImage(ciphertextBase64: string, key: CryptoKey): Promise<ArrayBuffer>;
    /**
     * Decrypt a Base64-encoded ciphertext and return as a Base64 string.
     *
     * Useful for decrypting encrypted images that need to be stored
     * as Base64 data URLs or re-exported.
     *
     * @param ciphertextBase64 - Base64-encoded encrypted data
     * @param key - An AES-GCM key
     * @returns Base64-encoded decrypted data
     */
    static decryptBufferToBase64(ciphertextBase64: string, key: CryptoKey): Promise<string>;
    /**
     * Decrypt an encrypted image and return a blob URL for display.
     *
     * Fetches the encrypted image file from the given URL, decrypts it,
     * and creates a temporary object URL that can be used as an img src.
     *
     * @param imageUrl - The URL of the encrypted image file
     * @param key - An AES-GCM key
     * @param mimeType - The MIME type of the decrypted image
     * @returns A blob URL for the decrypted image
     */
    static decryptImageToUrl(imageUrl: string, key: CryptoKey, mimeType?: string): Promise<string>;
    /**
     * Convert a Uint8Array to a Base64-encoded string.
     * @private
     */
    private static _uint8ArrayToBase64;
    /**
     * Convert a Base64-encoded string to a Uint8Array.
     * @private
     */
    private static _base64ToUint8Array;
}
//# sourceMappingURL=encryptor.d.ts.map