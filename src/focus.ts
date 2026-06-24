const FOCUSABLE_SELECTOR =
    "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]"

// Get the index number of currently focused element. This is to set the focus close by after doing some dom changes.

export const getFocusIndex = (): number => {
    return Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)).findIndex(
        el => el === document.activeElement
    )
}

export const setFocusIndex = (index: number): void => {
    const focusableElements = Array.from(
        document.querySelectorAll(FOCUSABLE_SELECTOR)
    )
    if (index >= 0 && index < focusableElements.length) {
        (focusableElements[index] as HTMLElement).focus()
    }
}
