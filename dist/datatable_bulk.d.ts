import { ContentMenuInit } from "./content_menu.js";
export interface DataTableCell {
    data: unknown;
    text?: string;
}
export interface DataTableRow {
    cells: DataTableCell[];
}
export interface DataTableData {
    data: DataTableRow[];
}
export interface DataTable {
    dom: HTMLElement;
    data: DataTableData;
    update: () => void;
}
export interface DatatableBulkPage {
    dom: HTMLElement;
    getSelected: () => unknown[];
}
export declare class DatatableBulk {
    page: DatatableBulkPage;
    model: ContentMenuInit;
    checkboxColumn: number;
    onChange?: () => void;
    id: string;
    table: DataTable | undefined;
    boundOnClick: ((event: MouseEvent) => void) | undefined;
    boundOnTableCheckChange: ((event: Event) => void) | undefined;
    boundOnKeyDown: ((event: KeyboardEvent) => void) | undefined;
    constructor(page: DatatableBulkPage, model: ContentMenuInit, checkboxColumn: number, onChange?: () => void);
    init(table: DataTable): void;
    update(): void;
    bindEvents(): void;
    destroy(): void;
    onKeyDown(event: KeyboardEvent): void;
    toggleSelectAll(checked: boolean): void;
    onTableCheckChange(): void;
    isAllChecked(): boolean;
    onClick(event: MouseEvent): void;
    getHTML(): string;
}
//# sourceMappingURL=datatable_bulk.d.ts.map