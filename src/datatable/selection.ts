import { DataTable } from "simple-datatables"
import { gettext } from "../settings.js"

export interface SelectionDataTableOptions {
    /** Container element that will hold the table. */
    dom: HTMLElement
    /** Column definitions in simple-datatables format. */
    columns: Record<string, unknown>[]
    /** Table data. The first cell of every row must contain the hidden id. */
    data: Record<string, unknown>[] | unknown[][]
    /** Index of the hidden id column. Default: 0. */
    idColumn?: number
    /** Extra CSS classes for the table element. */
    classes?: string[]
    /** Vertical scrolling height. */
    scrollY?: string | false
    /** Allow selecting more than one row. Default: true. */
    multiple?: boolean
    /** Icon class for the checkmark. Default: "fa fa-check". */
    checkmarkClass?: string
    /** Called whenever the selection changes. */
    onChange?: (selected: unknown[]) => void
    /** Custom simple-datatables template function. */
    template?: (
        options: { classes: Record<string, string> },
        dom: HTMLElement
    ) => string
    /** Ids that should be selected when the table is first rendered. */
    selectedIds?: unknown[]
    /** Localisable labels. */
    labels?: {
        noRows?: string
        noResults?: string
        placeholder?: string
        searchTitle?: string
    }
}

let idCounter = 0

export class SelectionDataTable {
    options: SelectionDataTableOptions
    dom: HTMLElement
    table: DataTable | undefined
    selectedIds: Set<unknown>
    checkmarkColumn: number
    id: string

    constructor(options: SelectionDataTableOptions) {
        this.options = options
        this.dom = options.dom
        this.selectedIds = new Set(options.selectedIds || [])
        const firstRow = options.data[0]
        if (firstRow === undefined) {
            this.checkmarkColumn = 0
        } else if (Array.isArray(firstRow)) {
            this.checkmarkColumn = firstRow.length
        } else {
            this.checkmarkColumn = (
                firstRow as { cells: unknown[] }
            ).cells.length
        }
        this.id = `fw-selection-dt-${++idCounter}`
    }

    init(): void {
        const tableEl = document.createElement("table")
        tableEl.classList.add("fw-data-table")
        if (this.options.classes) {
            this.options.classes.forEach(cls => tableEl.classList.add(cls))
        }
        this.dom.appendChild(tableEl)

        const data = this.appendCheckmarkColumn(this.options.data)
        const columns = this.prepareColumns(data)

        const dtOptions: Record<string, unknown> = {
            paging: false,
            searchable: true,
            scrollY: this.options.scrollY || "",
            rowNavigation: true,
            rowSelectionKeys: ["Enter", " "],
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
                data
            },
            columns,
            template: this.options.template
                ? (
                      options: { classes: Record<string, string> },
                      dom: HTMLElement
                  ) => this.options.template!(options, dom)
                : (
                      options: { classes: Record<string, string> },
                      dom: HTMLElement
                  ) => this.template(options, dom)
        }
        this.table = new DataTable(
            tableEl,
            dtOptions as unknown as Record<string, unknown>
        )

        this.table.on("datatable.selectrow", (rowIndex, event) => {
            event.preventDefault()
            this.toggleRow(rowIndex)
        })
    }

    getHeadings(): string[] {
        if (!this.options.columns) {
            return [""]
        }
        return [...this.options.columns.map(col => String(col.name || "")), ""]
    }

    appendCheckmarkColumn(
        data: Record<string, unknown>[] | unknown[][]
    ): unknown[] {
        return data.map(row => {
            const cells = Array.isArray(row)
                ? row
                : (row as { cells: unknown[] }).cells
            const newCells = [...cells, []]
            if (Array.isArray(row)) {
                return newCells
            }
            return { ...row, cells: newCells }
        })
    }

    prepareColumns(initialData: unknown[]): Record<string, unknown>[] {
        const idColumn = this.options.idColumn ?? 0
        const columns = this.options.columns ? [...this.options.columns] : []
        const idCol = columns.find(col => col.select === idColumn)
        if (idCol) {
            idCol.hidden = true
        } else {
            columns.push({ select: idColumn, hidden: true })
        }
        columns.push({
            select: this.checkmarkColumn,
            sortable: false,
            render: (_cellData: unknown, _td: unknown, rowIndex: number) =>
                this.checkmarkHTML(rowIndex, initialData)
        })
        return columns
    }

    checkmarkHTML(rowIndex: number, initialData?: unknown[]): string {
        const rows = this.table
            ? this.table.data.data
            : (initialData as unknown[])
        const rawRow = rows[rowIndex]
        if (!rawRow) {
            return ""
        }
        const idColumn = this.options.idColumn ?? 0
        const cells = Array.isArray(rawRow)
            ? rawRow
            : (rawRow as { cells: { data: unknown; text?: string }[] }).cells
        const cell = cells[idColumn]
        if (cell === undefined || cell === null) {
            return ""
        }
        const id =
            typeof cell === "object" && cell !== null
                ? ((cell as { text?: unknown; data?: unknown }).text ??
                  (cell as { text?: unknown; data?: unknown }).data)
                : cell
        const selected = this.selectedIds.has(id)
        return selected
            ? `<i class="${this.options.checkmarkClass || "fa fa-check"}"></i>`
            : ""
    }

    template(
        options: { classes: Record<string, string> },
        dom: HTMLElement
    ): string {
        return `<div class='${options.classes.top}'>
                <div class='${options.classes.search}'>
                    <input class='${options.classes.input}' placeholder='${gettext("Search...")}' type='search' title='${gettext("Search within table")}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
                </div>
            </div>
            <div class='${options.classes.container}' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`
    }

    getId(rowIndex: number): unknown {
        if (!this.table) {
            return undefined
        }
        const idColumn = this.options.idColumn ?? 0
        const cell = this.table.data.data[rowIndex].cells[idColumn]
        return cell.text ?? cell.data
    }

    toggleRow(rowIndex: number): void {
        if (!this.table) {
            return
        }
        const id = this.getId(rowIndex)
        if (id === undefined) {
            return
        }

        if (this.options.multiple === false) {
            if (this.selectedIds.has(id)) {
                this.selectedIds.clear()
            } else {
                this.selectedIds.clear()
                this.selectedIds.add(id)
            }
        } else {
            if (this.selectedIds.has(id)) {
                this.selectedIds.delete(id)
            } else {
                this.selectedIds.add(id)
            }
        }

        this.table.refresh()
        if (this.options.onChange) {
            this.options.onChange(this.getSelected())
        }
    }

    getSelected(): unknown[] {
        return Array.from(this.selectedIds)
    }

    /**
     * Insert new rows at the end of the table.
     * The checkmark column is appended automatically.
     */
    insert({ data }: { data: unknown[][] }): void {
        if (!this.table) {
            return
        }
        const newRows = this.appendCheckmarkColumn(data).map(row => {
            const cells = Array.isArray(row)
                ? row
                : (row as { cells: unknown[] }).cells
            return {
                cells: cells.map(cell => {
                    if (
                        cell &&
                        typeof cell === "object" &&
                        "data" in (cell as Record<string, unknown>)
                    ) {
                        return cell as { data: unknown; text?: string }
                    }
                    return {
                        data: cell,
                        text: typeof cell === "string" ? cell : String(cell)
                    }
                })
            }
        })
        this.table.data.data.push(
            ...(newRows as unknown as typeof this.table.data.data)
        )
        this.table.refresh()
    }

    selectAll(): void {
        if (!this.table) {
            return
        }
        const idColumn = this.options.idColumn ?? 0
        this.table.data.data.forEach(row => {
            const cell = row.cells[idColumn]
            this.selectedIds.add(cell.text ?? cell.data)
        })
        this.table.refresh()
        if (this.options.onChange) {
            this.options.onChange(this.getSelected())
        }
    }

    deselectAll(): void {
        this.selectedIds.clear()
        if (this.table) {
            this.table.refresh()
        }
        if (this.options.onChange) {
            this.options.onChange([])
        }
    }

    destroy(): void {
        if (this.table) {
            this.table.destroy()
            this.table = undefined
        }
    }
}
