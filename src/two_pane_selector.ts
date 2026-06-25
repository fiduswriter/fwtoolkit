import {ensureCSS} from "./network.js"
import {escapeText} from "./basic.js"

export interface TwoPaneSelectorOptions<T> {
    dom: HTMLElement
    availableItems: T[]
    selectedItems?: T[]
    renderItem: (item: T) => string
    getItemId: (item: T) => string
    addButtonTitle?: string
    removeButtonTitle?: string
    leftTitle?: string
    rightTitle?: string
    multiple?: boolean
    onChange?: (selected: T[]) => void
}

/**
 * Generic two-pane add/remove selector.
 *
 * The left pane lists available items, the right pane lists selected items.
 * Items in the left pane can be selected and moved to the right pane with the
 * add button. If `removeButtonTitle` is provided, selected right-pane items can
 * be moved back.
 */
export class TwoPaneSelector<T> {
    dom: HTMLElement
    options: TwoPaneSelectorOptions<T>
    private available: T[]
    private selected: T[]

    constructor(options: TwoPaneSelectorOptions<T>) {
        this.options = options
        this.dom = options.dom
        this.available = options.availableItems.slice()
        this.selected = options.selectedItems?.slice() || []
        ensureCSS(staticUrl("css/two_pane_selector.css"))
        this.render()
    }

    get selectedItems(): T[] {
        return this.selected.slice()
    }

    /**
     * Update the available items and re-render the left pane.
     */
    setAvailableItems(items: T[]): void {
        this.available = items.slice()
        this.renderPane("left", this.available)
    }

    private render(): void {
        const {leftTitle, rightTitle, addButtonTitle, removeButtonTitle} =
            this.options
        this.dom.innerHTML = `<div class="fw-two-pane-selector">
            <div class="fw-ar-container fw-two-pane-left">
                ${leftTitle ? `<h3 class="fw-green-title">${escapeText(leftTitle)}</h3>` : ""}
                <div class="fw-two-pane-list" data-pane="left"></div>
            </div>
            <div class="fw-two-pane-controls">
                <button class="fw-button fw-large fw-square fw-light fw-ar-button fw-two-pane-add" title="${escapeText(addButtonTitle || gettext("Add"))}">
                    <i class="fa-solid fa-caret-right"></i>
                </button>
                ${removeButtonTitle ? `<button class="fw-button fw-large fw-square fw-light fw-ar-button fw-two-pane-remove" title="${escapeText(removeButtonTitle)}">
                    <i class="fa-solid fa-caret-left"></i>
                </button>` : ""}
            </div>
            <div class="fw-ar-container fw-two-pane-right">
                ${rightTitle ? `<h3 class="fw-green-title">${escapeText(rightTitle)}</h3>` : ""}
                <div class="fw-two-pane-list" data-pane="right"></div>
            </div>
        </div>`

        this.renderPane("left", this.available)
        this.renderPane("right", this.selected)

        const addButton = this.dom.querySelector(".fw-two-pane-add")
        if (addButton) {
            addButton.addEventListener("click", () => this.handleAdd())
        }
        const removeButton = this.dom.querySelector(".fw-two-pane-remove")
        if (removeButton) {
            removeButton.addEventListener("click", () => this.handleRemove())
        }
    }

    private renderPane(side: "left" | "right", items: T[]): void {
        const list = this.dom.querySelector(
            `.fw-two-pane-list[data-pane="${side}"]`
        ) as HTMLElement
        list.innerHTML = items
            .map(
                item =>
                    `<div class="fw-two-pane-item" data-id="${escapeText(
                        this.options.getItemId(item)
                    )}">${this.options.renderItem(item)}</div>`
            )
            .join("")

        list.querySelectorAll(".fw-two-pane-item").forEach(el => {
            el.addEventListener("click", event => this.handleItemClick(event))
        })
    }

    private handleItemClick(event: Event): void {
        const target = event.currentTarget as HTMLElement
        const pane = target.closest(".fw-two-pane-list") as HTMLElement
        const side = pane.dataset.pane as "left" | "right"

        if (side === "right" && !this.options.removeButtonTitle) {
            // Right pane is read-only for removal unless a remove button is
            // configured.
            return
        }

        if (!this.options.multiple && side === "left") {
            pane
                .querySelectorAll(".fw-two-pane-item.fw-selected")
                .forEach(el => el.classList.remove("fw-selected"))
        }
        target.classList.toggle("fw-selected")
    }

    private handleAdd(): void {
        const leftPane = this.dom.querySelector(
            '.fw-two-pane-list[data-pane="left"]'
        ) as HTMLElement
        const selectedIds = new Set(
            Array.from(leftPane.querySelectorAll(".fw-two-pane-item.fw-selected")).map(
                el => (el as HTMLElement).dataset.id as string
            )
        )
        if (!selectedIds.size) {
            return
        }
        const moved: T[] = []
        this.available = this.available.filter(item => {
            if (selectedIds.has(this.options.getItemId(item))) {
                moved.push(item)
                return false
            }
            return true
        })
        this.selected.push(...moved)
        this.renderPane("left", this.available)
        this.renderPane("right", this.selected)
        this.notifyChange()
    }

    private handleRemove(): void {
        const rightPane = this.dom.querySelector(
            '.fw-two-pane-list[data-pane="right"]'
        ) as HTMLElement
        const selectedIds = new Set(
            Array.from(
                rightPane.querySelectorAll(".fw-two-pane-item.fw-selected")
            ).map(el => (el as HTMLElement).dataset.id as string)
        )
        if (!selectedIds.size) {
            return
        }
        const moved: T[] = []
        this.selected = this.selected.filter(item => {
            if (selectedIds.has(this.options.getItemId(item))) {
                moved.push(item)
                return false
            }
            return true
        })
        this.available.push(...moved)
        this.renderPane("right", this.selected)
        this.renderPane("left", this.available)
        this.notifyChange()
    }

    private notifyChange(): void {
        if (this.options.onChange) {
            this.options.onChange(this.selected.slice())
        }
    }
}
