import {escapeText, findTarget} from "../basic.js"
import {ensureCSS} from "../network.js"

export interface FileDescriptor {
    id?: number
    title?: string
    path: string
    [key: string]: unknown
}

export interface FileSelectorFolder {
    name: string
    type: "folder"
    open: boolean
    selected: boolean
    path: string
    children: FileSelectorEntry[]
}

export interface FileSelectorFile {
    name: string
    type: "file"
    path: string
    selected?: boolean
    file: FileDescriptor
}

export type FileSelectorEntry = FileSelectorFolder | FileSelectorFile

export interface FileSelectorOptions {
    dom: HTMLElement
    files: FileDescriptor[]
    showFiles?: boolean
    selectFolders?: boolean
    multiSelect?: boolean
    selectDir?: (path: string) => void
    selectFile?: (path: string) => void
    fileIcon?: string
}

export class FileSelector {
    dom: HTMLElement
    files: FileDescriptor[]
    showFiles: boolean
    selectFolders: boolean
    multiSelect: boolean
    selectDir: (path: string) => void
    selectFile: (path: string) => void
    fileIcon: string
    root: FileSelectorFolder
    selected: FileSelectorEntry[]

    constructor({
        dom,
        files,
        showFiles = true,
        selectFolders = true,
        multiSelect = false,
        selectDir = () => {},
        selectFile = () => {},
        fileIcon = "far fa-file-alt"
    }: FileSelectorOptions) {
        this.dom = dom
        this.files = files
        this.showFiles = showFiles // Whether to show existing files or only folders
        this.selectFolders = selectFolders // Whether to allow the selection of folders
        this.multiSelect = multiSelect // Whether to allow the selectioj of multiple entries
        this.selectDir = selectDir
        this.selectFile = selectFile
        this.fileIcon = fileIcon // File icon to use
        this.root = {
            name: "/",
            type: "folder",
            open: true,
            selected: false,
            path: "/",
            children: []
        }
        this.selected = []
        if (this.selectFolders && !this.multiSelect) {
            this.root.selected = true
            this.selected.push(this.root)
        }
    }

    init(): void {
        this.readDirStructure()
        this.sortDirStructure()
        ensureCSS(staticUrl("css/file_selector.css"))
        this.dom.classList.add("fw-file-selector")
        this.render()
        this.bind()
    }

    readDirStructure(): void {
        // Read directory structure from existing file paths.
        // A file's title is used as the final path segment when the file has
        // no explicit folder path. We strip any "/" from that segment because
        // some titles (e.g. E2EE ciphertext encoded in standard base64) contain
        // "/" characters which would otherwise be mis-interpreted as path
        // separators, nesting the file inside phantom collapsed folders.
        this.files.forEach(file => {
            let treeWalker = this.root.children
            let path = file.path
            if (!path.length || path.endsWith("/")) {
                const safeName = (file.title || gettext("Untitled")).replace(
                    /\//g,
                    "\u2215" // U+2215 DIVISION SLASH — visually identical, not a path separator
                )
                path += safeName
            }
            const pathParts = path.split("/")
            pathParts.forEach((pathPart, pathIndex) => {
                if (!pathPart.length) {
                    return
                }
                if (pathIndex === pathParts.length - 1) {
                    if (this.showFiles) {
                        treeWalker.push({
                            name: pathPart,
                            type: "file",
                            path: pathParts.slice(0, pathIndex + 1).join("/"),
                            file
                        })
                    }
                    return
                }
                let folder = treeWalker.find(
                    item => item.name === pathPart && item.type === "folder"
                ) as FileSelectorFolder | undefined
                if (!folder) {
                    folder = {
                        name: pathPart,
                        type: "folder",
                        open: false,
                        selected: false,
                        path: pathParts.slice(0, pathIndex + 1).join("/") + "/",
                        children: []
                    }
                    treeWalker.push(folder)
                }
                treeWalker = folder.children
            })
        })
    }

    sortDirStructure(entries = this.root.children): void {
        entries.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1
            }
            return a.name > b.name ? 1 : -1
        })
        entries.forEach(entry => {
            if (entry.type === "folder" && entry.children.length) {
                this.sortDirStructure(entry.children)
            }
        })
    }

    addFolder(rawName: string): void {
        const name = rawName.replace(/\//g, "")
        // Add a new folder as a subfolder to the currently selected folder
        if (
            !this.selected.length ||
            this.selected[0].type !== "folder" ||
            (this.selected[0] as FileSelectorFolder).children.find(
                child => child.type === "folder" && child.name === name
            )
        ) {
            // A file is selected. Give up.
            return
        }
        const selectedFolder = this.selected[0] as FileSelectorFolder
        const newFolder: FileSelectorFolder = {
            name,
            type: "folder",
            open: true,
            selected: true,
            path: selectedFolder.path + name + "/",
            children: []
        }
        selectedFolder.children.push(newFolder)
        this.sortDirStructure(selectedFolder.children)
        selectedFolder.open = true
        if (!this.multiSelect) {
            selectedFolder.selected = false
            this.selected = []
        }
        this.selected.push(newFolder)
        this.selectDir(newFolder.path)
        this.render()
    }

    deselectAll(): void {
        this.selected.forEach(entry => (entry.selected = false))
        this.selected = []
        this.render()
    }

    render(): void {
        this.dom.innerHTML = this.renderFolder(this.root)
    }

    renderFolder(folder: FileSelectorFolder, indentLevel = 0): string {
        let returnString = ""
        returnString += `<div class="folder${folder.open ? "" : " closed"}">`
        returnString += `<p style="margin-left:${indentLevel * 10}px;">${
            folder.children.length
                ? `<i class="far fa-${folder.open ? "minus" : "plus"}-square"></i>&nbsp;`
                : ""
        }<span class="folder-name${folder.selected ? " selected" : ""}"><i class="fas fa-folder"></i>&nbsp;${escapeText(folder.name)}</span></p>`
        if (folder.open) {
            returnString += '<div class="folder-content">'
            returnString += folder.children
                .map(child => {
                    if (child.type === "folder") {
                        return this.renderFolder(child, indentLevel + 1)
                    } else {
                        return `<p class="file" style="margin-left:${(indentLevel + 1) * 10 + 20}px;"><span class="file-name${child.selected ? " selected" : ""}"><i class="${this.fileIcon}"></i>&nbsp;${escapeText(child.name)}</span></p>`
                    }
                })
                .join("")
            returnString += "</div>"
        }
        returnString += "</div>"
        return returnString
    }

    findEntry(dom: Element): FileSelectorEntry {
        const searchPath: number[] = []
        let seekItem: Element | null = dom
        let closest = seekItem.closest("div.folder, p.file")
        while (closest) {
            seekItem = closest
            let itemNumber = 0
            while (seekItem.previousElementSibling) {
                itemNumber++
                seekItem = seekItem.previousElementSibling
            }
            searchPath.push(itemNumber)
            seekItem = seekItem.parentElement
            closest = seekItem?.closest("div.folder, p.file") ?? null
        }
        let entry: FileSelectorEntry = this.root
        searchPath.pop()
        while (searchPath.length) {
            entry = (entry as FileSelectorFolder).children[searchPath.pop()!]
        }
        return entry
    }

    bind(): void {
        this.dom.addEventListener("click", event => {
            const el: {target?: Element | null} = {}
            switch (true) {
                case findTarget(event, ".fa-plus-square", el): {
                    event.preventDefault()
                    const entry = this.findEntry(el.target!)
                    ;(entry as FileSelectorFolder).open = true
                    this.render()
                    break
                }
                case findTarget(event, ".fa-minus-square", el): {
                    event.preventDefault()
                    const entry = this.findEntry(el.target!)
                    ;(entry as FileSelectorFolder).open = false
                    this.render()
                    break
                }
                case findTarget(event, ".folder-name", el): {
                    event.preventDefault()
                    if (!this.selectFolders) {
                        // Folders cannot be selected
                        return
                    }
                    const entry = this.findEntry(el.target!)
                    if (this.selected.includes(entry)) {
                        entry.selected = false
                        this.selected = this.selected.filter(e => e !== entry)
                        this.render()
                    } else {
                        entry.selected = true
                        if (!this.multiSelect && this.selected.length) {
                            this.selected[0].selected = false
                        }
                        this.selected.push(entry)
                        this.render()
                        this.selectDir((entry as FileSelectorFolder).path)
                    }
                    break
                }
                case findTarget(event, ".file-name", el): {
                    event.preventDefault()
                    const entry = this.findEntry(el.target!)
                    if (this.selected.includes(entry)) {
                        entry.selected = false
                        this.selected = this.selected.filter(e => e !== entry)
                        this.render()
                    } else {
                        entry.selected = true
                        if (!this.multiSelect && this.selected.length) {
                            this.selected[0].selected = false
                        }
                        this.selected.push(entry)
                        this.render()
                        this.selectFile((entry as FileSelectorFile).path)
                    }
                    break
                }
            }
        })
    }
}
