import { keyName } from "w3c-keyname"

import { findTarget } from "./basic.js"
import { gettext } from "./settings.js"

export interface DialogButtonSpec {
    type?: "close" | "cancel" | "ok"
    text?: string
    classes?: string
    click?: (event?: Event) => unknown
    icon?: string
    dropdown?: boolean
}

export interface DialogOptions {
    id?: string | false
    classes?: string | false
    title?: string
    body?: string
    restoreActiveElement?: boolean
    height?: number | false
    width?: number | false
    canClose?: boolean
    help?: (() => void) | false
    note?: { text?: string; display?: boolean }
    blur?: boolean
    buttons?: DialogButtonSpec[]
    beforeClose?: (() => void) | false
    onClose?: (() => void) | false
    icon?: string | false
    scroll?: boolean | false
    canEscape?: boolean
    fullScreen?: boolean | false
    initialFocus?: string | null
}

interface InternalDialogButton {
    text: string
    classes: string | false
    click: (event?: Event) => unknown
    icon: string | false
    dropdown: boolean
}

interface NoteSpec {
    text?: string
    display?: boolean
}

const dialogTemplate = ({
    id,
    classes,
    title,
    height,
    width,
    icon,
    buttons,
    zIndex,
    body,
    scroll,
    help,
    canClose,
    note,
    blur
}: {
    id: string | false
    classes: string | false
    title: string
    height: string
    width: string
    icon: string | false
    buttons: InternalDialogButton[]
    zIndex: number
    body: string
    scroll: boolean | false
    help: (() => void) | false
    canClose: boolean
    note: NoteSpec
    blur: boolean
}) =>
    `<div tabindex="-1" role="dialog"
        class="fw-dialog"
        ${id ? `aria-describedby="${id}"` : ""} style="z-index: ${zIndex};">
    <div class="fw-dialog-titlebar">
        ${icon ? `<i class="fa fa-${icon}" aria-hidden="true"></i>` : ""}
        <span class="fw-dialog-title">${title}</span>
        ${
            help
                ? `<button type="button" class="fw-dialog-titlebar-button fw-dialog-button-icon-only fw-dialog-titlebar-help" title="${gettext("Help")}">
            <span class="fw-icon fw-icon-help"> </span>
            ${gettext("Help")}
        </button>`
                : ""
        }
        ${
            canClose
                ? `<button type="button" class="fw-dialog-titlebar-button fw-dialog-button-icon-only fw-dialog-titlebar-close" title="${gettext("Close")}">
            <span class="fw-icon fw-icon-close"> </span>
            ${gettext("Close")}
        </button>`
                : ""
        }

    </div>
    <div ${id ? `id="${id}"` : ""} class="fw-dialog-content${classes ? ` ${classes}` : ""}${scroll ? " fw-scrollable" : ""}" style="width: ${width}; height: ${height};">
        ${note.text ? `<div class="fw-note-container">${noteTemplate(note)}</div>` : ""}
        ${body}
    </div>
    <div class="fw-dialog-buttonpane">
        <div class="fw-dialog-buttonset">${buttonsTemplate({ buttons })}</div>
    </div>
</div>
<div class="fw-overlay${blur === false ? " fw-no-blur" : ""}" style="z-index: ${zIndex - 1}"></div>`

const noteTemplate = (note: NoteSpec): string => {
    return note.text
        ? `<p class="fw-note-el ${note.display ? "" : "fw-hide"}">${note.text}</p>`
        : ""
}

const buttonsTemplate = ({
    buttons
}: {
    buttons: InternalDialogButton[]
}): string => buttons.map(button => buttonTemplate(button)).join("")

const buttonTemplate = ({
    text,
    classes,
    icon,
    dropdown
}: InternalDialogButton): string => `<button type="button" class="${classes ? classes : "fw-light"} fw-button">
    ${icon ? `<i class="fa fa-${icon}" aria-hidden="true"></i>` : ""}
    ${text}
    ${dropdown ? '<i class="fa fa-caret-down" aria-hidden="true"></i>' : ""}
</button>`

const BUTTON_TYPES: Record<
    "close" | "cancel" | "ok",
    { text: string; classes: string; click: (dialog: Dialog) => () => void }
> = {
    close: {
        text: gettext("Close"),
        classes: "fw-orange",
        click: dialog => () => dialog.close()
    },
    cancel: {
        text: gettext("Cancel"),
        classes: "fw-orange",
        click: dialog => () => dialog.close()
    },
    ok: {
        text: gettext("OK"),
        classes: "fw-dark",
        click: dialog => () => dialog.close()
    }
}

export class Dialog {
    id: string | false
    classes: string | false
    title: string
    body: string
    restoreActiveElement: boolean
    height: string
    width: string
    canClose: boolean
    help: (() => void) | false
    note: NoteSpec
    blur: boolean
    buttons: InternalDialogButton[]
    beforeClose: (() => void) | false
    onClose: (() => void) | false
    icon: string | false
    scroll: boolean | false
    canEscape: boolean
    dialogEl!: HTMLElement
    backdropEl!: HTMLElement
    dragging: { x: number; y: number } | false
    hasBeenMoved: boolean
    listeners: Record<string, (event: Event) => void>
    fullScreen: boolean | false
    initialFocus: string | null

    previousActiveElement: Element | null
    firstFocusableEl: Element | null
    lastFocusableEl: Element | null
    focusableEls: Element[] | null

    constructor(options: DialogOptions) {
        this.id = options.id || false
        this.classes = options.classes || false
        this.title = options.title || ""
        this.body = options.body || ""
        this.restoreActiveElement = options.restoreActiveElement !== false // default is true
        this.height = options.height ? `${options.height}px` : "auto"
        this.width = options.width ? `${options.width}px` : "auto"
        this.canClose = "canClose" in options ? options.canClose! : true
        this.help = "help" in options ? options.help! : false
        this.note = "note" in options ? options.note! : {}
        this.blur = "blur" in options ? options.blur! : true
        this.buttons = []
        if (options.buttons) {
            this.setButtons(options.buttons)
        }
        this.beforeClose = options.beforeClose || false
        this.onClose = options.onClose || false
        this.icon = options.icon || false
        this.scroll = options.scroll || false
        this.canEscape =
            options.canEscape ??
            !!options.buttons?.find(button =>
                ["cancel", "close"].includes(button.type || "")
            )
        this.dialogEl = null!
        this.backdropEl = null!
        this.dragging = false
        this.hasBeenMoved = false
        this.listeners = {}
        this.fullScreen = options.fullScreen ? options.fullScreen : false
        this.initialFocus = options.initialFocus || null

        this.previousActiveElement = null // Store previously focused element
        this.firstFocusableEl = null
        this.lastFocusableEl = null
        this.focusableEls = null
    }

    setButtons(buttons: DialogButtonSpec[]): void {
        this.buttons = buttons.map(button => ({
            text: button.text
                ? button.text
                : button.type
                  ? BUTTON_TYPES[button.type].text
                  : "",
            classes: button.classes
                ? button.classes
                : button.type
                  ? BUTTON_TYPES[button.type].classes
                  : false,
            click: button.click
                ? button.click
                : button.type
                  ? BUTTON_TYPES[button.type].click(this)
                  : () => {},
            icon: button.icon ? button.icon : false,
            dropdown: button.dropdown ? true : false
        }))
    }

    open(): void {
        if (this.dialogEl) {
            return
        }

        // Store currently focused element to restore later
        this.previousActiveElement = this.restoreActiveElement
            ? document.activeElement
            : null

        if (this.fullScreen) {
            this.height = "85vh"
        }

        document.body.insertAdjacentHTML(
            "beforeend",
            dialogTemplate({
                id: this.id,
                classes: this.classes,
                title: this.title,
                height: this.height,
                width: this.width,
                icon: this.icon,
                buttons: this.buttons,
                zIndex: this.nextDialogZIndex(),
                body: this.body,
                scroll: this.scroll,
                canClose: this.canClose,
                help: this.help,
                note: this.note,
                blur: this.blur
            })
        )
        this.backdropEl = document.body.lastElementChild as HTMLElement
        this.dialogEl = this.backdropEl.previousElementSibling as HTMLElement
        if (this.fullScreen) {
            this.dialogEl.style.width = "98%"
            this.dialogEl.style.height = "100%"
            this.dialogEl.style.position = "fixed"
            this.dialogEl.style.top = "0px"
        } else {
            // Defer centering until the browser has calculated the dialog's
            // intrinsic size. requestAnimationFrame is preferred, but it can be
            // throttled in hidden/headless contexts, so fall back to a timeout.
            if (typeof requestAnimationFrame !== "undefined") {
                requestAnimationFrame(() => this.centerDialog())
                setTimeout(() => this.centerDialog(), 0)
            } else {
                this.centerDialog()
            }
        }

        // Set dialog attributes for accessibility
        this.dialogEl.setAttribute("role", "dialog")
        this.dialogEl.setAttribute("aria-modal", "true")
        if (this.title) {
            this.dialogEl.setAttribute("aria-labelledby", "dialog-title")
            const titleEl = this.dialogEl.querySelector(
                ".fw-dialog-title"
            ) as HTMLElement
            titleEl.id = "dialog-title"
        }

        // Get all focusable elements
        this.focusableEls = this.getFocusableElements()
        this.firstFocusableEl = this.focusableEls[0] || null
        this.lastFocusableEl =
            this.focusableEls[this.focusableEls.length - 1] || null

        // Set initial focus to the most appropriate element
        const initialFocusElement = this.getInitialFocusElement()
        if (initialFocusElement) {
            setTimeout(() => (initialFocusElement as HTMLElement).focus(), 0)
        } else if (this.firstFocusableEl) {
            ;(this.firstFocusableEl as HTMLElement).focus()
        } else {
            this.dialogEl.focus()
        }

        this.bind()
    }

    refreshButtons(): void {
        const buttonSet = this.dialogEl.querySelector(".fw-dialog-buttonset")!
        buttonSet.innerHTML = buttonsTemplate({ buttons: this.buttons })
    }

    refreshNote(): void {
        const noteContainer = this.dialogEl.querySelector(".fw-note-container")!
        noteContainer.innerHTML = noteTemplate(this.note)
    }

    centerDialog(): void {
        const totalWidth = window.innerWidth,
            totalHeight = window.innerHeight,
            dialogWidth = this.dialogEl.clientWidth,
            dialogHeight = this.dialogEl.clientHeight,
            scrollTopOffset = window.pageYOffset,
            scrollLeftOffset = window.pageXOffset

        this.dialogEl.style.top = `${(totalHeight - dialogHeight) / 2 + scrollTopOffset}px`
        this.dialogEl.style.left = `${(totalWidth - dialogWidth) / 2 + scrollLeftOffset}px`
    }

    adjustDialogToScroll(): void {
        this.dialogEl.style.top = `${Math.max(
            Math.min(
                this.dialogEl.offsetTop,
                this.backdropEl.scrollHeight -
                    this.dialogEl.scrollHeight +
                    window.pageYOffset
            ),
            window.pageYOffset
        )}px`
    }

    moveDialog(x: number, y: number): void {
        if (!this.dragging) {
            return
        }
        this.dialogEl.style.top = `${Math.min(
            Math.max(y - this.dragging.y, 0),
            this.backdropEl.scrollHeight -
                this.dialogEl.scrollHeight +
                window.pageYOffset
        )}px`
        this.dialogEl.style.left = `${Math.min(
            Math.max(x - this.dragging.x, 0),
            document.body.scrollWidth - this.dialogEl.scrollWidth
        )}px`
        this.hasBeenMoved = true
    }

    onScroll(_event: Event): void {
        if (this.hasBeenMoved) {
            // The dialog has been moved manually. We just adjust the position to make it stay in the view.
            this.adjustDialogToScroll()
        } else {
            this.centerDialog()
        }
    }

    onKeydown(event: KeyboardEvent): void {
        let name = keyName(event)
        if (event.altKey) {
            name = "Alt-" + name
        }
        if (event.ctrlKey) {
            name = "Ctrl-" + name
        }
        if (event.metaKey) {
            name = "Meta-" + name
        }
        if (event.shiftKey) {
            name = "Shift-" + name
        }
        if (name === "Escape" && this.canEscape) {
            event.preventDefault()
            this.close()
            return
        } else if (name === "Tab") {
            if (document.activeElement === this.lastFocusableEl) {
                event.preventDefault()
                ;(this.firstFocusableEl as HTMLElement).focus()
            }
        } else if (name === "Shift-Tab") {
            if (document.activeElement === this.firstFocusableEl) {
                event.preventDefault()
                ;(this.lastFocusableEl as HTMLElement).focus()
            }
        }
    }

    bind(): void {
        this.listeners.onKeydown = event =>
            this.onKeydown(event as KeyboardEvent)
        document.body.addEventListener("keydown", this.listeners.onKeydown)
        this.dialogEl.addEventListener("click", event => {
            const el: { target?: Element | null } = {}
            switch (true) {
                case findTarget(event, ".fw-dialog-buttonpane button", el): {
                    event.preventDefault()
                    let buttonNumber = 0
                    let seekItem = el.target as Element
                    while (seekItem.previousElementSibling) {
                        buttonNumber++
                        seekItem = seekItem.previousElementSibling
                    }
                    this.buttons[buttonNumber].click(event)
                    break
                }
                case findTarget(event, ".fw-dialog-titlebar-close", el):
                    event.preventDefault()
                    this.close()
                    break
                case findTarget(event, ".fw-dialog-titlebar-help", el):
                    event.preventDefault()
                    if (this.help) {
                        this.help()
                    }
                    break
                default:
                    break
            }
        })
        if (!this.fullScreen) {
            this.listeners.onScroll = event => this.onScroll(event)
            window.addEventListener("scroll", this.listeners.onScroll, false)
            this.dialogEl.addEventListener("mousedown", event => {
                const el: { target?: Element | null } = {}
                switch (true) {
                    case findTarget(event, ".fw-dialog-titlebar", el):
                        this.dragging = {
                            x:
                                (event as MouseEvent).clientX -
                                this.dialogEl.offsetLeft,
                            y:
                                (event as MouseEvent).clientY -
                                this.dialogEl.offsetTop
                        }
                        break
                    default:
                        break
                }
            })
            this.dialogEl.addEventListener("mouseup", event => {
                const el: { target?: Element | null } = {}
                switch (true) {
                    case findTarget(event, ".fw-dialog-titlebar", el):
                        this.dragging = false
                        break
                    default:
                        break
                }
            })
            this.dialogEl.addEventListener("mousemove", event => {
                if (!this.dragging) {
                    return
                }
                this.moveDialog(
                    (event as MouseEvent).clientX,
                    (event as MouseEvent).clientY
                )
            })
        }

        // Prevent clicks outside dialog from moving focus outside
        this.backdropEl.addEventListener("click", event => {
            event.preventDefault()
            if (this.canClose) {
                this.close()
            }
        })

        // Prevent focus from leaving dialog when clicking backdrop
        this.backdropEl.addEventListener("mousedown", event => {
            event.preventDefault()
        })
    }

    nextDialogZIndex(): number {
        let zIndex = 100
        document.querySelectorAll("div.fw-dialog").forEach(dialogEl => {
            const computedZIndex = parseInt(
                window.getComputedStyle(dialogEl as HTMLElement).zIndex
            )
            zIndex = Math.max(
                zIndex,
                Number.isNaN(computedZIndex) ? 100 : computedZIndex
            )
        })
        zIndex += 2
        document.body.style.setProperty(
            "--highest-dialog-z-index",
            String(zIndex)
        )
        return zIndex
    }

    getFocusableElements(): Element[] {
        // Get all focusable elements
        const focusableSelectors = [
            "button:not([disabled])",
            "[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])'
        ].join(",")

        const elements = Array.from(
            this.dialogEl.querySelectorAll(focusableSelectors)
        )

        // Filter out hidden elements
        return elements.filter(el => {
            const style = window.getComputedStyle(el)
            return style.display !== "none" && style.visibility !== "hidden"
        })
    }

    getInitialFocusElement(): Element | undefined {
        if (this.initialFocus) {
            const customFocusElement = this.dialogEl.querySelector(
                this.initialFocus
            )
            if (customFocusElement) {
                return customFocusElement
            }
        }
        // Get all focusable elements
        const elements = this.getFocusableElements()

        // Try to find the most appropriate initial focus target
        const priorityElements = [
            // First try to find a text input
            elements.find(
                el =>
                    el.tagName === "INPUT" &&
                    (el as HTMLInputElement).type === "text"
            ),
            // Then try to find the first button in the button pane
            elements.find(el => el.closest(".fw-dialog-buttonpane")),
            // Then try to find any input
            elements.find(el => el.tagName === "INPUT"),
            // Then try to find any button except close/help
            elements.find(
                el =>
                    el.tagName === "BUTTON" &&
                    !el.classList.contains("fw-dialog-titlebar-close") &&
                    !el.classList.contains("fw-dialog-titlebar-help")
            )
        ]

        // Return the first element that exists
        return priorityElements.find(el => el) || elements[0]
    }

    close(): void {
        if (!this.dialogEl) {
            return
        }
        if (!this.fullScreen) {
            window.removeEventListener("scroll", this.listeners.onScroll, false)
        }
        document.body.removeEventListener("keydown", this.listeners.onKeydown)
        if (this.beforeClose) {
            this.beforeClose()
        }
        this.dialogEl.parentElement!.removeChild(this.dialogEl)
        this.backdropEl.parentElement!.removeChild(this.backdropEl)

        // Restore focus to previous element
        if (
            this.previousActiveElement &&
            (this.previousActiveElement as HTMLElement).focus
        ) {
            ;(this.previousActiveElement as HTMLElement).focus()
        }

        if (this.onClose) {
            this.onClose()
        }
    }
}
