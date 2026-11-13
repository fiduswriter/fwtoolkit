import { DataTable } from "simple-datatables";
import { gettext } from "../settings.js";
let idCounter = 0;
export class SelectionDataTable {
    constructor(options) {
        this.options = options;
        this.dom = options.dom;
        this.selectedIds = new Set(options.selectedIds || []);
        const firstRow = options.data[0];
        if (firstRow === undefined) {
            this.checkmarkColumn = 0;
        }
        else if (Array.isArray(firstRow)) {
            this.checkmarkColumn = firstRow.length;
        }
        else {
            this.checkmarkColumn = firstRow.cells.length;
        }
        this.id = `fw-selection-dt-${++idCounter}`;
    }
    init() {
        const tableEl = document.createElement("table");
        tableEl.classList.add("fw-data-table");
        if (this.options.classes) {
            this.options.classes.forEach(cls => tableEl.classList.add(cls));
        }
        this.dom.appendChild(tableEl);
        const data = this.appendCheckmarkColumn(this.options.data);
        const columns = this.prepareColumns(data);
        const dtOptions = {
            paging: false,
            searchable: true,
            scrollY: this.options.scrollY || "",
            rowNavigation: true,
            rowSelectionKeys: ["Enter", " "],
            labels: {
                noRows: this.options.labels?.noRows || gettext("No entries found"),
                noResults: this.options.labels?.noResults ||
                    gettext("No results match your search query"),
                placeholder: this.options.labels?.placeholder || gettext("Search..."),
                searchTitle: this.options.labels?.searchTitle ||
                    gettext("Search within table")
            },
            data: {
                headings: this.getHeadings(),
                data
            },
            columns,
            template: this.options.template
                ? (options, dom) => this.options.template(options, dom)
                : (options, dom) => this.template(options, dom)
        };
        this.table = new DataTable(tableEl, dtOptions);
        this.table.on("datatable.selectrow", (rowIndex, event) => {
            event.preventDefault();
            this.toggleRow(rowIndex);
        });
    }
    getHeadings() {
        if (!this.options.columns) {
            return [""];
        }
        return [...this.options.columns.map(col => String(col.name || "")), ""];
    }
    appendCheckmarkColumn(data) {
        return data.map(row => {
            const cells = Array.isArray(row)
                ? row
                : row.cells;
            const newCells = [...cells, []];
            if (Array.isArray(row)) {
                return newCells;
            }
            return { ...row, cells: newCells };
        });
    }
    prepareColumns(initialData) {
        const idColumn = this.options.idColumn ?? 0;
        const columns = this.options.columns ? [...this.options.columns] : [];
        const idCol = columns.find(col => col.select === idColumn);
        if (idCol) {
            idCol.hidden = true;
        }
        else {
            columns.push({ select: idColumn, hidden: true });
        }
        columns.push({
            select: this.checkmarkColumn,
            sortable: false,
            render: (_cellData, _td, rowIndex) => this.checkmarkHTML(rowIndex, initialData)
        });
        return columns;
    }
    checkmarkHTML(rowIndex, initialData) {
        const rows = this.table
            ? this.table.data.data
            : initialData;
        const rawRow = rows[rowIndex];
        if (!rawRow) {
            return "";
        }
        const idColumn = this.options.idColumn ?? 0;
        const cells = Array.isArray(rawRow)
            ? rawRow
            : rawRow.cells;
        const cell = cells[idColumn];
        if (cell === undefined || cell === null) {
            return "";
        }
        const id = typeof cell === "object" && cell !== null
            ? (cell.text ??
                cell.data)
            : cell;
        const selected = this.selectedIds.has(id);
        return selected
            ? `<i class="${this.options.checkmarkClass || "fa fa-check"}"></i>`
            : "";
    }
    template(options, dom) {
        return `<div class='${options.classes.top}'>
                <div class='${options.classes.search}'>
                    <input class='${options.classes.input}' placeholder='${gettext("Search...")}' type='search' title='${gettext("Search within table")}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
                </div>
            </div>
            <div class='${options.classes.container}' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`;
    }
    getId(rowIndex) {
        if (!this.table) {
            return undefined;
        }
        const idColumn = this.options.idColumn ?? 0;
        const cell = this.table.data.data[rowIndex].cells[idColumn];
        return cell.text ?? cell.data;
    }
    toggleRow(rowIndex) {
        if (!this.table) {
            return;
        }
        const id = this.getId(rowIndex);
        if (id === undefined) {
            return;
        }
        if (this.options.multiple === false) {
            if (this.selectedIds.has(id)) {
                this.selectedIds.clear();
            }
            else {
                this.selectedIds.clear();
                this.selectedIds.add(id);
            }
        }
        else {
            if (this.selectedIds.has(id)) {
                this.selectedIds.delete(id);
            }
            else {
                this.selectedIds.add(id);
            }
        }
        this.table.refresh();
        if (this.options.onChange) {
            this.options.onChange(this.getSelected());
        }
    }
    getSelected() {
        return Array.from(this.selectedIds);
    }
    /**
     * Insert new rows at the end of the table.
     * The checkmark column is appended automatically.
     */
    insert({ data }) {
        if (!this.table) {
            return;
        }
        const newRows = this.appendCheckmarkColumn(data).map(row => {
            const cells = Array.isArray(row)
                ? row
                : row.cells;
            return {
                cells: cells.map(cell => {
                    if (cell &&
                        typeof cell === "object" &&
                        "data" in cell) {
                        return cell;
                    }
                    return {
                        data: cell,
                        text: typeof cell === "string" ? cell : String(cell)
                    };
                })
            };
        });
        this.table.data.data.push(...newRows);
        this.table.refresh();
    }
    selectAll() {
        if (!this.table) {
            return;
        }
        const idColumn = this.options.idColumn ?? 0;
        this.table.data.data.forEach(row => {
            const cell = row.cells[idColumn];
            this.selectedIds.add(cell.text ?? cell.data);
        });
        this.table.refresh();
        if (this.options.onChange) {
            this.options.onChange(this.getSelected());
        }
    }
    deselectAll() {
        this.selectedIds.clear();
        if (this.table) {
            this.table.refresh();
        }
        if (this.options.onChange) {
            this.options.onChange([]);
        }
    }
    destroy() {
        if (this.table) {
            this.table.destroy();
            this.table = undefined;
        }
    }
}
//# sourceMappingURL=selection.js.map