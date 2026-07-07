import { ensureCSS } from "./network.js"
import { escapeText } from "./basic.js"
import { gettext, staticUrl } from "./settings.js"

export type ProgressTaskType = "info" | "success" | "warning" | "error"

export interface ProgressTaskSpec {
    title: string
    message?: string
    percentage?: number | null
    cancelable?: boolean
    onCancel?: () => void
    /** Automatically close the task when it reaches 100%. `true` uses a default
     * delay of 2000 ms; a number sets a custom delay in ms. Set to `false` to
     * keep the task open indefinitely. Defaults to `true`.
     */
    autoClose?: boolean | number
    /** Show a manual close/dismiss button even when the task is not cancelable.
     * Defaults to `true`.
     */
    dismissable?: boolean
}

const ICONS: Record<ProgressTaskType, { running: string; done: string }> = {
    info: { running: "fa fa-spinner fa-pulse", done: "fa fa-circle-check" },
    success: { running: "fa fa-spinner fa-pulse", done: "fa fa-circle-check" },
    warning: {
        running: "fa fa-spinner fa-pulse",
        done: "fa fa-circle-exclamation"
    },
    error: {
        running: "fa fa-circle-exclamation",
        done: "fa fa-circle-exclamation"
    }
}

let taskIdCounter = 0

const getContainer = (): HTMLElement => {
    let outer = document.getElementById("fw-progress-outer-wrapper")
    if (!outer) {
        document.body.insertAdjacentHTML(
            "beforeend",
            '<div id="fw-progress-outer-wrapper"><ul id="fw-progress-wrapper"></ul></div>'
        )
        outer = document.getElementById("fw-progress-outer-wrapper")
    }
    return outer as HTMLElement
}

export class ProgressTask {
    private readonly id: string
    private readonly alertType: ProgressTaskType
    private readonly title: string
    private message: string
    private percentage: number | null
    private readonly cancelable: boolean
    private readonly onCancel?: () => void
    private readonly dismissable: boolean
    private readonly autoClose: boolean | number
    private closeTimeout: number | undefined = undefined
    private done = false
    private closed = false
    private item: HTMLElement | null = null

    constructor(
        alertType: ProgressTaskType,
        {
            title,
            message = "",
            percentage = null,
            cancelable = false,
            onCancel,
            autoClose = true,
            dismissable = true
        }: ProgressTaskSpec
    ) {
        this.id = `fw-progress-task-${++taskIdCounter}`
        this.alertType = alertType
        this.title = title
        this.message = message
        this.percentage = percentage
        this.cancelable = cancelable
        this.onCancel = onCancel
        this.autoClose = autoClose
        this.dismissable = dismissable
    }

    open(): void {
        if (this.closed || !document.body) {
            return
        }
        ensureCSS(staticUrl("css/progress_task.css"))
        const container = getContainer()
        const wrapper = container.querySelector(
            "#fw-progress-wrapper"
        ) as HTMLElement
        const messageHtml = this.message
            ? `<div class="fw-progress-message">${escapeText(this.message)}</div>`
            : ""
        const progressBarHtml =
            this.percentage === null
                ? '<div class="fw-progress-bar fw-indeterminate" aria-hidden="true"><div class="fw-progress-fill"></div></div>'
                : `<div class="fw-progress-bar" aria-hidden="true"><div class="fw-progress-fill" style="width: ${Math.max(0, Math.min(100, this.percentage))}%"></div></div>`
        const cancelHtml = this.cancelable
            ? `<button class="fw-progress-cancel" type="button" aria-label="${escapeText(gettext("Cancel"))}"><i class="fa fa-times"></i></button>`
            : this.dismissable
              ? `<button class="fw-progress-cancel" type="button" aria-label="${escapeText(gettext("Dismiss"))}"><i class="fa fa-times"></i></button>`
              : ""
        const iconClass = ICONS[this.alertType].running
        wrapper.insertAdjacentHTML(
            "beforeend",
            `<li id="${this.id}" class="fw-progress-task fw-progress-${this.alertType}" role="status" aria-live="polite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this.percentage === null ? 0 : this.percentage}">
                <div class="fw-progress-header">
                    <span class="fw-progress-icon ${iconClass}"></span>
                    <span class="fw-progress-title">${escapeText(this.title)}</span>
                    ${cancelHtml}
                </div>
                ${messageHtml}
                ${progressBarHtml}
            </li>`
        )
        this.item = document.getElementById(this.id)
        const button = this.item?.querySelector(".fw-progress-cancel")
        if (button) {
            button.addEventListener("click", () => {
                if (this.cancelable) {
                    this.onCancel?.()
                }
                this.close()
            })
        }
        if (this.percentage !== null && this.percentage >= 100) {
            this.markDone()
        }
    }

    update(percentage: number | null, message?: string): void {
        if (this.closed || !this.item) {
            return
        }
        this.percentage = percentage
        if (message !== undefined) {
            this.message = message
            const messageEl = this.item.querySelector(".fw-progress-message")
            if (message) {
                if (messageEl) {
                    messageEl.innerHTML = escapeText(message)
                } else {
                    const header = this.item.querySelector(
                        ".fw-progress-header"
                    )
                    header?.insertAdjacentHTML(
                        "afterend",
                        `<div class="fw-progress-message">${escapeText(message)}</div>`
                    )
                }
            } else {
                messageEl?.parentElement?.removeChild(messageEl)
            }
        }
        const fill = this.item.querySelector(
            ".fw-progress-fill"
        ) as HTMLElement | null
        const bar = this.item.querySelector(
            ".fw-progress-bar"
        ) as HTMLElement | null
        if (this.percentage === null) {
            bar?.classList.add("fw-indeterminate")
            if (fill) {
                fill.style.width = "100%"
            }
            this.item.setAttribute("aria-valuenow", "0")
        } else {
            const clamped = Math.max(0, Math.min(100, this.percentage))
            bar?.classList.remove("fw-indeterminate")
            if (fill) {
                fill.style.width = `${clamped}%`
            }
            this.item.setAttribute("aria-valuenow", String(clamped))
            if (clamped >= 100) {
                this.markDone()
            }
        }
    }

    setMessage(message: string): void {
        this.update(this.percentage, message)
    }

    private markDone(): void {
        if (this.done || !this.item) {
            return
        }
        this.done = true
        const icon = this.item.querySelector(".fw-progress-icon")
        if (icon) {
            icon.className = `fw-progress-icon ${ICONS[this.alertType].done}`
        }
        if (this.autoClose) {
            const delay =
                typeof this.autoClose === "number" ? this.autoClose : 2000
            this.closeTimeout = window.setTimeout(() => this.close(), delay)
        }
    }

    close(): void {
        if (this.closed) {
            return
        }
        this.closed = true
        if (this.closeTimeout) {
            window.clearTimeout(this.closeTimeout)
            this.closeTimeout = undefined
        }
        if (this.item) {
            this.item.classList.add("fw-closing")
            window.setTimeout(() => {
                if (this.item && this.item.parentElement) {
                    this.item.parentElement.removeChild(this.item)
                }
                const wrapper = document.getElementById("fw-progress-wrapper")
                if (wrapper && !wrapper.children.length) {
                    const outer = document.getElementById(
                        "fw-progress-outer-wrapper"
                    )
                    outer?.parentElement?.removeChild(outer)
                }
                this.item = null
            }, 300)
        }
    }

    isClosed(): boolean {
        return this.closed
    }
}

export const addProgress = (
    alertType: ProgressTaskType,
    title: string,
    options: Omit<ProgressTaskSpec, "title"> = {}
): ProgressTask => {
    const task = new ProgressTask(alertType, { title, ...options })
    task.open()
    return task
}
