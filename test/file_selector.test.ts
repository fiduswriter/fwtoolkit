import {FileSelector, type FileDescriptor} from "../src/file/selector.js"

const files: FileDescriptor[] = [
    {id: 1, title: "a.txt", path: "/folder1/a.txt"},
    {id: 2, title: "b.txt", path: "/folder1/sub/b.txt"},
    {id: 3, title: "c.txt", path: "/c.txt"}
]

const makeSelector = (
    options: Partial<ConstructorParameters<typeof FileSelector>[0]> = {}
) => {
    const dom = document.createElement("div")
    document.body.appendChild(dom)
    const selectedDirs: string[] = []
    const selectedFiles: string[] = []
    const selector = new FileSelector({
        dom,
        files,
        selectDir: path => selectedDirs.push(path),
        selectFile: path => selectedFiles.push(path),
        ...options
    })
    selector.init()
    return {dom, selector, selectedDirs, selectedFiles}
}

const rowFor = (dom: HTMLElement, path: string): HTMLElement => {
    const rows = Array.from(
        dom.querySelectorAll<HTMLElement>(".fw-file-selector-row")
    ).filter(row => row.dataset.path === path)
    expect(rows.length).toBeGreaterThan(0)
    return rows[rows.length - 1]
}

describe("FileSelector column browser", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("renders one column per folder level", () => {
        const {dom} = makeSelector({showFiles: true})
        expect(dom.getAttribute("role")).toBe("tree")
        expect(dom.querySelectorAll(".fw-file-selector-column").length).toBe(1)
        expect(
            dom.querySelectorAll(".fw-file-selector-breadcrumb").length
        ).toBe(1)
        // Folders are sorted before files.
        const names = Array.from(
            dom.querySelectorAll(".fw-file-selector-column .fw-folder-name")
        ).map(el => el.textContent?.trim())
        expect(names).toEqual(["folder1"])
    })

    test("clicking a folder opens its contents in the next column", () => {
        const {dom, selector} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        expect(selector.currentPath).toBe("/folder1/")
        const columns = dom.querySelectorAll(".fw-file-selector-column")
        expect(columns.length).toBe(2)
        expect(rowFor(dom, "/folder1/a.txt")).toBeTruthy()
    })

    test("clicking a file reports selectFile", () => {
        const {dom, selectedFiles} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        rowFor(dom, "/folder1/a.txt").click()
        expect(selectedFiles).toEqual(["/folder1/a.txt"])
    })

    test("selecting a folder reports selectDir and keeps it selected", () => {
        const {dom, selector, selectedDirs} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        expect(selectedDirs).toEqual(["/folder1/"])
        expect(rowFor(dom, "/folder1/").getAttribute("aria-selected")).toBe(
            "true"
        )
        expect(selector.selected.some(e => e.path === "/folder1/")).toBe(true)
    })

    test("breadcrumb jumps back and truncates columns", () => {
        const {dom} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        rowFor(dom, "/folder1/sub/").click()
        expect(dom.querySelectorAll(".fw-file-selector-column").length).toBe(3)
        const crumb = dom.querySelector<HTMLButtonElement>(
            '.fw-file-selector-crumb[data-path="/folder1/"]'
        )
        crumb!.click()
        expect(dom.querySelectorAll(".fw-file-selector-column").length).toBe(2)
    })

    test("keyboard: up/down move, right opens folder, left returns", () => {
        const {dom, selector} = makeSelector({showFiles: true})
        const folderRow = rowFor(dom, "/folder1/")
        folderRow.focus()
        folderRow.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true})
        )
        expect(selector.currentPath).toBe("/folder1/")
        const fileRow = rowFor(dom, "/folder1/a.txt")
        fileRow.focus()
        ;(document.activeElement as HTMLElement).dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowUp", bubbles: true})
        )
        // Folders sort before files inside the column.
        expect(document.activeElement?.getAttribute("data-path")).toBe(
            "/folder1/sub/"
        )
        ;(document.activeElement as HTMLElement).dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true})
        )
        expect(document.activeElement?.getAttribute("data-path")).toBe(
            "/folder1/"
        )
    })

    test("only the active row is a tab stop (roving tabindex)", () => {
        const {dom} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        const stops = Array.from(
            dom.querySelectorAll<HTMLElement>(
                '.fw-file-selector-row[tabindex="0"]'
            )
        )
        expect(stops.length).toBe(2)
    })

    test("addFolder creates a child of the selected folder", () => {
        const {dom, selector} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        selector.addFolder("new")
        expect(selector.currentPath).toBe("/folder1/")
        expect(rowFor(dom, "/folder1/new/")).toBeTruthy()
        expect(selector.selected.some(e => e.path === "/folder1/new/")).toBe(
            true
        )
    })

    test("deselectAll clears selection", () => {
        const {dom, selector} = makeSelector({showFiles: true})
        rowFor(dom, "/folder1/").click()
        selector.deselectAll()
        expect(selector.selected).toEqual([])
        expect(
            dom.querySelectorAll(".fw-file-selector-row.fw-selected").length
        ).toBe(0)
    })

    test("folder names are escaped", () => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const selector = new FileSelector({
            dom,
            files: [{id: 1, title: "x.txt", path: "/<img src=x>/x.txt"}],
            showFiles: false
        })
        selector.init()
        expect(dom.querySelector("img")).toBeNull()
    })

    test("hides files when showFiles is false", () => {
        const {dom} = makeSelector({showFiles: false})
        expect(dom.querySelector(".fw-file-row")).toBeNull()
        rowFor(dom, "/folder1/").click()
        expect(dom.querySelector(".fw-file-selector-row.fw-file")).toBeNull()
    })

    test("files-only list still renders a single column", () => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const selector = new FileSelector({
            dom,
            files: [{id: 1, title: "only.txt", path: "/only.txt"}],
            showFiles: true
        })
        selector.init()
        expect(rowFor(dom, "/only.txt")).toBeTruthy()
    })
})
