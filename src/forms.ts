/**
 * Floating-label fields (see the "Floating labels" section of
 * `css/forms.css`).
 *
 * Wrapping a labelled field in `.fw-floating-field` keeps the label inside the
 * field while it is empty and moves it above the field once the field is
 * focused or has content. Focus is handled in CSS; this helper keeps the
 * "has content" state (`.fw-filled`) in sync.
 */

const updateFilled = (field: Element): void => {
    const control = field.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement
    >(
        "input:not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable='true']"
    )
    if (!control) {
        return
    }
    const value = "value" in control ? control.value : control.textContent || ""
    const disabled =
        "disabled" in control
            ? control.disabled
            : control.getAttribute("aria-disabled") === "true"
    field.classList.toggle("fw-filled", value.length > 0)
    field.classList.toggle("fw-disabled", disabled)
}

/**
 * Keep every `.fw-floating-field` inside `root` (default: the whole document)
 * in sync with its control.
 *
 * Idempotent: calling it again only (re)attaches the state for fields that
 * appeared since the previous call. Listens to `input`, `change` and `reset`;
 * if the app updates values programmatically it can call this function again
 * or dispatch an `input` event on the control.
 */
export const initFloatingLabels = (
    root: ParentNode | null = document
): void => {
    if (!root) {
        return
    }
    const fields = Array.from(root.querySelectorAll(".fw-floating-field"))
    fields.forEach(updateFilled)

    if (root instanceof HTMLElement || root instanceof Document) {
        const element =
            root instanceof Document ? root.body : (root as HTMLElement)
        if (!element || element.dataset.fwFloatingBound === "true") {
            return
        }
        element.dataset.fwFloatingBound = "true"
        const handle = (event: Event): void => {
            const target = event.target as Element | null
            const field = target?.closest?.(".fw-floating-field")
            if (field) {
                updateFilled(field)
            } else if (event.type === "reset") {
                // Reset events fire on the form before values are restored.
                window.setTimeout(() => {
                    element
                        .querySelectorAll(".fw-floating-field")
                        .forEach(updateFilled)
                })
            }
        }
        element.addEventListener("input", handle, true)
        element.addEventListener("change", handle, true)
        element.addEventListener("reset", handle, true)
    }
}
