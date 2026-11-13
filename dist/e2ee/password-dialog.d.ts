/**
 * E2EE Password Dialog - UI for entering, creating, and changing
 * document passwords for end-to-end encrypted documents.
 *
 * Provides three dialog types:
 * 1. Enter password - when opening an encrypted document
 * 2. Create password - when creating a new encrypted document
 * 3. Change password - when changing the password of an existing encrypted document
 *
 * Password requirements:
 * - Minimum 5 characters
 * While the requirements are not satisfactory for security,
 * the user is shown a degree of weakness and is therefore encouraged to use a stronger password.
 */
export interface PasswordValidationResult {
    valid: boolean;
    message: string;
}
export interface PasswordStrengthInfo {
    cssClass: string;
    label: string;
}
export interface PasswordChangeResult {
    currentPassword: string;
    newPassword: string;
}
export interface ChangePasswordOptions {
    currentPassword?: string;
    suggestedNewPassword?: string;
    hideCurrentPassword?: boolean;
    showNewPasswordPlaintext?: boolean;
    infoText?: string;
}
/**
 * Validate a password against the minimum requirements.
 *
 * @param password - The password to validate
 * @returns Validation result
 */
export declare function validatePassword(password: string): PasswordValidationResult;
/**
 * Calculate a rough password strength score (0-4).
 *
 * Based on length, character variety, and common patterns.
 * This is a simple heuristic — not a substitute for a proper
 * password strength estimator like zxcvbn, but sufficient for
 * a basic strength meter.
 *
 * @param password - The password to evaluate
 * @returns Strength score from 0 (very weak) to 4 (very strong)
 */
export declare function passwordStrength(password: string): number;
/**
 * Get a CSS class and label for a password strength score.
 *
 * @param score - Strength score from passwordStrength()
 * @returns CSS class and label
 */
export declare function strengthInfo(score: number): PasswordStrengthInfo;
/**
 * Show a dialog for entering the password to decrypt an E2EE document.
 *
 * This dialog is shown when a user opens an encrypted document.
 * The user must enter the password to derive the decryption key.
 *
 * If the URL contains a fragment (e.g., #PASSWORD from a share link),
 * the password field is pre-filled and the dialog can be auto-submitted.
 *
 * @param onPassword - Callback called with the entered password string
 * @param urlFragment - Password from URL fragment (share link), if available
 * @param onCancel - Callback when user cancels
 * @returns Promise that resolves when the dialog closes
 */
export declare function enterPasswordDialog(onPassword: (password: string) => void, urlFragment?: string, onCancel?: (() => void) | null): Promise<void>;
/**
 * Show a dialog for creating a password for a new E2EE document.
 *
 * This dialog is shown when a user creates a new encrypted document.
 * The user must enter and confirm a password. The password must meet
 * the minimum requirements (12+ characters, at least one letter and
 * one number).
 *
 * @param onPassword - Callback called with the entered password string
 * @returns Promise that resolves when the dialog closes
 */
export declare function createPasswordDialog(onPassword: (password: string) => void): Promise<void>;
/**
 * Show a dialog for changing the password of an existing E2EE document.
 *
 * The user must enter their current password (to verify identity),
 * then enter and confirm a new password.
 *
 * @param onPasswordChange - Callback called with
 *   {currentPassword: string, newPassword: string}
 * @param options - Optional settings
 * @returns Promise that resolves when the dialog closes
 */
export declare function changePasswordDialog(onPasswordChange: (result: PasswordChangeResult) => Promise<void> | void, options?: ChangePasswordOptions): Promise<void>;
//# sourceMappingURL=password-dialog.d.ts.map