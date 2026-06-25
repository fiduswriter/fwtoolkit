import {keyName} from "w3c-keyname"

import {whenReady} from "./basic.js"
import {ContentMenu, ContentMenuInit} from "./content_menu.js"

export interface DataTableCell {
    data: unknown
    text: string
}

export interface DataTableRow {
    cells: DataTableCell[]
}

export interface DataTableData {
    data: DataTableRow[]
}

export interface DataTable {
    dom: HTMLElement
    data: DataTableData
    update: () => void
}

export interface DatatableBulkPage {
    dom: HTMLElement
    getSelected: () => unknown[]
}

let bulkId = 0

export class DatatableBulk {
    page: DatatableBulkPage
    model: ContentMenuInit
    checkboxColumn: number

    id: string
    table: DataTable | undefined
    boundOnClick: ((event: MouseEvent) => void) | undefined
    boundOnTableCheckChange: ((event: Event) => void) | undefined
    boundOnKeyDown: ((event: KeyboardEvent) => void) | undefined

    constructor(
        page: DatatableBulkPage,
        model: ContentMenuInit,
        checkboxColumn: number
    ) {
        this.page = page
        this.model = model
        this.checkboxColumn = checkboxColumn

        this.id = `dt-bulk-${++bulkId}`
    }

    init(table: DataTable): void {
        this.table = table
        whenReady().then(() => this.bindEvents())
    }

    update(): void {
        this.model.content = this.model.content.sort(
            (a, b) => (a.order || 0) - (b.order || 0)
        )
    }

    bindEvents(): void {
        // Store the bound functions as instance variables so we can remove them later
        this.boundOnClick = this.onClick.bind(this)
        this.boundOnTableCheckChange = this.onTableCheckChange.bind(this)
        this.boundOnKeyDown = this.onKeyDown.bind(this)

        this.page.dom.addEventListener("click", this.boundOnClick)
        this.table!.dom.addEventListener("change", this.boundOnTableCheckChange)
        this.table!.dom.addEventListener("keydown", this.boundOnKeyDown)
        this.onTableCheckChange()
    }

    // The new destroy() method removes all event listeners that were added and cleans up DOM elements.
    destroy(): void {
        if (this.page && this.page.dom && this.boundOnClick) {
            this.page.dom.removeEventListener("click", this.boundOnClick)
        }
        if (this.table && this.table.dom) {
            if (this.boundOnTableCheckChange) {
                this.table.dom.removeEventListener(
                    "change",
                    this.boundOnTableCheckChange
                )
            }
            if (this.boundOnKeyDown) {
                this.table.dom.removeEventListener(
                    "keydown",
                    this.boundOnKeyDown
                )
            }
        }

        // Remove the bulk element from the DOM if it exists
        const el = document.getElementById(this.id)
        if (el && el.parentNode) {
            el.parentNode.removeChild(el)
        }

        // Clear any references to help garbage collection
        this.page = null as unknown as DatatableBulkPage
        this.table = undefined
        this.model = {content: []}
    }

    onKeyDown(event: KeyboardEvent): void {
        const key = keyName(event)
        const el = this.page.dom.querySelector(`#${this.id}`)

        if (!el) {
            return
        }

        if (key === "Enter" && this.page.getSelected().length > 0) {
            // Open the content menu when Enter is pressed and at least one row is selected
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()

            const contentMenu = new ContentMenu({
                menu: this.model,
                width: 280,
                page: this.page,
                menuPos: {
                    X: Number.parseInt(el.getBoundingClientRect().left as unknown as string),
                    Y: Number.parseInt(el.getBoundingClientRect().bottom as unknown as string)
                }
            })
            contentMenu.open()
        } else if (
            key === " " &&
            event.target === el.querySelector("input[type=checkbox]")
        ) {
            // Toggle "Select All" when Space is pressed on the checkbox
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()

            const isChecked = this.isAllChecked()
            this.toggleSelectAll(!isChecked)
        } else if ((event.ctrlKey || event.metaKey) && key === "a") {
            // Select all when Ctrl+A is pressed
            const isChecked = this.isAllChecked()
            this.toggleSelectAll(!isChecked)
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
        }
    }

    toggleSelectAll(checked: boolean): void {
        // Update the DataTable instance
        if (this.table) {
            this.table.data.data.forEach(row => {
                if (row.cells[this.checkboxColumn]) {
                    row.cells[this.checkboxColumn].data = checked
                    row.cells[this.checkboxColumn].text = String(checked)
                }
            })
            this.table.update()
        }

        this.onTableCheckChange()
    }

    onTableCheckChange(): void {
        const el = this.page.dom.querySelector(`#${this.id}`)
        if (!el) {
            return
        }

        const allChecked = this.isAllChecked()
        ;(el.querySelector("input[type=checkbox]") as HTMLInputElement).checked = allChecked
    }

    isAllChecked(): boolean {
        const checkboxes = Array.from(
            this.table!.dom.querySelectorAll("input.entry-select[type=checkbox]")
        )
        const unchecked = checkboxes.filter(box => !(box as HTMLInputElement).checked)
        return !unchecked.length && checkboxes.length > 0
    }

    onClick(event: MouseEvent): void {
        const target = event.target as Element
        if (target.matches(`#${this.id} *`)) {
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()

            if (target.matches(".fw-dt-bulk-dropdown, .fw-dt-bulk-dropdown *")) {
                // Dropdown
                const el = document.querySelector(`#${this.id}`)
                if (el) {
                    const contentMenu = new ContentMenu({
                        menu: this.model,
                        width: 280,
                        page: this.page,
                        menuPos: {
                            X: Number.parseInt(event.pageX as unknown as string),
                            Y: Number.parseInt(event.pageY as unknown as string)
                        }
                    })
                    contentMenu.open()
                }
            } else if (
                target.matches(".fw-check + label, .fw-check + label *")
            ) {
                // Click on bulk checkbox
                const isChecked = this.isAllChecked()
                this.toggleSelectAll(!isChecked)
                ;(target
                    .closest("div.datatable-wrapper")!
                    .querySelector("input[type=checkbox]") as HTMLInputElement).checked = !isChecked
                this.onTableCheckChange()
            }
        } else if (target.matches(".fw-data-table .entry-select + label")) {
            // The browser will try to scroll the checkbox into view and that will break the page layout.
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
            const tr = target.closest("tr") as HTMLTableRowElement
            const index = parseInt(tr.dataset.index!)
            const row = this.table!.data.data[index]
            const cell = row.cells[this.checkboxColumn]
            cell.data = !cell.data
            cell.text = String(cell.data)
            this.table!.update()
            this.onTableCheckChange()
        }
    }

    getHTML(): string {
        return `<div id="${this.id}" class="fw-dt-bulk" role="group" aria-label="Bulk actions">
                        <input type="checkbox" id="${this.id}_check" class="fw-check" aria-label="Select all">
                        <label for="${this.id}_check"></label>
                        <span class="fw-dt-bulk-dropdown" tabindex="0" role="button" aria-label="Open bulk actions menu">
                            <i class="fa fa-caret-down"></i>
                        </span>
                    </div>`
    }
}
