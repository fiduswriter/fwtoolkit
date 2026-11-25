import {FileDialog} from "../src/file/dialog.js"

describe("FileDialog column browser", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("opens at the folder containing the file and syncs #path", () => {
        const dialog = new FileDialog({
            title: "Move",
            movingFiles: [{id: 1, title: "Report 23", path: "/Reports/2019/"}],
            allFiles: [
                {id: 1, title: "Report 23", path: "/Reports/2019/Report 23"},
                {id: 2, title: "Feb", path: "/Reports/2019/February/Feb"}
            ]
        })
        dialog.init()
        const input = dialog.dialog.dialogEl.querySelector(
            "#path"
        ) as HTMLInputElement
        expect(input.value).toBe("/Reports/2019/Report 23")
        // The browser opens at Reports/2019 with its children visible.
        expect(dialog.fileSelector && dialog.fileSelector.currentPath).toBe(
            "/Reports/2019/"
        )
        const columnPaths = Array.from(
            dialog.dialog.dialogEl.querySelectorAll<HTMLElement>(
                ".fw-file-selector-column"
            )
        ).map(el => el.dataset.path)
        expect(columnPaths).toEqual(["/", "/Reports/", "/Reports/2019/"])
        dialog.dialog.close()
    })

    test("selecting a folder updates the path input", () => {
        const dialog = new FileDialog({
            title: "Move",
            movingFiles: [{id: 1, title: "Report 23", path: "/Reports/2019/"}],
            allFiles: [
                {id: 2, title: "Feb", path: "/Reports/2019/February/Feb"}
            ]
        })
        dialog.init()
        const row = Array.from(
            dialog.dialog.dialogEl.querySelectorAll<HTMLElement>(
                ".fw-file-selector-row"
            )
        ).find(el => el.dataset.path === "/Reports/2019/February/")
        row!.click()
        const input = dialog.dialog.dialogEl.querySelector(
            "#path"
        ) as HTMLInputElement
        expect(input.value).toBe("/Reports/2019/February/Report 23")
        dialog.dialog.close()
    })
})
