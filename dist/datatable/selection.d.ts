import { DataTable } from "simple-datatables";
export interface SelectionDataTableOptions {
    /** Container element that will hold the table. */
    dom: HTMLElement;
    /** Column definitions in simple-datatables format. */
    columns: Record<string, unknown>[];
    /** Table data. The first cell of every row must contain the hidden id. */
    data: Record<string, unknown>[] | unknown[][];
    /** Index of the hidden id column. Default: 0. */
    idColumn?: number;
    /** Extra CSS classes for the table element. */
    classes?: string[];
    /** Vertical scrolling height. */
    scrollY?: string | false;
    /** Allow selecting more than one row. Default: true. */
    multiple?: boolean;
    /** Icon class for the checkmark. Default: "fa fa-check". */
    checkmarkClass?: string;
    /** Called whenever the selection changes. */
    onChange?: (selected: unknown[]) => void;
    /** Custom simple-datatables template function. */
    template?: (options: {
        classes: Record<string, string>;
    }, dom: HTMLElement) => string;
    /** Ids that should be selected when the table is first rendered. */
    selectedIds?: unknown[];
    /** Localisable labels. */
    labels?: {
        noRows?: string;
        noResults?: string;
        placeholder?: string;
        searchTitle?: string;
    };
}
export declare class SelectionDataTable {
    options: SelectionDataTableOptions;
    dom: HTMLElement;
    table: DataTable | undefined;
    selectedIds: Set<unknown>;
    checkmarkColumn: number;
    id: string;
    constructor(options: SelectionDataTableOptions);
    init(): void;
    getHeadings(): string[];
    appendCheckmarkColumn(data: Record<string, unknown>[] | unknown[][]): unknown[];
    prepareColumns(initialData: unknown[]): Record<string, unknown>[];
    checkmarkHTML(rowIndex: number, initialData?: unknown[]): string;
    template(options: {
        classes: Record<string, string>;
    }, dom: HTMLElement): string;
    getId(rowIndex: number): unknown;
    toggleRow(rowIndex: number): void;
    getSelected(): unknown[];
    /**
     * Insert new rows at the end of the table.
     * The checkmark column is appended automatically.
     */
    insert({ data }: {
        data: unknown[][];
    }): void;
    selectAll(): void;
    deselectAll(): void;
    destroy(): void;
}
//# sourceMappingURL=selection.d.ts.map