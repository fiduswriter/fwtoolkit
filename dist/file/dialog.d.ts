import { Dialog } from "../dialog.js";
import { FileSelector } from "./selector.js";
export interface MovingFile {
    id: number;
    title: string;
    path: string;
    [key: string]: unknown;
}
export interface FileDialogOptions {
    title?: string;
    movingFiles?: MovingFile[];
    allFiles?: import("./selector.js").FileDescriptor[];
    moveUrl?: string;
    successMessage?: string;
    errorMessage?: string;
    succcessCallback?: (file: MovingFile, path: string) => void;
    fileIcon?: string;
}
/**
 * Functions for the document move dialog.
 */
export declare class FileDialog {
    title: string;
    movingFiles: MovingFile[];
    allFiles: import("./selector.js").FileDescriptor[];
    moveUrl: string;
    successMessage: string;
    errorMessage: string;
    succcessCallback: (file: MovingFile, path: string) => void;
    fileIcon: string;
    path: string;
    dialog: Dialog;
    fileSelector: FileSelector | false;
    constructor({ title, // Dialog title
    movingFiles, // Array of all files that are to be moved.
    allFiles, // Array of all existing files.
    moveUrl, // URL to use for moving files
    successMessage, // Message for success
    errorMessage, // Message for failure
    succcessCallback, // Callback on success
    fileIcon }?: FileDialogOptions);
    getPath(): string;
    updatePathDir(path: string): void;
    init(): void;
    moveFile(file: MovingFile, requestedPath: string): Promise<void>;
}
//# sourceMappingURL=dialog.d.ts.map