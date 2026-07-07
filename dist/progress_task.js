import { ensureCSS } from "./network.js";
import { escapeText } from "./basic.js";
import { gettext, staticUrl } from "./settings.js";
const ICONS = {
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
};
let taskIdCounter = 0;
const getContainer = () => {
    let outer = document.getElementById("fw-progress-outer-wrapper");
    if (!outer) {
        document.body.insertAdjacentHTML("beforeend", '<div id="fw-progress-outer-wrapper"><ul id="fw-progress-wrapper"></ul></div>');
        outer = document.getElementById("fw-progress-outer-wrapper");
    }
    return outer;
};
export class ProgressTask {
    constructor(alertType, { title, message = "", percentage = null, cancelable = false, onCancel, autoClose = true, dismissable = true }) {
        this.closeTimeout = undefined;
        this.done = false;
        this.closed = false;
        this.item = null;
        this.id = `fw-progress-task-${++taskIdCounter}`;
        this.alertType = alertType;
        this.title = title;
        this.message = message;
        this.percentage = percentage;
        this.cancelable = cancelable;
        this.onCancel = onCancel;
        this.autoClose = autoClose;
        this.dismissable = dismissable;
    }
    open() {
        if (this.closed || !document.body) {
            return;
        }
        ensureCSS(staticUrl("css/progress_task.css"));
        const container = getContainer();
        const wrapper = container.querySelector("#fw-progress-wrapper");
        const messageHtml = this.message
            ? `<div class="fw-progress-message">${escapeText(this.message)}</div>`
            : "";
        const progressBarHtml = this.percentage === null
            ? '<div class="fw-progress-bar fw-indeterminate" aria-hidden="true"><div class="fw-progress-fill"></div></div>'
            : `<div class="fw-progress-bar" aria-hidden="true"><div class="fw-progress-fill" style="width: ${Math.max(0, Math.min(100, this.percentage))}%"></div></div>`;
        const cancelHtml = this.cancelable
            ? `<button class="fw-progress-cancel" type="button" aria-label="${escapeText(gettext("Cancel"))}"><i class="fa fa-times"></i></button>`
            : this.dismissable
                ? `<button class="fw-progress-cancel" type="button" aria-label="${escapeText(gettext("Dismiss"))}"><i class="fa fa-times"></i></button>`
                : "";
        const iconClass = ICONS[this.alertType].running;
        wrapper.insertAdjacentHTML("beforeend", `<li id="${this.id}" class="fw-progress-task fw-progress-${this.alertType}" role="status" aria-live="polite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this.percentage === null ? 0 : this.percentage}">
                <div class="fw-progress-header">
                    <span class="fw-progress-icon ${iconClass}"></span>
                    <span class="fw-progress-title">${escapeText(this.title)}</span>
                    ${cancelHtml}
                </div>
                ${messageHtml}
                ${progressBarHtml}
            </li>`);
        this.item = document.getElementById(this.id);
        const button = this.item?.querySelector(".fw-progress-cancel");
        if (button) {
            button.addEventListener("click", () => {
                if (this.cancelable) {
                    this.onCancel?.();
                }
                this.close();
            });
        }
        if (this.percentage !== null && this.percentage >= 100) {
            this.markDone();
        }
    }
    update(percentage, message) {
        if (this.closed || !this.item) {
            return;
        }
        this.percentage = percentage;
        if (message !== undefined) {
            this.message = message;
            const messageEl = this.item.querySelector(".fw-progress-message");
            if (message) {
                if (messageEl) {
                    messageEl.innerHTML = escapeText(message);
                }
                else {
                    const header = this.item.querySelector(".fw-progress-header");
                    header?.insertAdjacentHTML("afterend", `<div class="fw-progress-message">${escapeText(message)}</div>`);
                }
            }
            else {
                messageEl?.parentElement?.removeChild(messageEl);
            }
        }
        const fill = this.item.querySelector(".fw-progress-fill");
        const bar = this.item.querySelector(".fw-progress-bar");
        if (this.percentage === null) {
            bar?.classList.add("fw-indeterminate");
            if (fill) {
                fill.style.width = "100%";
            }
            this.item.setAttribute("aria-valuenow", "0");
        }
        else {
            const clamped = Math.max(0, Math.min(100, this.percentage));
            bar?.classList.remove("fw-indeterminate");
            if (fill) {
                fill.style.width = `${clamped}%`;
            }
            this.item.setAttribute("aria-valuenow", String(clamped));
            if (clamped >= 100) {
                this.markDone();
            }
        }
    }
    setMessage(message) {
        this.update(this.percentage, message);
    }
    markDone() {
        if (this.done || !this.item) {
            return;
        }
        this.done = true;
        const icon = this.item.querySelector(".fw-progress-icon");
        if (icon) {
            icon.className = `fw-progress-icon ${ICONS[this.alertType].done}`;
        }
        if (this.autoClose) {
            const delay = typeof this.autoClose === "number" ? this.autoClose : 2000;
            this.closeTimeout = window.setTimeout(() => this.close(), delay);
        }
    }
    close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        if (this.closeTimeout) {
            window.clearTimeout(this.closeTimeout);
            this.closeTimeout = undefined;
        }
        if (this.item) {
            this.item.classList.add("fw-closing");
            window.setTimeout(() => {
                if (this.item && this.item.parentElement) {
                    this.item.parentElement.removeChild(this.item);
                }
                const wrapper = document.getElementById("fw-progress-wrapper");
                if (wrapper && !wrapper.children.length) {
                    const outer = document.getElementById("fw-progress-outer-wrapper");
                    outer?.parentElement?.removeChild(outer);
                }
                this.item = null;
            }, 300);
        }
    }
    isClosed() {
        return this.closed;
    }
}
export const addProgress = (alertType, title, options = {}) => {
    const task = new ProgressTask(alertType, { title, ...options });
    task.open();
    return task;
};
//# sourceMappingURL=progress_task.js.map