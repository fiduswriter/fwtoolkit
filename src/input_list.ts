import {ensureCSS} from "./network.js"
import {getFocusIndex, setFocusIndex} from "./focus.js"
import {isActivationEvent} from "./events.js"
import {gettext, staticUrl} from "./settings.js"

export interface InputListItemRenderResult<T> {
    html: string
    bind?: (el: HTMLElement, value: T, index: number) => void
}

export interface InputListOptions<T> {
    dom: HTMLElement
    initialValues?: T[]
    emptyValue: T
    renderItem: (value: T, index: number) => InputListItemRenderResult<T>
    getValue: (el: HTMLElement) => T
    validate?: (value: T) => boolean
    onChange?: (values: T[]) => void
}

/**
 * Generic add/remove list for form fields.
 *
 * Renders a table of items with plus/minus controls. Each item is rendered by
 * the host via `renderItem`; the host also extracts values via `getValue`.
 */
export class InputList<T> {
    dom: HTMLElement
    options: InputListOptions<T>
    private values_: T[]

    constructor(options: InputListOptions<T>) {
        this.options = options
        this.dom = options.dom
        this.values_ = options.initialValues?.length
            ? options.initialValues.slice()
            : [options.emptyValue]
        ensureCSS(staticUrl("css/input_list.css"))
        this.render()
    }

    get values(): T[] {
        return this.readValues()
    }

    /**
     * Validate all current values and highlight invalid items.
     */
    check(): boolean {
        const {validate} = this.options
        if (!validate) {
            return true
        }
        let passed = true
        const rows = this.listRows()
        this.readValues().forEach((value, index) => {
            const row = rows[index]
            if (!row) {
                return
            }
            const valid = validate(value)
            if (valid) {
                row.classList.remove("fw-form-error")
            } else {
                row.classList.add("fw-form-error")
                passed = false
            }
        })
        return passed
    }

    private render(): void {
        this.dom.innerHTML =
            '<table class="fw-input-list-wrapper"><tbody></tbody></table>'
        const tbody = this.dom.querySelector("tbody") as HTMLElement
        this.values_.forEach((value, index) => this.addRow(tbody, value, index))
    }

    private addRow(tbody: HTMLElement, value: T, index: number): void {
        const {html, bind} = this.options.renderItem(value, index)
        tbody.insertAdjacentHTML(
            "beforeend",
            `<tr>
                <td class="fw-input-list-item-cell">${html}</td>
                <td class="fw-input-field-list-ctrl">
                    <span class="fa fa-minus-circle" tabindex="0" role="button" aria-label="${gettext(
                        "Remove"
                    )}"></span>&nbsp;<span class="fa fa-plus-circle" tabindex="0" role="button" aria-label="${gettext(
                "Add"
            )}"></span>
                </td>
            </tr>`
        )
        const row = tbody.lastElementChild as HTMLElement
        const itemCell = row.querySelector(".fw-input-list-item-cell") as HTMLElement
        if (bind) {
            bind(itemCell, value, index)
        }

        const addItemEl = row.querySelector(".fa-plus-circle") as HTMLElement
        const removeItemEl = row.querySelector(".fa-minus-circle") as HTMLElement

        addItemEl.addEventListener("click", event => this.handlePlus(event, index))
        addItemEl.addEventListener("keydown", event =>
            this.handlePlus(event, index)
        )
        removeItemEl.addEventListener("click", event =>
            this.handleMinus(event, index)
        )
        removeItemEl.addEventListener("keydown", event =>
            this.handleMinus(event, index)
        )
    }

    private handlePlus(event: Event, index: number): void {
        if (!isActivationEvent(event)) {
            return
        }
        event.preventDefault()
        const focusIndex = getFocusIndex()
        const currentValues = this.readValues()
        currentValues.splice(index + 1, 0, this.options.emptyValue)
        this.values_ = currentValues
        this.render()
        setFocusIndex(focusIndex + 1)
        this.notifyChange()
    }

    private handleMinus(event: Event, index: number): void {
        if (!isActivationEvent(event)) {
            return
        }
        event.preventDefault()
        const focusIndex = getFocusIndex()
        const currentValues = this.readValues()
        currentValues.splice(index, 1)
        if (currentValues.length === 0) {
            currentValues.push(this.options.emptyValue)
        }
        this.values_ = currentValues
        this.render()
        setFocusIndex(Math.max(0, focusIndex - 1))
        this.notifyChange()
    }

    private readValues(): T[] {
        return this.listRows().map(row => {
            const itemCell = row.querySelector(".fw-input-list-item-cell") as HTMLElement
            return this.options.getValue(itemCell)
        })
    }

    private listRows(): HTMLElement[] {
        const tbody = this.dom.querySelector("tbody")
        if (!tbody) {
            return []
        }
        return Array.from(tbody.children) as HTMLElement[]
    }

    private notifyChange(): void {
        if (this.options.onChange) {
            this.options.onChange(this.readValues())
        }
    }
}
