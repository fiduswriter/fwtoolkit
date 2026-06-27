import { ensureCSS } from "./network.js"
import { escapeText } from "./basic.js"
import { staticUrl } from "./settings.js"

export interface TypeSwitchOptions {
    dom: HTMLElement
    label1: string
    label2: string
    render1?: () => string | HTMLElement
    render2?: () => string | HTMLElement
    initialMode?: 1 | 2
    disabled?: boolean
    beforeChange?: (mode: 1 | 2) => void
    onChange?: (mode: 1 | 2) => void
}

/**
 * A sliding two-state toggle that switches between two rendered views.
 */
export class TypeSwitch {
    dom: HTMLElement
    options: TypeSwitchOptions
    private currentMode: 1 | 2
    private switcher: HTMLElement
    private inner: HTMLElement

    constructor(options: TypeSwitchOptions) {
        this.options = options
        this.dom = options.dom
        this.currentMode = options.initialMode || 1
        ensureCSS(staticUrl("css/type_switch.css"))
        this.renderWrapper()
        this.switcher = this.dom.querySelector(".fw-type-switch") as HTMLElement
        this.inner = this.dom.querySelector(
            ".fw-type-switch-input-inner"
        ) as HTMLElement
        this.updateView(false)

        if (options.disabled) {
            this.switcher.classList.add("fw-disabled")
        } else {
            this.switcher.addEventListener("click", () => this.switchMode())
        }
    }

    get mode(): 1 | 2 {
        return this.currentMode
    }

    set mode(mode: 1 | 2) {
        if (mode !== this.currentMode) {
            if (this.options.beforeChange) {
                this.options.beforeChange(mode)
            }
            this.currentMode = mode
            this.updateView(true)
        }
    }

    switchMode(): void {
        this.mode = this.currentMode === 1 ? 2 : 1
    }

    /**
     * The container element that holds the current mode's rendered content.
     * Host code can use this to query or further initialise sub-widgets after
     * a switch.
     */
    get innerElement(): HTMLElement {
        return this.inner
    }

    private renderWrapper(): void {
        this.dom.innerHTML = `<div class="fw-type-switch-input-wrapper">
            <button class="fw-type-switch fw-value${this.currentMode}">
                <span class="fw-type-switch-inner">
                    <span class="fw-type-switch-label">${escapeText(
                        this.options.label1
                    )}</span>
                    <span class="fw-type-switch-label">${escapeText(
                        this.options.label2
                    )}</span>
                </span>
            </button>
            <div class="fw-type-switch-input-inner"></div>
        </div>`
    }

    private updateView(notify: boolean): void {
        this.switcher.classList.remove("fw-value1", "fw-value2")
        this.switcher.classList.add(`fw-value${this.currentMode}`)

        const render =
            this.currentMode === 1 ? this.options.render1 : this.options.render2
        if (render) {
            this.setContent(render())
        }

        if (notify && this.options.onChange) {
            this.options.onChange(this.currentMode)
        }
    }

    private setContent(content: string | HTMLElement): void {
        if (typeof content === "string") {
            this.inner.innerHTML = content
        } else {
            this.inner.innerHTML = ""
            this.inner.appendChild(content)
        }
    }
}
