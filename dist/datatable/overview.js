import { keyName } from "w3c-keyname";
import { DataTable } from "simple-datatables";
import { whenReady } from "../basic.js";
import { gettext } from "../settings.js";
import { DatatableBulk } from "../datatable_bulk.js";
let idCounter = 0;
export class OverviewDataTable {
    constructor(options) {
        this.options = options;
        this.dom = options.dom;
        this.lastSort = { column: 0, dir: "asc" };
        this.id = `fw-overview-dt-${++idCounter}`;
    }
    init() {
        const tableEl = document.createElement("table");
        tableEl.classList.add("fw-data-table");
        if (this.options.classes) {
            this.options.classes.forEach(cls => tableEl.classList.add(cls));
        }
        this.dom.appendChild(tableEl);
        const dtOptions = {
            paging: false,
            searchable: this.options.searchable ?? false,
            scrollY: this.options.scrollY || "",
            rowNavigation: true,
            rowSelectionKeys: ["Enter", "Delete", " "],
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
                data: this.options.data
            },
            columns: this.prepareColumns(),
            rowRender: (row, tr, index) => {
                this.renderCheckboxCell(row, tr, index);
                if (this.options.rowRender) {
                    this.options.rowRender(row, tr, index);
                }
            },
            tableRender: (data, table, type) => {
                if (this.options.tableRender) {
                    this.options.tableRender(data, table, type);
                }
            },
            template: this.options.template
                ? (options, dom) => this.options.template(options, dom)
                : (options, dom) => this.template(options, dom)
        };
        if (this.options.tabIndex !== undefined) {
            dtOptions.tabIndex = this.options.tabIndex;
        }
        this.table = new DataTable(tableEl, dtOptions);
        this.table.on("datatable.sort", (column, dir) => {
            this.lastSort = { column, dir };
        });
        this.table.on("datatable.selectrow", (rowIndex, event) => {
            this.onSelectRow(rowIndex, event);
        });
        if (this.options.bulkMenu) {
            const bulkPage = this.options.bulkMenuPage || {
                dom: this.dom,
                getSelected: () => this.getSelected()
            };
            this.dtBulk = new DatatableBulk(bulkPage, this.options.bulkMenu, this.options.checkboxColumn ?? 1, () => {
                if (this.options.onSelectionChange) {
                    this.options.onSelectionChange(this.getSelected());
                }
            });
            this.dtBulk.init(this.table);
            this.insertBulkHeader();
        }
        else {
            // Without a bulk menu we still need clicks on row checkboxes to work.
            this.bindRowCheckboxClick();
        }
        whenReady().then(() => {
            this.applyLastSort();
        });
    }
    insertBulkHeader() {
        if (!this.table || !this.dtBulk) {
            return;
        }
        const visibleIndex = this.checkboxVisibleIndex();
        const visibleThs = Array.from(this.table.dom.querySelectorAll("thead th")).filter(th => {
            const htmlTh = th;
            return (!htmlTh.hidden &&
                !th.hasAttribute("hidden") &&
                htmlTh.style.display !== "none");
        });
        const th = visibleThs[visibleIndex];
        if (th) {
            th.innerHTML = this.dtBulk.getHTML();
        }
    }
    getHeadings() {
        if (this.options.headings) {
            return this.options.headings;
        }
        if (!this.options.columns) {
            return [];
        }
        return this.options.columns.map(col => String(col.title || col.name || ""));
    }
    prepareColumns() {
        const checkboxColumn = this.options.checkboxColumn ?? 1;
        const columns = this.options.columns ? [...this.options.columns] : [];
        const existing = columns.find(col => {
            const select = col.select;
            return (select === checkboxColumn ||
                (Array.isArray(select) && select.includes(checkboxColumn)));
        });
        if (existing) {
            existing.sortable = false;
            if (!existing.type) {
                existing.type = "boolean";
            }
        }
        else {
            columns.push({
                select: checkboxColumn,
                sortable: false,
                type: "boolean"
            });
        }
        return columns;
    }
    checkboxVisibleIndex() {
        const checkboxColumn = this.options.checkboxColumn ?? 1;
        if (!this.options.columns) {
            return checkboxColumn;
        }
        const hiddenColumns = new Set();
        this.options.columns.forEach(col => {
            if (!col.hidden) {
                return;
            }
            const select = col.select;
            if (typeof select === "number") {
                hiddenColumns.add(select);
            }
            else if (Array.isArray(select)) {
                select.forEach(index => hiddenColumns.add(index));
            }
        });
        return this.options.columns.filter(col => {
            const select = col.select;
            return (typeof select === "number" &&
                select < checkboxColumn &&
                !hiddenColumns.has(select));
        }).length;
    }
    renderCheckboxCell(row, tr, index) {
        const checkboxColumn = this.options.checkboxColumn ?? 1;
        const idColumn = this.options.idColumn ?? 0;
        const id = String(row.cells[idColumn].text ?? row.cells[idColumn].data);
        const cell = row.cells[checkboxColumn];
        const checked = cell.data === true || cell.text === "true";
        const inputId = `${this.id}-row-${index}`;
        const visibleIndex = this.checkboxVisibleIndex();
        const trNode = tr;
        trNode.childNodes[visibleIndex].childNodes = [
            {
                nodeName: "input",
                attributes: {
                    type: "checkbox",
                    class: "entry-select fw-check",
                    "data-id": id,
                    id: inputId,
                    ...(checked ? { checked: "" } : {})
                }
            },
            {
                nodeName: "label",
                attributes: {
                    for: inputId
                }
            }
        ];
    }
    template(options, dom) {
        const searchHtml = this.options.searchable
            ? `<div class='${options.classes.top}'>
                <div class='${options.classes.search}'>
                    <input class='${options.classes.input}' placeholder='${gettext("Search...")}' type='search' title='${gettext("Search within table")}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
                </div>
            </div>`
            : "";
        return `${searchHtml}<div class='${options.classes.container}' style='height: ${options.scrollY}; overflow-Y: auto;'></div>`;
    }
    onSelectRow(rowIndex, event) {
        if (!this.table) {
            return;
        }
        const name = keyName(event);
        const row = this.table.data.data[rowIndex];
        if (!row) {
            return;
        }
        if (name === "Enter" && this.options.onEnter) {
            event.preventDefault();
            this.options.onEnter(row, event);
        }
        else if (name === "Delete" && this.options.onDelete) {
            event.preventDefault();
            this.options.onDelete(row, event);
        }
        else if (name === " ") {
            event.preventDefault();
            this.toggleRowCheckbox(rowIndex);
        }
    }
    toggleRowCheckbox(rowIndex) {
        if (!this.table) {
            return;
        }
        const checkboxColumn = this.options.checkboxColumn ?? 1;
        const cell = this.table.data.data[rowIndex].cells[checkboxColumn];
        if (!cell) {
            return;
        }
        cell.data = !cell.data;
        cell.text = String(cell.data);
        this.table.update();
        this.notifySelectionChange();
    }
    notifySelectionChange() {
        if (this.options.onSelectionChange) {
            this.options.onSelectionChange(this.getSelected());
        }
    }
    bindRowCheckboxClick() {
        if (!this.table) {
            return;
        }
        this.table.dom.addEventListener("click", event => {
            const target = event.target;
            if (target.matches(".entry-select + label, .entry-select + label *")) {
                event.preventDefault();
                event.stopPropagation();
                const tr = target.closest("tr");
                if (tr && tr.dataset.index !== undefined) {
                    this.toggleRowCheckbox(parseInt(tr.dataset.index));
                }
            }
        });
    }
    getSelected() {
        if (!this.table) {
            return [];
        }
        return Array.from(this.table.dom.querySelectorAll("input.entry-select[type=checkbox]"))
            .filter(box => box.checked)
            .map(box => box.dataset.id)
            .filter((id) => id !== undefined);
    }
    update(data) {
        if (!this.table) {
            return;
        }
        this.table.data.data = data;
        this.table.refresh();
        this.applyLastSort();
    }
    /**
     * Insert new rows at the end of the table.
     * Accepts the same `{data: [...rows]}` shape as simple-datatables.
     */
    insert({ data }) {
        if (!this.table) {
            return;
        }
        const newRows = data.map(row => ({
            cells: row.map(cell => {
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
        }));
        this.table.data.data.push(...newRows);
        this.table.refresh();
        this.applyLastSort();
    }
    get rows() {
        return {
            remove: (indices) => {
                const table = this.table;
                if (!table) {
                    return;
                }
                const sorted = [...indices].sort((a, b) => b - a);
                sorted.forEach(index => {
                    table.data.data.splice(index, 1);
                });
                table.refresh();
                this.applyLastSort();
            }
        };
    }
    removeRows(ids) {
        if (!this.table) {
            return;
        }
        const idColumn = this.options.idColumn ?? 0;
        this.table.data.data = this.table.data.data.filter(row => {
            const rowId = this.options.getId
                ? this.options.getId(row)
                : (row.cells[idColumn].text ?? row.cells[idColumn].data);
            return !ids.map(id => String(id)).includes(String(rowId));
        });
        this.table.refresh();
        this.applyLastSort();
    }
    applyLastSort() {
        if (!this.table) {
            return;
        }
        const { column, dir } = this.lastSort;
        if (column !== undefined && dir) {
            this.table.columns.sort(column, dir);
        }
    }
    search(term) {
        if (!this.table) {
            return;
        }
        this.table.search(term);
    }
    destroy() {
        if (this.dtBulk) {
            this.dtBulk.destroy();
            this.dtBulk = undefined;
        }
        if (this.table) {
            this.table.destroy();
            this.table = undefined;
        }
    }
}
//# sourceMappingURL=overview.js.map