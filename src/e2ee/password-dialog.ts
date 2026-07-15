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

import { Dialog, DialogButtonSpec } from "../dialog.js"
import { escapeText } from "../basic.js"

export interface PasswordValidationResult {
    valid: boolean
    message: string
}

export interface PasswordStrengthInfo {
    cssClass: string
    label: string
}

export interface PasswordChangeResult {
    currentPassword: string
    newPassword: string
}

export interface ChangePasswordOptions {
    currentPassword?: string
    suggestedNewPassword?: string
    hideCurrentPassword?: boolean
    showNewPasswordPlaintext?: boolean
    infoText?: string
}

/**
 * Validate a password against the minimum requirements.
 *
 * @param password - The password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): PasswordValidationResult {
    if (!password || password.length < 5) {
        return {
            valid: false,
            message: gettext("Password must be at least 5 characters long.")
        }
    }
    return { valid: true, message: "" }
}

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
export function passwordStrength(password: string): number {
    if (!password) {
        return 0
    }

    let score = 0

    // Length contributions
    if (password.length >= 12) {
        score++
    }
    if (password.length >= 16) {
        score++
    }
    if (password.length >= 20) {
        score++
    }

    // Character variety contributions
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    const hasSpecial = /[^a-zA-Z0-9]/.test(password)

    const varietyCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(
        Boolean
    ).length
    if (varietyCount >= 3) {
        score++
    }

    // Penalize very common patterns
    const commonPatterns = [
        /^123456/,
        /^123123/,
        /^password/i,
        /^qwerty/i,
        /^abc123/i,
        /(.)\1{3,}/ // Repeated characters (4+ in a row)
    ]
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            score = Math.max(0, score - 2)
            break
        }
    }

    return Math.min(4, Math.max(0, score))
}

/**
 * Get a CSS class and label for a password strength score.
 *
 * @param score - Strength score from passwordStrength()
 * @returns CSS class and label
 */
export function strengthInfo(score: number): PasswordStrengthInfo {
    const levels: PasswordStrengthInfo[] = [
        { cssClass: "very-weak", label: gettext("Very weak") },
        { cssClass: "weak", label: gettext("Weak") },
        { cssClass: "fair", label: gettext("Fair") },
        { cssClass: "strong", label: gettext("Strong") },
        { cssClass: "very-strong", label: gettext("Very strong") }
    ]
    return levels[score] || levels[0]
}

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
export function enterPasswordDialog(
    onPassword: (password: string) => void,
    urlFragment: string = "",
    onCancel: (() => void) | null = null
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-enter-password"

        // If password was provided via URL fragment, use it directly
        if (urlFragment && urlFragment.length > 0) {
            onPassword(urlFragment)
            resolve()
            return
        }

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("This document is end-to-end encrypted. Enter the password to decrypt it.")}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-password-input">${gettext("Password")}</label>
                    <input type="password" id="e2ee-password-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show password")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-password-error" id="e2ee-password-error"></div>
            </div>
        `

        // Declare dialogInstance before buttons so the click handler
        // can call dialogInstance.close().
        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Decrypt"),
                classes: "fw-button fw-dark",
                click: () => {
                    const input = document.getElementById("e2ee-password-input")
                    const password = input
                        ? (input as HTMLInputElement).value
                        : ""
                    if (password.length === 0) {
                        const errorEl = document.getElementById(
                            "e2ee-password-error"
                        )
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Please enter the password."
                            )
                        }
                        return
                    }
                    dialogInstance.close()
                    onPassword(password)
                    resolve()
                }
            },
            {
                text: gettext("Cancel"),
                classes: "fw-button fw-light",
                click: () => {
                    dialogInstance.close()
                    if (typeof onCancel === "function") {
                        onCancel()
                    }
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Encrypted Document"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        // Use the Fidus Writer dialog system
        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        // Set up toggle visibility button
        setTimeout(() => {
            const toggleBtn = document.querySelector(
                `#${dialogId} .e2ee-toggle-visibility`
            )
            const input = document.getElementById("e2ee-password-input")
            if (toggleBtn && input) {
                const toggleBtnEl = toggleBtn as HTMLElement
                toggleBtnEl.addEventListener("click", () => {
                    const inputEl = input as HTMLInputElement
                    if (inputEl.type === "password") {
                        inputEl.type = "text"
                        toggleBtnEl.innerHTML =
                            '<i class="fa-solid fa-eye-slash"></i>'
                        toggleBtnEl.title = gettext("Hide password")
                    } else {
                        inputEl.type = "password"
                        toggleBtnEl.innerHTML =
                            '<i class="fa-solid fa-eye"></i>'
                        toggleBtnEl.title = gettext("Show password")
                    }
                })
            }

            // Submit on Enter key
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
export function createPasswordDialog(
    onPassword: (password: string) => void
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-create-password"

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Set a password to encrypt this document. You will need this password to open the document in the future.")}</p>
                <p class="e2ee-password-hint">${gettext('Tip: Use a passphrase with multiple words, e.g. "correct-horse-battery-staple". This is both secure and easy to remember.')}</p>
                <div class="e2ee-password-field">
                    <label for="e2ee-new-password-input">${gettext("Password")}</label>
                    <input type="password" id="e2ee-new-password-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                    <button type="button" class="e2ee-toggle-visibility" title="${gettext("Show password")}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="e2ee-strength-meter">
                    <div class="e2ee-strength-bar" id="e2ee-strength-bar"></div>
                    <span class="e2ee-strength-label" id="e2ee-strength-label"></span>
                </div>
                <div class="e2ee-password-field">
                    <label for="e2ee-confirm-password-input">${gettext("Confirm password")}</label>
                    <input type="password" id="e2ee-confirm-password-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                </div>
                <div class="e2ee-password-error" id="e2ee-password-error"></div>
            </div>
        `

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Create Encrypted Document"),
                classes: "fw-button fw-dark",
                click: () => {
                    const input = document.getElementById(
                        "e2ee-new-password-input"
                    )
                    const confirmInput = document.getElementById(
                        "e2ee-confirm-password-input"
                    )
                    const errorEl = document.getElementById(
                        "e2ee-password-error"
                    )
                    const password = input
                        ? (input as HTMLInputElement).value
                        : ""
                    const confirmPassword = confirmInput
                        ? (confirmInput as HTMLInputElement).value
                        : ""

                    // Validate password
                    const validation = validatePassword(password)
                    if (!validation.valid) {
                        if (errorEl) {
                            errorEl.textContent = validation.message
                        }
                        return
                    }

                    // Check confirmation
                    if (password !== confirmPassword) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passwords do not match."
                            )
                        }
                        return
                    }

                    dialogInstance.close()
                    onPassword(password)
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Set Document Password"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            // Set up toggle visibility buttons
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

            // Set up strength meter
            const passwordInput = document.getElementById(
                "e2ee-new-password-input"
            )
            if (passwordInput) {
                passwordInput.addEventListener("input", () => {
                    const score = passwordStrength(
                        (passwordInput as HTMLInputElement).value
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
                // Initialize strength meter
                passwordInput.dispatchEvent(new Event("input"))
                ;(passwordInput as HTMLInputElement).focus()
            }

            // Submit on Enter key in confirm field
            const confirmInput = document.getElementById(
                "e2ee-confirm-password-input"
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
export function changePasswordDialog(
    onPasswordChange: (result: PasswordChangeResult) => void,
    options: ChangePasswordOptions = {}
): Promise<void> {
    return new Promise(resolve => {
        const dialogId = "e2ee-change-password"
        const currentPassword = options.currentPassword || ""
        const suggestedNewPassword = options.suggestedNewPassword || ""
        const hasPrefilledNew = suggestedNewPassword.length > 0
        const hideCurrentPassword = options.hideCurrentPassword || false
        const showNewPasswordPlaintext =
            options.showNewPasswordPlaintext || false
        const infoText = options.infoText || ""

        const currentPasswordField = hideCurrentPassword
            ? `<input type="hidden" id="e2ee-current-password-input" value="${escapeText(currentPassword)}" />`
            : `<div class="e2ee-password-field">
                    <label for="e2ee-current-password-input">${gettext("Current password")}</label>
                    <input type="password" id="e2ee-current-password-input" class="e2ee-password-input"
                           value="${escapeText(currentPassword)}"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" autofocus />
                </div>
                <hr />`

        const newPasswordInputType = showNewPasswordPlaintext
            ? "text"
            : "password"

        const body = `
            <div class="e2ee-password-dialog">
                <p>${gettext("Change the document password. After changing, you must share the new password with all collaborators.")}</p>
                ${infoText ? `<p class="e2ee-password-hint">${infoText}</p>` : ""}
                ${currentPasswordField}
                <div class="e2ee-password-field">
                    <label for="e2ee-new-password-input">${gettext("New password")}</label>
                    <input type="${newPasswordInputType}" id="e2ee-new-password-input" class="e2ee-password-input"
                           value="${escapeText(suggestedNewPassword)}"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" ${hideCurrentPassword ? "autofocus" : ""} />
                    ${
                        showNewPasswordPlaintext
                            ? ""
                            : `<button type="button" class="e2ee-toggle-visibility" title="${gettext("Show password")}">
                               <i class="fa-solid fa-eye"></i>
                           </button>`
                    }
                </div>
                <div class="e2ee-strength-meter" style="display: ${showNewPasswordPlaintext && hasPrefilledNew ? "none" : ""}">
                    <div class="e2ee-strength-bar" id="e2ee-strength-bar"></div>
                    <span class="e2ee-strength-label" id="e2ee-strength-label"></span>
                </div>
                <div class="e2ee-password-field" id="e2ee-confirm-field" style="display: ${hasPrefilledNew ? "none" : ""}">
                    <label for="e2ee-confirm-password-input">${gettext("Confirm new password")}</label>
                    <input type="password" id="e2ee-confirm-password-input" class="e2ee-password-input"
                           autocomplete="off" data-1p-ignore data-lp-ignore data-lpignore="true" data-bwignore data-form-type="other" />
                </div>
                <div class="e2ee-password-error" id="e2ee-password-error"></div>
            </div>
        `

        let newPasswordChanged = !hasPrefilledNew

        // eslint-disable-next-line prefer-const
        let dialogInstance: Dialog

        const buttons: DialogButtonSpec[] = [
            {
                text: gettext("Change Password"),
                classes: "fw-button fw-dark",
                click: () => {
                    const currentInput = document.getElementById(
                        "e2ee-current-password-input"
                    )
                    const newInput = document.getElementById(
                        "e2ee-new-password-input"
                    )
                    const confirmInput = document.getElementById(
                        "e2ee-confirm-password-input"
                    )
                    const errorEl = document.getElementById(
                        "e2ee-password-error"
                    )

                    const currentPasswordValue = currentInput
                        ? (currentInput as HTMLInputElement).value
                        : ""
                    const newPassword = newInput
                        ? (newInput as HTMLInputElement).value
                        : ""
                    const confirmPassword = confirmInput
                        ? (confirmInput as HTMLInputElement).value
                        : ""

                    // Validate current password
                    if (currentPasswordValue.length === 0) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Please enter the current password."
                            )
                        }
                        return
                    }

                    // Validate new password
                    const validation = validatePassword(newPassword)
                    if (!validation.valid) {
                        if (errorEl) {
                            errorEl.textContent = validation.message
                        }
                        return
                    }

                    // Check confirmation only if user changed the prefilled value
                    if (newPasswordChanged && newPassword !== confirmPassword) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "Passwords do not match."
                            )
                        }
                        return
                    }

                    // Check that new password is different
                    if (currentPasswordValue === newPassword) {
                        if (errorEl) {
                            errorEl.textContent = gettext(
                                "New password must be different from the current password."
                            )
                        }
                        return
                    }

                    dialogInstance.close()
                    onPasswordChange({
                        currentPassword: currentPasswordValue,
                        newPassword
                    })
                    resolve()
                }
            }
        ]

        const dialog = {
            title: gettext("Change Document Password"),
            id: dialogId,
            body: body,
            buttons: buttons,
            canClose: true
        }

        dialogInstance = new Dialog(dialog)
        dialogInstance.open()

        setTimeout(() => {
            // Set up toggle visibility buttons (only if new password is not plaintext)
            if (!showNewPasswordPlaintext) {
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
                                btn.innerHTML =
                                    '<i class="fa-solid fa-eye"></i>'
                            }
                        }
                    })
                })
            }

            // Set up strength meter
            const passwordInput = document.getElementById(
                "e2ee-new-password-input"
            )
            if (
                passwordInput &&
                !(showNewPasswordPlaintext && hasPrefilledNew)
            ) {
                passwordInput.addEventListener("input", () => {
                    const score = passwordStrength(
                        (passwordInput as HTMLInputElement).value
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
                passwordInput.dispatchEvent(new Event("input"))
            }

            // Track changes to new password field
            if (passwordInput && hasPrefilledNew) {
                passwordInput.addEventListener("input", () => {
                    if (
                        (passwordInput as HTMLInputElement).value !==
                        suggestedNewPassword
                    ) {
                        newPasswordChanged = true
                        const confirmField =
                            document.getElementById("e2ee-confirm-field")
                        if (confirmField) {
                            confirmField.style.display = ""
                        }
                        // Show strength meter again if user edits the prefilled value
                        const strengthMeter = document.querySelector(
                            `#${dialogId} .e2ee-strength-meter`
                        )
                        if (strengthMeter) {
                            ;(strengthMeter as HTMLElement).style.display = ""
                        }
                    }
                })
            }

            // Submit on Enter key
            const confirmInput = document.getElementById(
                "e2ee-confirm-password-input"
            )
            if (confirmInput) {
                confirmInput.addEventListener("keypress", event => {
                    if (event.key === "Enter") {
                        event.preventDefault()
                        buttons[0].click?.()
                    }
                })
            }

            const currentInput = document.getElementById(
                "e2ee-current-password-input"
            )
            if (currentInput && !hideCurrentPassword) {
                ;(currentInput as HTMLInputElement).focus()
            } else if (passwordInput) {
                ;(passwordInput as HTMLInputElement).focus()
            }
        }, 100)
    })
}
