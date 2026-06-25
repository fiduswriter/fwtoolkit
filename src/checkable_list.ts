import {ensureCSS} from "./network.js"
import {escapeText} from "./basic.js"

export interface CheckableListOption {
    id: string | number
    label: string
}

export interface CheckableListOptions {
    dom: HTMLElement
    options: CheckableListOption[]
    initialValue?: (string | number)[]
    multiple?: boolean
    onChange?: (selected: (string | number)[]) => void
}

/**
 * A list of checkable labels for single or multiple selection.
 */
export class CheckableList {
    dom: HTMLElement
    options: CheckableListOptions
    private selected: Set<string | number>

    constructor(options: CheckableListOptions) {
        this.options = options
        this.dom = options.dom
        this.selected = new Set(options.initialValue || [])
        ensureCSS(staticUrl("css/checkable_list.css"))
        this.render()
    }

    get value(): (string | number)[] {
        return Array.from(this.selected)
    }

    private render(): void {
        this.dom.innerHTML = this.options.options
            .map(
                option =>
                    `<div class="fw-checkable fw-checkable-label${
                        this.selected.has(option.id) ? " fw-checked" : ""
                    }" data-id="${option.id}">${escapeText(
                        option.label
                    )}</div>`
            )
            .join("")

        this.dom.querySelectorAll(".fw-checkable-label").forEach(el => {
            el.addEventListener("click", event => this.handleClick(event))
        })
    }

    private handleClick(event: Event): void {
        const target = event.currentTarget as HTMLElement
        const id = this.readId(target)
        if (id === null) {
            return
        }
        const isChecked = target.classList.contains("fw-checked")

        if (!this.options.multiple) {
            this.dom
                .querySelectorAll(".fw-checkable-label.fw-checked")
                .forEach(el => el.classList.remove("fw-checked"))
            this.selected.clear()
        }

        if (isChecked) {
            target.classList.remove("fw-checked")
            this.selected.delete(id)
        } else {
            target.classList.add("fw-checked")
            this.selected.add(id)
        }

        if (this.options.onChange) {
            this.options.onChange(this.value)
        }
    }

    private readId(el: HTMLElement): string | number | null {
        const raw = el.getAttribute("data-id")
        if (raw === null) {
            return null
        }
        // If all options use numeric ids, return a number for consistency.
        const allNumeric = this.options.options.every(
            option => typeof option.id === "number"
        )
        return allNumeric ? Number(raw) : raw
    }
}
