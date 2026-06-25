import {Dialog} from "../dialog.js"
import {newFolderTemplate} from "./templates.js"

export class NewFolderDialog {
    callback: (folderName: string) => void
    dialog: Dialog

    constructor(callback: (folderName: string) => void = () => {}) {
        this.callback = callback
        this.dialog = new Dialog({
            title: gettext("New folder"),
            id: "new-folder",
            width: 400,
            height: 150,
            body: newFolderTemplate(),
            buttons: [
                {type: "cancel"},
                {
                    text: gettext("Create folder"),
                    classes: "fw-dark",
                    click: () => {
                        const folderName =
                            (this.dialog.dialogEl!.querySelector("#new-folder-name") as HTMLInputElement).value
                        this.dialog.close()
                        if (!folderName.length) {
                            return
                        }
                        this.callback(folderName)
                    }
                }
            ]
        })
    }

    open(): void {
        return this.dialog.open()
    }
}
