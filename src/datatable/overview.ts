import {keyName} from "w3c-keyname"
import {DataTable} from "simple-datatables"

import {whenReady} from "../basic.js"
import {ContentMenuInit} from "../content_menu.js"
import {DatatableBulk} from "../datatable_bulk.js"

export interface OverviewDataTableOptions {
    /** Container element that will hold the table. */
    dom: HTMLElement
    /** Column definitions in simple-datatables format. */
    columns: Record<string, unknown>[]
    /** Table data in simple-datatables format. */
    data: Record<string, unknown>[] | unknown[][]
    /** Index of the hidden id column. Default: 0. */
    idColumn?: number
    /** Index of the boolean checkbox column. Default: 1. */
    checkboxColumn?: number
    /** Optional bulk-action menu. If provided, a bulk checkbox/dropdown is rendered. */
    bulkMenu?: ContentMenuInit
    /** Optional page object passed to the bulk menu's action callbacks. Defaults to an internal page object with `dom` and `getSelected`. */
    bulkMenuPage?: Record<string, unknown>
    /** Extra CSS classes for the table element. */
    classes?: string[]
    /** Vertical scrolling height, e.g. "calc(100vh - 200px)". */
    scrollY?: string | false
    /** Enable the built-in search field. */
    searchable?: boolean
    /** `tabindex` attribute for the table element. */
    tabIndex?: number
    /** Custom simple-datatables template function. */
    template?: (
        options: {classes: Record<string, string>; scrollY: string},
        dom: HTMLElement
    ) => string
    /** Explicit table headings. If omitted, headings are inferred from column definitions. */
    headings?: string[]
    /** Localisable labels. */
    labels?: {
        noRows?: string
        noResults?: string
        placeholder?: string
        searchTitle?: string
    }
    /** Extract an id from a data row. Defaults to reading the id column cell. */
    getId?: (row: {cells: {data: unknown; text?: string}[]}) => unknown
    /** Called when the user presses Enter on a row. */
    onEnter?: (row: {cells: {data: unknown; text?: string}[]}, event: KeyboardEvent) => void
    /** Called when the user presses Delete on a row. */
    onDelete?: (row: {cells: {data: unknown; text?: string}[]}, event: KeyboardEvent) => void
    /** Called whenever the checkbox selection changes. */
    onSelectionChange?: (selected: unknown[]) => void
    /** Optional rowRender hook. */
    rowRender?: (row: {cells: {data: unknown; text?: string}[]}, tr: unknown, index: number) => void
    /** Optional tableRender hook. */
    tableRender?: (data: unknown, table: unknown, type: string) => void
}

let idCounter = 0

export class OverviewDataTable {
    options: OverviewDataTableOptions
    dom: HTMLElement
    table: DataTable | undefined
    dtBulk: DatatableBulk | undefined
    lastSort: {column: number; dir: "asc" | "desc"}
    id: string

    constructor(options: OverviewDataTableOptions) {
        this.options = options
        this.dom = options.dom
        this.lastSort = {column: 0, dir: "asc"}
        this.id = `fw-overview-dt-${++idCounter}`
    }

    init(): void {
        const tableEl = document.createElement("table")
        tableEl.classList.add("fw-data-table")
        if (this.options.classes) {
            this.options.classes.forEach(cls => tableEl.classList.add(cls))
        }
        this.dom.appendChild(tableEl)

        const dtOptions: Record<string, unknown> = {
            paging: false,
            searchable: this.options.searchable ?? false,
            scrollY: this.options.scrollY || "",
            rowNavigation: true,
            rowSelectionKeys: ["Enter", "Delete", " "],
            labels: {
                noRows:
                    this.options.labels?.noRows || gettext("No entries found"),
                noResults:
                    this.options.labels?.noResults ||
                    gettext("No results match your search query"),
                placeholder:
                    this.options.labels?.placeholder || gettext("Search..."),
                searchTitle:
                    this.options.labels?.searchTitle ||
                    gettext("Search within table")
            },
            data: {
                headings: this.getHeadings(),
                data: this.options.data
            },
            columns: this.prepareColumns(),
            rowRender: (row: unknown, tr: unknown, index: number) => {
                this.renderCheckboxCell(
                    row as {cells: {data: unknown; text?: string}[]},
                    tr,
                    index
                )
                if (this.options.rowRender) {
                    this.options.rowRender(
                        row as {cells: {data: unknown; text?: string}[]},
                        tr,
                        index
                    )
                }
            },
            tableRender: (data: unknown, table: unknown, type: string) => {
                if (this.options.tableRender) {
                    this.options.tableRender(data, table, type)
                }
            },
            template: this.options.template
                ? (options: {classes: Record<string, string>; scrollY: string}, dom: HTMLElement) =>
                      this.options.template!(options, dom)
                : (options: {classes: Record<string, string>; scrollY: string}, dom: HTMLElement) =>
                      this.template(options, dom)
        }
        if (this.options.tabIndex !== undefined) {
            dtOptions.tabIndex = this.options.tabIndex
        }
        this.table = new DataTable(tableEl, dtOptions as unknown as Record<string, unknown>)

        this.table.on("datatable.sort", (column, dir) => {
            this.lastSort = {column, dir}
        })

        this.table.on("datatable.selectrow", (rowIndex, event) => {
            this.onSelectRow(rowIndex, event as KeyboardEvent)
        })

        if (this.options.bulkMenu) {
            const bulkPage = this.options.bulkMenuPage || {
                dom: this.dom,
                getSelected: () => this.getSelected()
            }
            this.dtBulk = new DatatableBulk(
                bulkPage as {dom: HTMLElement; getSelected: () => unknown[]},
                this.options.bulkMenu,
                this.options.checkboxColumn ?? 1,
                () => {
                    if (this.options.onSelectionChange) {
                        this.options.onSelectionChange(this.getSelected())
                    }
                }
            )
            this.dtBulk.init(this.table)
            this.insertBulkHeader()
        } else {
            // Without a bulk menu we still need clicks on row checkboxes to work.
            this.bindRowCheckboxClick()
        }

        whenReady().then(() => {
            this.applyLastSort()
        })
    }

    insertBulkHeader(): void {
        if (!this.table || !this.dtBulk) {
            return
        }
        const visibleIndex = this.checkboxVisibleIndex()
        const visibleThs = Array.from(
            this.table.dom.querySelectorAll("thead th")
        ).filter(th => {
            const htmlTh = th as HTMLTableCellElement
            return (
                !htmlTh.hidden &&
                !th.hasAttribute("hidden") &&
                htmlTh.style.display !== "none"
            )
        })
        const th = visibleThs[visibleIndex]
        if (th) {
            th.innerHTML = this.dtBulk.getHTML()
        }
    }

    getHeadings(): string[] {
        if (this.options.headings) {
            return this.options.headings
        }
        if (!this.options.columns) {
            return []
        }
        return this.options.columns.map(col =>
            String(col.title || col.name || "")
        )
    }

    prepareColumns(): Record<string, unknown>[] {
        const checkboxColumn = this.options.checkboxColumn ?? 1
        const columns = this.options.columns
            ? [...this.options.columns]
            : []
        const existing = columns.find(col => {
            const select = col.select
            return (
                select === checkboxColumn ||
                (Array.isArray(select) && select.includes(checkboxColumn))
            )
        })
        if (existing) {
            existing.sortable = false
            if (!existing.type) {
                existing.type = "boolean"
            }
        } else {
            columns.push({
                select: checkboxColumn,
                sortable: false,
                type: "boolean"
            })
        }
        return columns
    }

    checkboxVisibleIndex(): number {
        const checkboxColumn = this.options.checkboxColumn ?? 1
        if (!this.options.columns) {
            return checkboxColumn
        }
        return this.options.columns.filter(col => {
            const select = col.select
            return (
                typeof select === "number" &&
                select < checkboxColumn &&
                !col.hidden
            )
        }).length
    }

    renderCheckboxCell(
        row: {cells: {data: unknown; text?: string}[]},
        tr: unknown,
        index: number
    ): void {
        const checkboxColumn = this.options.checkboxColumn ?? 1
        const idColumn = this.options.idColumn ?? 0
        const id = String(row.cells[idColumn].text ?? row.cells[idColumn].data)
        const cell = row.cells[checkboxColumn]
        const checked = cell.data === true || cell.text === "true"
        const inputId = `${this.id}-row-${index}`
        const visibleIndex = this.checkboxVisibleIndex()
        const trNode = tr as {
            childNodes: {childNodes: Record<string, unknown>[];}[]
        }
        trNode.childNodes[visibleIndex].childNodes = [
            {
                nodeName: "input",
                attributes: {
                    type: "checkbox",
                    class: "entry-select fw-check",
                    "data-id": id,
                    id: inputId,
                    ...(checked ? {checked: ""} : {})
                }
            },
            {
                nodeName: "label",
                attributes: {
                    for: inputId
                }
            }
        ]
    }

    template(options: {classes: Record<string, string>; scrollY: string}, dom: HTMLElement): string {
        const searchHtml = this.options.searchable
            ? `<div class='${options.classes.top}'>
                <div class='${options.classes.search}'>
                    <input class='${options.classes.input}' placeholder='${gettext("Search...")}' type='search' title='${gettext("Search within table")}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
                </div>
            </div>`
            : ""
        return `${searchHtml}<div class='${options.classes.container}' style='height: ${options.scrollY}; overflow-Y: auto;'></div>`
    }

    onSelectRow(rowIndex: number, event: KeyboardEvent): void {
        if (!this.table) {
            return
        }
        const name = keyName(event)
        const row = this.table.data.data[rowIndex]
        if (!row) {
            return
        }

        if (name === "Enter" && this.options.onEnter) {
            event.preventDefault()
            this.options.onEnter(row, event)
        } else if (name === "Delete" && this.options.onDelete) {
            event.preventDefault()
            this.options.onDelete(row, event)
        } else if (name === " ") {
            event.preventDefault()
            this.toggleRowCheckbox(rowIndex)
        }
    }

    toggleRowCheckbox(rowIndex: number): void {
        if (!this.table) {
            return
        }
        const checkboxColumn = this.options.checkboxColumn ?? 1
        const cell = this.table.data.data[rowIndex].cells[checkboxColumn]
        if (!cell) {
            return
        }
        cell.data = !cell.data
        cell.text = String(cell.data)
        this.table.update()
        this.notifySelectionChange()
    }

    notifySelectionChange(): void {
        if (this.options.onSelectionChange) {
            this.options.onSelectionChange(this.getSelected())
        }
    }

    bindRowCheckboxClick(): void {
        if (!this.table) {
            return
        }
        this.table.dom.addEventListener("click", event => {
            const target = event.target as Element
            if (target.matches(".entry-select + label, .entry-select + label *")) {
                event.preventDefault()
                event.stopPropagation()
                const tr = target.closest("tr")
                if (tr && tr.dataset.index !== undefined) {
                    this.toggleRowCheckbox(parseInt(tr.dataset.index))
                }
            }
        })
    }

    getSelected(): unknown[] {
        if (!this.table) {
            return []
        }
        return Array.from(
            this.table.dom.querySelectorAll("input.entry-select[type=checkbox]")
        )
            .filter(box => (box as HTMLInputElement).checked)
            .map(box => (box as HTMLElement).dataset.id)
            .filter((id): id is string => id !== undefined)
    }

    update(data: Record<string, unknown>[] | unknown[][]): void {
        if (!this.table) {
            return
        }
        this.table.data.data = data as unknown as typeof this.table.data.data
        this.table.refresh()
        this.applyLastSort()
    }

    removeRows(ids: unknown[]): void {
        if (!this.table) {
            return
        }
        const idColumn = this.options.idColumn ?? 0
        this.table.data.data = this.table.data.data.filter(row => {
            const rowId = this.options.getId
                ? this.options.getId(row as {cells: {data: unknown; text?: string}[]})
                : row.cells[idColumn].text ?? row.cells[idColumn].data
            return !ids.map(id => String(id)).includes(String(rowId))
        }) as unknown as typeof this.table.data.data
        this.table.refresh()
        this.applyLastSort()
    }

    applyLastSort(): void {
        if (!this.table) {
            return
        }
        const {column, dir} = this.lastSort
        if (column !== undefined && dir) {
            this.table.columns.sort(column, dir)
        }
    }

    search(term: string): void {
        if (!this.table) {
            return
        }
        this.table.search(term)
    }

    destroy(): void {
        if (this.dtBulk) {
            this.dtBulk.destroy()
            this.dtBulk = undefined
        }
        if (this.table) {
            this.table.destroy()
            this.table = undefined
        }
    }
}
