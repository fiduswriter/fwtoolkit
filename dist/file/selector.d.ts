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
    constructor({ dom, files, showFiles, selectFolders, multiSelect, selectDir, selectFile, fileIcon }: FileSelectorOptions);
    init(): void;
    readDirStructure(): void;
    sortDirStructure(entries?: FileSelectorEntry[]): void;
    addFolder(rawName: string): void;
    deselectAll(): void;
    render(): void;
    renderFolder(folder: FileSelectorFolder, indentLevel?: number): string;
    findEntry(dom: Element): FileSelectorEntry;
    bind(): void;
}
//# sourceMappingURL=selector.d.ts.map