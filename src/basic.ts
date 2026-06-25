import {keyName} from "w3c-keyname"

import {ContentMenu, ContentMenuInit} from "./content_menu.js"
import {Dialog} from "./dialog.js"
import {isActivationEvent} from "./events.js"

export interface DropdownSelectOptions {
    onChange?: (value: string | false) => void
    width?: number | string | false
    value?: string | false
    button?: HTMLElement | false
}

export interface DropdownSelectAPI {
    setValue: (newValue: string | false) => void
    getValue: () => string | false
    enable: () => void
    disable: () => void
}

/** Creates a styled select with a contentmenu from a select tag.
 * @param select The select-tag which is to be replaced.
 * @param options
 */

export const dropdownSelect = (
    selectDOM: HTMLSelectElement,
    {
        onChange = () => {},
        width = false,
        value = false,
        button = false
    }: DropdownSelectOptions = {}
): DropdownSelectAPI | undefined => {
    if (!selectDOM.parentElement) {
        return
    }
    let buttonDOM: HTMLElement
    if (button) {
        buttonDOM = button
        selectDOM.parentElement.removeChild(selectDOM) // Remove the <select> from the main dom.
    } else {
        buttonDOM = document.createElement("div")
        buttonDOM.innerHTML =
            '<label></label>&nbsp;<span class="fa fa-caret-down"></span>'
        buttonDOM.classList.add("fw-button", "fw-light", "fw-large", "fw-dropdown")
        if (width) {
            buttonDOM.style.width = Number.isInteger(width as number)
                ? `${width}px`
                : (width as string)
        }
        selectDOM.classList.forEach(className =>
            buttonDOM.classList.add(className)
        )
        if (selectDOM.id) {
            buttonDOM.id = selectDOM.id
        }
        selectDOM.parentElement.replaceChild(buttonDOM, selectDOM) // Remove the <select> from the main dom.
    }

    buttonDOM.setAttribute("role", "button")
    buttonDOM.setAttribute("tabindex", "0")
    buttonDOM.setAttribute("aria-haspopup", "true")
    buttonDOM.setAttribute("aria-expanded", "false")

    const options = Array.from(selectDOM.children)
    if (!options.length) {
        // There are no options, so we only create the button.
        return {
            setValue: () => {},
            getValue: () => false,
            enable: () => {},
            disable: () => {}
        }
    }
    let selected: HTMLOptionElement | undefined
    const menu: ContentMenuInit = {
        content: options.map((option, order) => {
            const optionEl = option as HTMLOptionElement
            if (optionEl.selected || optionEl.value === value) {
                selected = optionEl
            }
            return {
                title: optionEl.innerHTML,
                type: "action",
                tooltip: optionEl.title || "",
                order,
                action: () => {
                    if (!button) {
                        ;(buttonDOM.firstElementChild as HTMLElement).innerText =
                            optionEl.innerText
                    }
                    value = optionEl.value || optionEl.dataset.value || false
                    onChange(value)
                    menu.content.forEach(item => (item.selected = false))
                    menu.content[order].selected = true
                    return false
                },
                selected: !!(optionEl.selected || optionEl.dataset.selected)
            }
        })
    }
    if (!selected && !button) {
        selected = selectDOM.firstElementChild as HTMLOptionElement
        menu.content[0].selected = true
    }

    if (!button) {
        ;(buttonDOM.firstElementChild as HTMLElement).innerText =
            selected ? selected.innerText : ""
    }

    value = selected ? selected.value : false

    const openMenu = (event: Event) => {
        if (!isActivationEvent(event)) {
            return
        }

        event.preventDefault()
        event.stopPropagation()
        if (buttonDOM.classList.contains("fw-disabled")) {
            return
        }
        // Determine menu position
        let menuPos: {X: number; Y: number}
        if (event.type === "click") {
            const mouseEvent = event as MouseEvent
            menuPos = {X: mouseEvent.pageX, Y: mouseEvent.pageY}
        } else {
            // Keyboard event
            const rect = buttonDOM.getBoundingClientRect()
            menuPos = {
                X: rect.left + window.pageXOffset,
                Y: rect.top + window.pageYOffset + rect.height
            }
        }

        buttonDOM.setAttribute("aria-expanded", "true")
        const contentMenu = new ContentMenu({
            menu,
            menuPos,
            onClose: () => buttonDOM.setAttribute("aria-expanded", "false")
        })
        contentMenu.open()
    }

    buttonDOM.addEventListener("click", openMenu)
    buttonDOM.addEventListener("keydown", openMenu)

    return {
        setValue: newValue => {
            const optionIndex = options.findIndex(
                option => (option as HTMLOptionElement).value === newValue
            ) as number | undefined
            if (optionIndex === undefined) {
                return
            }
            menu.content.forEach(item => (item.selected = false))
            menu.content[optionIndex].selected = true
            const option = options[optionIndex] as HTMLOptionElement
            if (!button) {
                ;(buttonDOM.firstElementChild as HTMLElement).innerText =
                    option.innerText
            }
            value = newValue
        },
        getValue: () => value,
        enable: () => buttonDOM.classList.remove("fw-disabled"),
        disable: () => buttonDOM.classList.add("fw-disabled")
    }
}

/** Checks or unchecks a checkable label. This is used for example for bibliography categories when editing bibliography items.
 * @param label The node who's parent has to be checked or unchecked.
 */
export const setCheckableLabel = (labelEl: HTMLElement): void => {
    if (labelEl.classList.contains("fw-checked")) {
        labelEl.classList.remove("fw-checked")
    } else {
        labelEl.classList.add("fw-checked")
    }
}

let messageWaiter: number | false = false
let waitMessage = ""
/** Cover the page signaling to the user to wait.
 */
export const activateWait = (full = false, message = ""): void => {
    const waitEl = document.getElementById("fw-wait")
    if (!waitEl) {
        return
    }
    if (message) {
        let messageEl = waitEl.querySelector("span.fw-message")
        if (messageEl) {
            // Another message is already showing. We update directly.
            ;(messageEl as HTMLElement).innerText = message
        } else {
            waitMessage = message // We update the message if there is one waiting already
            if (!messageWaiter) {
                messageWaiter = window.setTimeout(() => {
                    messageEl = document.createElement("span")
                    messageEl.classList.add("fw-message")
                    ;(messageEl as HTMLElement).innerText = waitMessage
                    waitEl.appendChild(messageEl)
                    messageWaiter = false
                }, 2000)
            }
        }
    }
    waitEl.classList.add("fw-active")
    if (full) {
        waitEl.classList.add("fw-full")
    }
}

/** Remove the wait cover.
 */
export const deactivateWait = (): void => {
    const waitEl = document.getElementById("fw-wait")
    if (!waitEl) {
        return
    }
    waitEl.classList.remove("fw-active")
    waitEl.classList.remove("fw-full")
    const messageEl = waitEl.querySelector("span.fw-message")
    if (messageEl) {
        messageEl.parentElement?.removeChild(messageEl)
    }
    if (messageWaiter) {
        clearTimeout(messageWaiter)
        messageWaiter = false
    }
}

/** Show a message to the user.
 * @param alertType The type of message that is shown (error, warning, info or success).
 * @param alertMsg The message text.
 */
export const addAlert = (
    alertType: "error" | "warning" | "info" | "success",
    alertMsg: string
): void => {
    if (!document.body) {
        return
    }
    const iconNames: Record<typeof alertType, string> = {
        error: "circle-exclamation",
        warning: "circle-exclamation",
        info: "circle-info",
        success: "circle-check"
    }
    if (!document.getElementById("fw-alerts-outer-wrapper")) {
        document.body.insertAdjacentHTML(
            "beforeend",
            '<div id="fw-alerts-outer-wrapper"><ul id="fw-alerts-wrapper"></ul></div>'
        )
    }
    const alertsWrapper = document.getElementById("fw-alerts-wrapper")
    if (!alertsWrapper) {
        return
    }
    alertsWrapper.insertAdjacentHTML(
        "beforeend",
        `<li class="fa-before fa-${iconNames[alertType]}">${alertMsg}</li>`
    )
    const alertBox = alertsWrapper.lastElementChild
    if (!alertBox) {
        return
    }
    setTimeout(() => {
        alertBox.classList.add("fw-visible")
        setTimeout(() => {
            alertBox.classList.remove("fw-visible")
            setTimeout(() => alertsWrapper.removeChild(alertBox), 2000)
        }, 4000)
    }, 1)
}

export interface DialogButtonSpec {
    type?: "close" | "cancel" | "ok"
    text?: string
    classes?: string
    click?: (event?: Event) => void
    icon?: string
    dropdown?: boolean
}

// Used for system messages
export const showSystemMessage = (
    message: string,
    buttons: DialogButtonSpec[] = [{type: "close"}]
): Dialog => {
    const dialog = new Dialog({
        title: gettext("System message"),
        body: `<p>${escapeText(message)}</p>`,
        buttons
    })
    dialog.open()
    return dialog
}

/** Turn milliseconds since epoch (UTC) into a local date string.
 * @param milliseconds Number of milliseconds since epoch (1/1/1970 midnight, UTC).
 * @param type 'full' for full date (default), 'sortable-date' for sortable date, 'minutes' for minute accuracy
 */
type DateType = "sortable-date" | "minutes" | "full"

const CACHED_DATES: Record<DateType, Record<number, string>> = {
    "sortable-date": {},
    minutes: {},
    full: {}
}
export const localizeDate = (
    milliseconds: number,
    type: DateType = "full"
): string => {
    if (milliseconds === 0) {
        return ""
    } else if (CACHED_DATES[type][milliseconds]) {
        return CACHED_DATES[type][milliseconds]
    }
    const theDate = new Date(milliseconds)
    let returnValue: string
    switch (type) {
        case "sortable-date": {
            const yyyy = theDate.getFullYear()
            const mm = theDate.getMonth() + 1
            const dd = theDate.getDate()
            returnValue = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
            break
        }
        case "minutes":
            returnValue = theDate.toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            })
            break
        default:
            returnValue = theDate.toLocaleString()
    }
    if (Object.keys(CACHED_DATES[type]).length > 5000) {
        CACHED_DATES[type] = {}
    }
    CACHED_DATES[type][milliseconds] = returnValue
    return returnValue
}

/**
 * Turn string literals into single line, removing spaces at start of line
 */

export const noSpaceTmp = (
    strings: TemplateStringsArray,
    ...values: unknown[]
): string => {
    const tmpStrings = Array.from(strings)

    let combined = ""
    while (tmpStrings.length > 0 || values.length > 0) {
        if (tmpStrings.length > 0) {
            combined += tmpStrings.shift()
        }
        if (values.length > 0) {
            const value = values.shift()
            combined += value !== undefined && value !== null ? String(value) : ""
        }
    }

    let out = ""
    combined.split("\n").forEach(line => {
        out += line.replace(/^\s*/g, "")
    })
    return out
}

export const escapeText = (text: string): string => {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")

        .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "") // invalid in XML chars
}

/**
 * Return an inline info-icon with a hover tooltip containing the given HTML.
 * Use only with trusted HTML content.
 *
 * @param html - The tooltip content (HTML string)
 * @returns HTML for the info tooltip
 */
export const infoTooltip = (html: string): string =>
    `<span class="fw-info-tooltip"><i class="fa-solid fa-info-circle"></i><span class="fw-info-tooltip-text">${html}</span></span>`

export const unescapeText = (text: string): string =>
    text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
/**
 * Return a cancel promise if you need to cancel a promise chain. Import as
 * ES6 promises are not (yet) cancelable.
 */

export const cancelPromise = (): Promise<never> => new Promise(() => {})

// Check if selector matches one of the ancestors of the event target.
// Used in switch statements of document event listeners.
export const findTarget = (
    event: Event,
    selector: string,
    el: {target?: Element | null}
): boolean => {
    el.target = (event.target as Element).closest(selector)
    if (el.target) {
        event.stopPropagation()
        return true
    }
    return false
}

// Promise when page has been loaded.
export const whenReady = (): Promise<void> => {
    if (document.readyState === "complete") {
        return Promise.resolve()
    } else {
        return new Promise(resolve => {
            document.addEventListener("readystatechange", _event => {
                if (document.readyState === "complete") {
                    resolve()
                }
            })
        })
    }
}

export const setDocTitle = (title: string, app: {name: string}): void => {
    const titleText = `${title} - ${app.name}`
    if (document.title !== titleText) {
        document.title = titleText
    }
}

const LANGUAGES: Record<string, string> = {
    ar: "العربية",
    bg: "Български",
    cs: "Čeština",
    da: "Dansk",
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    it: "Italiano",
    ja: "日本語",
    ko: "한국어",
    nb: "Norsk bokmål",
    nl: "Nederlands",
    pl: "Polski",
    "pt-br": "Português (Brasil)",
    "pt-pt": "Português (Portugal)",
    ru: "Русский",
    sv: "Svenska",
    tr: "Türkçe",
    "zh-hans": "简体中文"
}

export const langName = (code: string): string => {
    return LANGUAGES[code] || code
}

/** Enable ISO date picker on a text input by overlaying a native date picker.
 * The text input displays ISO format (YYYY-MM-DD) while using the native picker for selection.
 * @param inputEl - The text input element to enhance
 * @param minToday - If true, sets min date to today (default: false)
 */
export const enableDatePicker = (
    inputEl: HTMLInputElement,
    minToday = false
): void => {
    const datePicker = document.createElement("input")
    datePicker.type = "date"
    if (minToday) {
        datePicker.min = new Date().toISOString().split("T")[0]
    }
    datePicker.style.position = "absolute"
    datePicker.style.opacity = "0"
    datePicker.style.pointerEvents = "none"

    const parent = inputEl.parentElement
    if (!parent) {
        return
    }
    parent.style.position = "relative"
    parent.appendChild(datePicker)

    inputEl.addEventListener("click", () => datePicker.showPicker())
    datePicker.addEventListener("change", () => {
        inputEl.value = datePicker.value
    })

    // Validate and normalize date on blur or form submission
    const validateDate = () => {
        const value = inputEl.value
        if (!value) {
            return // Empty is valid (optional field)
        }
        const date = new Date(value)
        if (isNaN(date.getTime())) {
            inputEl.value = "" // Invalid date, clear it
            return
        }
        // Re-format to ensure consistent YYYY-MM-DD format
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, "0")
        const dd = String(date.getDate()).padStart(2, "0")
        inputEl.value = `${yyyy}-${mm}-${dd}`
    }

    inputEl.addEventListener("blur", validateDate)
    inputEl.addEventListener("keydown", event => {
        // Intercept Enter to validate before form submission
        if (event.key === "Enter") {
            validateDate()
            return
        }
        // Allow typing when date picker is open (it takes focus)
        if (document.activeElement === datePicker) {
            return // Let datePicker handle all keys
        }
        const key = event.key
        // Open picker on Enter
        if (key === "Enter") {
            event.preventDefault()
            datePicker.showPicker()
            return
        }
        // Allow editing: digits, dashes, backspace, delete, arrow keys
        if (
            /^\d$/.test(key) ||
            key === "-" ||
            key === "Backspace" ||
            key === "Delete" ||
            key === "ArrowLeft" ||
            key === "ArrowRight" ||
            key === "Tab"
        ) {
            return // Allow default behavior
        }
        // Block other keys
        event.preventDefault()
    })
    // Allow typing while date picker is open
    datePicker.addEventListener("keydown", event => {
        event.stopPropagation()
    })
}
