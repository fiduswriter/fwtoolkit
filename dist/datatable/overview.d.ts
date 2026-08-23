import { DataTable } from "simple-datatables";
import { ContentMenuInit } from "../content_menu.js";
import { DatatableBulk } from "../datatable_bulk.js";
export interface OverviewDataTableOptions {
    /** Container element that will hold the table. */
    dom: HTMLElement;
    /** Column definitions in simple-datatables format. */
    columns: Record<string, unknown>[];
    /** Table data in simple-datatables format. */
    data: Record<string, unknown>[] | unknown[][];
    /** Index of the hidden id column. Default: 0. */
    idColumn?: number;
    /** Index of the boolean checkbox column. Default: 1. */
    checkboxColumn?: number;
    /** Optional bulk-action menu. If provided, a bulk checkbox/dropdown is rendered. */
    bulkMenu?: ContentMenuInit;
    /** Optional page object passed to the bulk menu's action callbacks. Defaults to an internal page object with `dom` and `getSelected`. */
    bulkMenuPage?: Record<string, unknown>;
    /** Extra CSS classes for the table element. */
    classes?: string[];
    /** Vertical scrolling height, e.g. "calc(100vh - 200px)". */
    scrollY?: string | false;
    /** Enable the built-in search field. */
    searchable?: boolean;
    /** `tabindex` attribute for the table element. */
    tabIndex?: number;
    /** Custom simple-datatables template function. */
    template?: (options: {
        classes: Record<string, string>;
        scrollY: string;
    }, dom: HTMLElement) => string;
    /** Explicit table headings. If omitted, headings are inferred from column definitions. */
    headings?: string[];
    /** Localisable labels. */
    labels?: {
        noRows?: string;
        noResults?: string;
        placeholder?: string;
        searchTitle?: string;
    };
    /** Extract an id from a data row. Defaults to reading the id column cell. */
    getId?: (row: {
        cells: {
            data: unknown;
            text?: string;
        }[];
    }) => unknown;
    /** Called when the user presses Enter on a row. */
    onEnter?: (row: {
        cells: {
            data: unknown;
            text?: string;
        }[];
    }, event: KeyboardEvent) => void;
    /** Called when the user presses Delete on a row. */
    onDelete?: (row: {
        cells: {
            data: unknown;
            text?: string;
        }[];
    }, event: KeyboardEvent) => void;
    /** Called whenever the checkbox selection changes. */
    onSelectionChange?: (selected: unknown[]) => void;
    /** Optional rowRender hook. */
    rowRender?: (row: {
        cells: {
            data: unknown;
            text?: string;
        }[];
    }, tr: unknown, index: number) => void;
    /** Optional tableRender hook. */
    tableRender?: (data: unknown, table: unknown, type: string) => void;
}
export declare class OverviewDataTable {
    options: OverviewDataTableOptions;
    dom: HTMLElement;
    table: DataTable | undefined;
    dtBulk: DatatableBulk | undefined;
    lastSort: {
        column: number;
        dir: "asc" | "desc";
    };
    id: string;
    constructor(options: OverviewDataTableOptions);
    init(): void;
    insertBulkHeader(): void;
    getHeadings(): string[];
    prepareColumns(): Record<string, unknown>[];
    checkboxVisibleIndex(): number;
    renderCheckboxCell(row: {
        cells: {
            data: unknown;
            text?: string;
        }[];
    }, tr: unknown, index: number): void;
    template(options: {
        classes: Record<string, string>;
        scrollY: string;
    }, dom: HTMLElement): string;
    onSelectRow(rowIndex: number, event: KeyboardEvent): void;
    toggleRowCheckbox(rowIndex: number): void;
    notifySelectionChange(): void;
    bindRowCheckboxClick(): void;
    getSelected(): unknown[];
    update(data: Record<string, unknown>[] | unknown[][]): void;
    /**
     * Insert new rows at the end of the table.
     * Accepts the same `{data: [...rows]}` shape as simple-datatables.
     */
    insert({ data }: {
        data: unknown[][];
    }): void;
    get rows(): {
        remove: (indices: number[]) => void;
    };
    removeRows(ids: unknown[]): void;
    applyLastSort(): void;
    search(term: string): void;
    destroy(): void;
}
//# sourceMappingURL=overview.d.ts.map