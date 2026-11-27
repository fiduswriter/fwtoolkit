export interface FileDescriptor {
    id?: number;
    title?: string;
    path: string;
    [key: string]: unknown;
}
export interface FileSelectorFolder {
    name: string;
    type: "folder";
    open: boolean;
    selected: boolean;
    path: string;
    children: FileSelectorEntry[];
}
export interface FileSelectorFile {
    name: string;
    type: "file";
    path: string;
    selected?: boolean;
    file: FileDescriptor;
}
export type FileSelectorEntry = FileSelectorFolder | FileSelectorFile;
export interface FileSelectorOptions {
    dom: HTMLElement;
    files: FileDescriptor[];
    showFiles?: boolean;
    selectFolders?: boolean;
    multiSelect?: boolean;
    selectDir?: (path: string) => void;
    selectFile?: (path: string) => void;
    fileIcon?: string;
}
interface ColumnState {
    /** The folder whose contents this column lists. */
    folder: FileSelectorFolder;
    /** The entry with the roving tabindex inside this column. */
    active: FileSelectorEntry | null;
    /** Autoscroll target for the roving focus, consumed on next render. */
    focusActive?: boolean;
}
/**
 * macOS-Finder-style "column view" file browser.
 *
 * A column is rendered for every folder along the current path, from the root
 * to the deepest opened folder. Selecting a folder opens its contents in the
 * next column to the right; selecting a file reports the file. The column
 * strip scrolls horizontally as the user descends.
 *
 * All selection state is kept in the folder tree (`this.root`), so existing
 * callers that call `addFolder()`/`deselectAll()` keep working unchanged. The
 * widget implements `role="tree"` with roving tabindex and Finder-like
 * keyboard navigation (arrows, Home/End, Enter/Space, type-ahead).
 */
export declare class FileSelector {
    dom: HTMLElement;
    files: FileDescriptor[];
    showFiles: boolean;
    selectFolders: boolean;
    multiSelect: boolean;
    selectDir: (path: string) => void;
    selectFile: (path: string) => void;
    fileIcon: string;
    root: FileSelectorFolder;
    selected: FileSelectorEntry[];
    /** Path of the deepest opened folder ("/" for the root). */
    currentPath: string;
    columns: ColumnState[];
    typeAhead: string;
    typeAheadTimer: ReturnType<typeof setTimeout> | null;
    bound: boolean;
    constructor({ dom, files, showFiles, selectFolders, multiSelect, selectDir, selectFile, fileIcon }: FileSelectorOptions);
    init(): void;
    readDirStructure(): void;
    sortDirStructure(entries?: FileSelectorEntry[]): void;
    addFolder(rawName: string): void;
    deselectAll(): void;
    /**
     * Resolve a folder from its path, or `null` when the path is unknown.
     */
    findFolderByPath(path: string): FileSelectorFolder | null;
    /** Path chain from the root to `path` (inclusive). */
    pathChain(path: string): FileSelectorFolder[];
    /**
     * Build the column list from the currently opened path. A column is added
     * for every folder along the chain plus one final column listing the
     * deepest opened folder's contents.
     */
    buildColumns(): void;
    render(): void;
    /** The DOM row element for a column's active entry. */
    rowElement(column: ColumnState): HTMLElement | null;
    /** Scroll a row into view, horizontally for its column strip. */
    ensureVisible(element: HTMLElement): void;
    renderBreadcrumb(): string;
    renderColumns(): string;
    renderColumn(column: ColumnState): string;
    renderRow(entry: FileSelectorEntry, column: ColumnState): string;
    /** The column whose folder directly contains `entry`. */
    columnContaining(entry: FileSelectorEntry): ColumnState | null;
    focusColumn(column: ColumnState | null): void;
    /** Select (and, for folders, open) an entry. */
    selectEntry(entry: FileSelectorEntry): void;
    openFolder(folder: FileSelectorFolder): void;
    /** Collapse every folder below `folder` and make it the current one. */
    closePathTo(folder: FileSelectorFolder): void;
    toggleFolder(folder: FileSelectorFolder): void;
    findParent(entry: FileSelectorEntry): FileSelectorFolder | null;
    moveWithinColumn(column: ColumnState, delta: number): boolean;
    goToColumn(offset: number, sourceColumn?: ColumnState): boolean;
    handleTypeAhead(key: string, column: ColumnState): boolean;
    onKeydown(event: KeyboardEvent): void;
    onFocus(event: FocusEvent): void;
    bind(): void;
    entryFromRow(row: HTMLElement): FileSelectorEntry | null;
    /**
     * Locate the entry for a DOM node. Retained for backwards compatibility
     * with earlier versions that exposed tree-based lookup.
     */
    findEntry(dom: Element): FileSelectorEntry;
}
export {};
//# sourceMappingURL=selector.d.ts.map