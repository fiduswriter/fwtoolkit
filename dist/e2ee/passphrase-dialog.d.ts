/**
 * Passphrase Dialog - UI for the Personal Passphrase system.
 *
 * Provides dialogs for:
 * 1. Setup passphrase - first-time key generation
 * 2. Enter passphrase - unlock keys from sessionStorage
 * 3. Display recovery key - show recovery key after setup
 * 4. Recover with key - use recovery key to reset passphrase
 */
export interface EnterPassphraseOptions {
    errorMessage?: string;
}
export interface RecoverResult {
    recoveryKey: string;
    newPassphrase: string;
}
export interface ChangePassphraseResult {
    oldPassphrase: string;
    newPassphrase: string;
}
/**
 * Show a dialog to set up the personal passphrase for the first time.
 *
 * @param onSetup - Callback called with the passphrase string
 * @returns Promise that resolves when the dialog closes
 */
export declare function setupPassphraseDialog(onSetup: (passphrase: string) => Promise<void> | void): Promise<void>;
/**
 * Show a dialog to enter the personal passphrase to unlock encryption keys.
 *
 * @param onUnlock - Callback called with the passphrase string
 * @param onRecover - Callback when user clicks "Recover with key"
 * @param options - Optional settings
 * @returns Promise that resolves when the dialog closes
 */
export declare function enterPassphraseDialog(onUnlock: (passphrase: string) => void, onRecover?: (() => void) | null, options?: EnterPassphraseOptions): Promise<void>;
/**
 * Show a dialog displaying the recovery key to the user.
 *
 * @param recoveryKey - The recovery key to display
 * @param onContinue - Callback when user clicks Continue
 * @returns Promise that resolves when the dialog closes
 */
export declare function showRecoveryKeyDialog(recoveryKey: string, onContinue: () => void): Promise<void>;
/**
 * Show a dialog to recover encryption keys using the recovery key.
 *
 * @param onRecover - Callback called with {recoveryKey: string, newPassphrase: string}
 * @returns Promise that resolves when the dialog closes
 */
export declare function recoverWithKeyDialog(onRecover: (result: RecoverResult) => void): Promise<void>;
/**
 * Show a dialog to change the encryption passphrase.
 *
 * @param onChange - Callback called with {oldPassphrase: string, newPassphrase: string}
 * @returns Promise that resolves when the dialog closes
 */
export declare function changePassphraseDialog(onChange: (result: ChangePassphraseResult) => Promise<void> | void): Promise<void>;
//# sourceMappingURL=passphrase-dialog.d.ts.map