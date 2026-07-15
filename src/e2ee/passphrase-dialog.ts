/**
 * Passphrase Dialog - UI for the Personal Passphrase system.
 *
 * Provides dialogs for:
 * 1. Setup passphrase - first-time key generation
 * 2. Enter passphrase - unlock keys from sessionStorage
 * 3. Display recovery key - show recovery key after setup
 * 4. Recover with key - use recovery key to reset passphrase
 */

import { Dialog, DialogButtonSpec } from "../dialog.js"
import { escapeText } from "../basic.js"
import { passwordStrength, strengthInfo } from "./password-dialog.js"

export interface EnterPassphraseOptions {
    errorMessage?: string
}

export interface RecoverResult {
    recoveryKey: string
    newPassphrase: string
}

export interface ChangePassphraseResult {
    oldPassphrase: string
    newPassphrase: string
}

/**
 * Show a dialog to set up the personal passphrase for the first time.
 *
 * @param onSetup - Callback called with the passphrase string
 * @returns Promise that resolves when the dialog closes
 */
export function setupPassphraseDialog(
    onSetup: (passphrase: string) => void
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-setup-passphrase"

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Set up a personal encryption passphrase. This passphrase will unlock all your encrypted documents — you will not need separate passwords for each document.")}</p>
                <p class="e2ee-password-hint"><strong>${gettext("Important:")}</strong> ${gettext("This passphrase is separate from your login password. If you lose it, your encrypted documents cannot be recovered.")}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-passphrase-input">${gettext("Passphrase")}</label>
                    <input type="password" id="e2ee-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show passphrase")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-strength-meter">
                    <div class="e2ee-strength-bar" id="e2ee-strength-bar"></div>
                    <span class="e2ee-strength-label" id="e2ee-strength-label"></span>
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-confirm-passphrase-input">${gettext("Confirm passphrase")}</label>
                    <input type="password" id="e2ee-confirm-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                </div>
                <div class="e2ee-password-error" id="e2ee-passphrase-error"></div>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Set Up Encryption"),
                classes: "fw-button fw-dark",
                click: () => {
                    const input = document.getElementById(
                        "e2ee-passphrase-input"
                    )
                    const confirmInput = document.getElementById(
                        "e2ee-confirm-passphrase-input"
                    )
                    const errorEl = document.getElementById(
                        "e2ee-passphrase-error"
                    )
                    const passphrase = input
                        ? (input as HTMLInputElement).value
                        : ""
                    const confirmPassphrase = confirmInput
                        ? (confirmInput as HTMLInputElement).value
                        : ""

                    if (passphrase.length < 8) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrase must be at least 8 characters long."
                            )
                        }
                        return
                    }

                    if (passphrase !== confirmPassphrase) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrases do not match."
                            )
                        }
                        return
                    }

                    dialogInstance.close()
                    onSetup(passphrase)
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Set Up Personal Encryption"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true,
            width: 450
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        // The dialog content is short and should not scroll. Ensure it starts
        // at the top so the explanatory text and title are fully visible.
        requestAnimationFrame(() => {
            const contentEl = document.getElementById(dialogId)
            if (contentEl) {
                contentEl.scrollTop = 0
            }
        })

        setTimeout(() => {
            const toggleBtns = document.querySelectorAll(
                `#${dialogId} .e2ee-toggle-visibility`
            )
            toggleBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const input = btn.parentElement?.querySelector("input")
                    if (input) {
                        const inputEl = input as HTMLInputElement
                        if (inputEl.type === "password") {
                            inputEl.type = "text"
                            btn.innerHTML =
                                '<i class="fa-solid fa-eye-slash"></i>'
                        } else {
                            inputEl.type = "password"
                            btn.innerHTML = '<i class="fa-solid fa-eye"></i>'
                        }
                    }
                })
            })

            const passphraseInput = document.getElementById(
                "e2ee-passphrase-input"
            )
            if (passphraseInput) {
                passphraseInput.addEventListener("input", () => {
                    const score = passwordStrength(
                        (passphraseInput as HTMLInputElement).value
                    )
                    const info = strengthInfo(score)
                    const bar = document.getElementById("e2ee-strength-bar")
                    const label = document.getElementById("e2ee-strength-label")
                    if (bar) {
                        bar.className = `e2ee-strength-bar ${info.cssClass}`
                        bar.style.width = `${(score + 1) * 25}%`
                    }
                    if (label) {
                        label.textContent = info.label
                        label.className = `e2ee-strength-label ${info.cssClass}`
                    }
                })
                passphraseInput.dispatchEvent(new Event("input"))
                ;(passphraseInput as HTMLInputElement).focus()
            }

            const confirmInput = document.getElementById(
                "e2ee-confirm-passphrase-input"
            )
            if (confirmInput) {
                confirmInput.addEventListener("keypress", event => {
                    if (event.key === "Enter") {
                        event.preventDefault()
                        buttons[0].click?.()
                    }
                })
            }
        }, 100)
    })
}

/**
 * Show a dialog to enter the personal passphrase to unlock encryption keys.
 *
 * @param onUnlock - Callback called with the passphrase string
 * @param onRecover - Callback when user clicks "Recover with key"
 * @param options - Optional settings
 * @returns Promise that resolves when the dialog closes
 */
export function enterPassphraseDialog(
    onUnlock: (passphrase: string) => void,
    onRecover: (() => void) | null = null,
    options: EnterPassphraseOptions = {}
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-enter-passphrase"
        const errorMessage = options.errorMessage || ""

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Enter your personal encryption passphrase to unlock your documents.")}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-passphrase-input">${gettext("Passphrase")}</label>
                    <input type="password" id="e2ee-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show passphrase")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-password-error" id="e2ee-passphrase-error">${escapeText(errorMessage)}</div>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Unlock"),
                classes: "fw-button fw-dark",
                click: () => {
                    const input = document.getElementById(
                        "e2ee-passphrase-input"
                    )
                    const passphrase = input
                        ? (input as HTMLInputElement).value
                        : ""
                    if (passphrase.length === 0) {
                        const errorEl = document.getElementById(
                            "e2ee-passphrase-error"
                        )
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Please enter your passphrase."
                            )
                        }
                        return
                    }
                    dialogInstance.close()
                    onUnlock(passphrase)
                    resolve()
                }
            },
            {
                text: gettext("Cancel"),
                classes: "fw-button fw-light",
                click: () => {
                    dialogInstance.close()
                    resolve()
                }
            }
        ]

        if (onRecover) {
            buttons.push({
                text: gettext("Recover with key"),
                classes: "fw-button fw-orange",
                click: () => {
                    dialogInstance.close()
                    onRecover()
                    resolve()
                }
            })
        }

        const dialog = {
            title: gettext("Unlock Encryption"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            const toggleBtn = document.querySelector(
                `#${dialogId} .e2ee-toggle-visibility`
            )
            const input = document.getElementById("e2ee-passphrase-input")
            if (toggleBtn && input) {
                const toggleBtnEl = toggleBtn as HTMLElement
                toggleBtnEl.addEventListener("click", () => {
                    const inputEl = input as HTMLInputElement
                    if (inputEl.type === "password") {
                        inputEl.type = "text"
                        toggleBtnEl.innerHTML =
                            '<i class="fa-solid fa-eye-slash"></i>'
                        toggleBtnEl.title = gettext("Hide passphrase")
                    } else {
                        inputEl.type = "password"
                        toggleBtnEl.innerHTML =
                            '<i class="fa-solid fa-eye"></i>'
                        toggleBtnEl.title = gettext("Show passphrase")
                    }
                })
            }

            if (input) {
                input.addEventListener("keypress", event => {
                    if (event.key === "Enter") {
                        event.preventDefault()
                        buttons[0].click?.()
                    }
                })
                ;(input as HTMLInputElement).focus()
            }
        }, 100)
    })
}

/**
 * Show a dialog displaying the recovery key to the user.
 *
 * @param recoveryKey - The recovery key to display
 * @param onContinue - Callback when user clicks Continue
 * @returns Promise that resolves when the dialog closes
 */
export function showRecoveryKeyDialog(
    recoveryKey: string,
    onContinue: () => void
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-recovery-key"

        const body = `
            <div class="e2ee-password-dialog">
                <p><strong>${gettext("This is your recovery key.")}</strong></p>
                <p>${gettext("Store it somewhere safe (e.g., a password manager, printed copy). If you forget your passphrase, this is the ONLY way to recover your encrypted documents. We cannot recover it for you.")}</p>
                <div class="e2ee-recovery-key-box">
                    <code id="e2ee-recovery-key-value">${recoveryKey}</code>
                    <button type="button" class="fw-button fw-light" id="e2ee-copy-recovery-key">
                        <i class="fa-solid fa-copy"></i> ${gettext("Copy")}
                    </button>
                </div>
                <p class="e2ee-password-hint"><strong>${gettext("Copy it now — it will not be shown again.")}</strong></p>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("I have saved it"),
                classes: "fw-button fw-dark",
                click: () => {
                    dialogInstance.close()
                    onContinue()
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Recovery Key"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: false
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            const copyBtn = document.getElementById("e2ee-copy-recovery-key")
            if (copyBtn) {
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(recoveryKey).then(() => {
                        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${gettext("Copied!")}`
                        setTimeout(() => {
                            copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i> ${gettext("Copy")}`
                        }, 2000)
                    })
                })
            }
        }, 100)
    })
}

/**
 * Show a dialog to recover encryption keys using the recovery key.
 *
 * @param onRecover - Callback called with {recoveryKey: string, newPassphrase: string}
 * @returns Promise that resolves when the dialog closes
 */
export function recoverWithKeyDialog(
    onRecover: (result: RecoverResult) => void
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-recover-with-key"

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Enter your recovery key and a new passphrase to regain access to your encrypted documents.")}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-recovery-key-input">${gettext("Recovery key")}</label>
                    <input type="text" id="e2ee-recovery-key-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-new-passphrase-input">${gettext("New passphrase")}</label>
                    <input type="password" id="e2ee-new-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show passphrase")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-confirm-passphrase-input">${gettext("Confirm new passphrase")}</label>
                    <input type="password" id="e2ee-confirm-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                </div>
                <div class="e2ee-password-error" id="e2ee-recover-error"></div>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Recover"),
                classes: "fw-button fw-dark",
                click: () => {
                    const recoveryInput = document.getElementById(
                        "e2ee-recovery-key-input"
                    )
                    const newInput = document.getElementById(
                        "e2ee-new-passphrase-input"
                    )
                    const confirmInput = document.getElementById(
                        "e2ee-confirm-passphrase-input"
                    )
                    const errorEl =
                        document.getElementById("e2ee-recover-error")

                    const recoveryKey = recoveryInput
                        ? (recoveryInput as HTMLInputElement).value.trim()
                        : ""
                    const newPassphrase = newInput
                        ? (newInput as HTMLInputElement).value
                        : ""
                    const confirmPassphrase = confirmInput
                        ? (confirmInput as HTMLInputElement).value
                        : ""

                    if (recoveryKey.length === 0) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Please enter your recovery key."
                            )
                        }
                        return
                    }

                    if (newPassphrase.length < 8) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrase must be at least 8 characters long."
                            )
                        }
                        return
                    }

                    if (newPassphrase !== confirmPassphrase) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrases do not match."
                            )
                        }
                        return
                    }

                    dialogInstance.close()
                    onRecover({ recoveryKey, newPassphrase })
                    resolve()
                }
            },
            {
                text: gettext("Cancel"),
                classes: "fw-button fw-light",
                click: () => {
                    dialogInstance.close()
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Recover Encryption"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            const toggleBtns = document.querySelectorAll(
                `#${dialogId} .e2ee-toggle-visibility`
            )
            toggleBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const input = btn.parentElement?.querySelector("input")
                    if (input) {
                        const inputEl = input as HTMLInputElement
                        if (inputEl.type === "password") {
                            inputEl.type = "text"
                            btn.innerHTML =
                                '<i class="fa-solid fa-eye-slash"></i>'
                        } else {
                            inputEl.type = "password"
                            btn.innerHTML = '<i class="fa-solid fa-eye"></i>'
                        }
                    }
                })
            })

            const confirmInput = document.getElementById(
                "e2ee-confirm-passphrase-input"
            )
            if (confirmInput) {
                confirmInput.addEventListener("keypress", event => {
                    if (event.key === "Enter") {
                        event.preventDefault()
                        buttons[0].click?.()
                    }
                })
            }
        }, 100)
    })
}

/**
 * Show a dialog to change the encryption passphrase.
 *
 * @param onChange - Callback called with {oldPassphrase: string, newPassphrase: string}
 * @returns Promise that resolves when the dialog closes
 */
export function changePassphraseDialog(
    onChange: (result: ChangePassphraseResult) => void
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-change-passphrase"

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Enter your current passphrase and a new passphrase to change your encryption password.")}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-old-passphrase-input">${gettext("Current passphrase")}</label>
                    <input type="password" id="e2ee-old-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show passphrase")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-new-passphrase-input">${gettext("New passphrase")}</label>
                    <input type="password" id="e2ee-new-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show passphrase")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-confirm-new-passphrase-input">${gettext("Confirm new passphrase")}</label>
                    <input type="password" id="e2ee-confirm-new-passphrase-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                </div>
                <div class="e2ee-password-error" id="e2ee-change-error"></div>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Change Passphrase"),
                classes: "fw-button fw-dark",
                click: () => {
                    const oldInput = document.getElementById(
                        "e2ee-old-passphrase-input"
                    )
                    const newInput = document.getElementById(
                        "e2ee-new-passphrase-input"
                    )
                    const confirmInput = document.getElementById(
                        "e2ee-confirm-new-passphrase-input"
                    )
                    const errorEl = document.getElementById("e2ee-change-error")

                    const oldPassphrase = oldInput
                        ? (oldInput as HTMLInputElement).value
                        : ""
                    const newPassphrase = newInput
                        ? (newInput as HTMLInputElement).value
                        : ""
                    const confirmPassphrase = confirmInput
                        ? (confirmInput as HTMLInputElement).value
                        : ""

                    if (oldPassphrase.length === 0) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Please enter your current passphrase."
                            )
                        }
                        return
                    }

                    if (newPassphrase.length < 8) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrase must be at least 8 characters long."
                            )
                        }
                        return
                    }

                    if (newPassphrase !== confirmPassphrase) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passphrases do not match."
                            )
                        }
                        return
                    }

                    dialogInstance.close()
                    onChange({ oldPassphrase, newPassphrase })
                    resolve()
                }
            },
            {
                text: gettext("Cancel"),
                classes: "fw-button fw-light",
                click: () => {
                    dialogInstance.close()
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Change Encryption Passphrase"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            const toggleBtns = document.querySelectorAll(
                `#${dialogId} .e2ee-toggle-visibility`
            )
            toggleBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const input = btn.parentElement?.querySelector("input")
                    if (input) {
                        const inputEl = input as HTMLInputElement
                        if (inputEl.type === "password") {
                            inputEl.type = "text"
                            btn.innerHTML =
                                '<i class="fa-solid fa-eye-slash"></i>'
                        } else {
                            inputEl.type = "password"
                            btn.innerHTML = '<i class="fa-solid fa-eye"></i>'
                        }
                    }
                })
            })

            const confirmInput = document.getElementById(
                "e2ee-confirm-new-passphrase-input"
            )
            if (confirmInput) {
                confirmInput.addEventListener("keypress", event => {
                    if (event.key === "Enter") {
                        event.preventDefault()
                        buttons[0].click?.()
                    }
                })
            }
        }, 100)
    })
}
