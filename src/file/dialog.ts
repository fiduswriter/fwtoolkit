import { Dialog } from "../dialog.js"
import { gettext } from "../settings.js"
import { FileSelector } from "./selector.js"
import { addAlert } from "../basic.js"
import { NewFolderDialog } from "./new_folder_dialog.js"
import { moveTemplate } from "./templates.js"
import { moveFile, shortFileTitle } from "./tools.js"

export interface MovingFile {
    id: number
    title: string
    path: string
    [key: string]: unknown
}

export interface FileDialogOptions {
    title?: string
    movingFiles?: MovingFile[]
    allFiles?: import("./selector.js").FileDescriptor[]
    moveUrl?: string
    successMessage?: string
    errorMessage?: string
    succcessCallback?: (file: MovingFile, path: string) => void
    fileIcon?: string
}

/**
 * Functions for the document move dialog.
 */

export class FileDialog {
    title: string
    movingFiles: MovingFile[]
    allFiles: import("./selector.js").FileDescriptor[]
    moveUrl: string
    successMessage: string
    errorMessage: string
    succcessCallback: (file: MovingFile, path: string) => void
    fileIcon: string

    path: string
    dialog: Dialog
    fileSelector: FileSelector | false

    constructor({
        title = "", // Dialog title
        movingFiles = [], // Array of all files that are to be moved.
        allFiles = [], // Array of all existing files.
        moveUrl = "", // URL to use for moving files
        successMessage = "", // Message for success
        errorMessage = "", // Message for failure
        succcessCallback = () => {}, // Callback on success
        fileIcon = "far fa-file-alt"
    }: FileDialogOptions = {}) {
        this.title = title
        this.movingFiles = movingFiles
        this.allFiles = allFiles
        this.moveUrl = moveUrl
        this.successMessage = successMessage
        this.errorMessage = errorMessage
        this.succcessCallback = succcessCallback
        this.fileIcon = fileIcon

        this.path = this.getPath()
        this.fileSelector = false
        this.dialog = new Dialog({ body: "" }) // placeholder, replaced in init()
    }

    getPath(): string {
        if (this.movingFiles.length === 1) {
            let path = this.movingFiles[0].path
            if (path.endsWith("/")) {
                path +=
                    this.movingFiles[0].title.replace(/\//g, "") ||
                    gettext("Untitled")
            }
            return path
        }
        // We are moving several files. We assume they are all in the same directory
        // so we only need to take the file of the first file.
        return this.movingFiles[0].path.split("/").slice(0, -1).join("/") + "/"
    }

    updatePathDir(path: string): void {
        const pathInput = this.dialog.dialogEl!.querySelector(
            "#path"
        ) as HTMLInputElement
        const fileName = pathInput.value.split("/").pop() || ""
        pathInput.value = path + fileName
    }

    init(): void {
        this.dialog = new Dialog({
            title: this.title,
            id: "move-dialog",
            width: 820,
            height: 440,
            body: moveTemplate({
                path: this.path
            }),
            buttons: [
                {
                    text: gettext("New folder"),
                    classes: "fw-dark",
                    click: () => {
                        const dialog = new NewFolderDialog(folderName => {
                            if (!this.fileSelector) {
                                return
                            }
                            this.fileSelector.addFolder(folderName)
                        })
                        dialog.open()
                    }
                },
                { type: "cancel" },
                {
                    text: gettext("Submit"),
                    classes: "fw-dark",
                    click: () => {
                        //apply the current state to server
                        let path = (
                            this.dialog.dialogEl!.querySelector(
                                "#path"
                            ) as HTMLInputElement
                        ).value
                        this.dialog.close()

                        if (path === this.path) {
                            // No change
                            return
                        }
                        if (this.movingFiles.length > 1) {
                            if (!path.endsWith("/")) {
                                path += "/"
                            }
                            this.movingFiles.forEach(doc => {
                                this.moveFile(
                                    doc,
                                    doc.path.endsWith("/")
                                        ? path
                                        : path + doc.path.split("/").pop()
                                )
                            })
                        } else {
                            this.moveFile(this.movingFiles[0], path)
                        }
                    }
                }
            ]
        })
        this.dialog.open()

        this.fileSelector = new FileSelector({
            dom: this.dialog.dialogEl!.querySelector(
                ".fw-file-selector"
            ) as HTMLElement,
            files: this.allFiles,
            showFiles: false,
            selectDir: path => this.updatePathDir(path),
            fileIcon: this.fileIcon
        })
        this.fileSelector.init()
    }

    moveFile(file: MovingFile, requestedPath: string): Promise<void> {
        return moveFile(file.id, file.title, requestedPath, this.moveUrl)
            .then(path => {
                addAlert(
                    "success",
                    `${this.successMessage}: '${shortFileTitle(file.title, path)}'`
                )
                this.succcessCallback(file, path)
            })
            .catch(() => {
                addAlert(
                    "error",
                    `${this.errorMessage}: '${shortFileTitle(file.title, file.path)}'`
                )
            })
    }
}
