import { escapeText, findTarget } from "../basic.js";
import { ensureCSS } from "../network.js";
import { gettext, staticUrl } from "../settings.js";
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
export class FileSelector {
    constructor({ dom, files, showFiles = true, selectFolders = true, multiSelect = false, selectDir = () => { }, selectFile = () => { }, fileIcon = "far fa-file-alt" }) {
        this.dom = dom;
        this.files = files;
        this.showFiles = showFiles; // Whether to show existing files or only folders
        this.selectFolders = selectFolders; // Whether to allow the selection of folders
        this.multiSelect = multiSelect; // Whether to allow the selectioj of multiple entries
        this.selectDir = selectDir;
        this.selectFile = selectFile;
        this.fileIcon = fileIcon; // File icon to use
        this.root = {
            name: "/",
            type: "folder",
            open: true,
            selected: false,
            path: "/",
            children: []
        };
        this.selected = [];
        this.currentPath = "/";
        this.columns = [];
        this.typeAhead = "";
        this.typeAheadTimer = null;
        this.bound = false;
        if (this.selectFolders && !this.multiSelect) {
            this.root.selected = true;
            this.selected.push(this.root);
        }
    }
    init() {
        this.readDirStructure();
        this.sortDirStructure();
        ensureCSS(staticUrl("css/fwtoolkit/file_selector.css"));
        this.dom.classList.add("fw-file-selector");
        this.render();
        this.bind();
    }
    readDirStructure() {
        // Read directory structure from existing file paths.
        // A file's title is used as the final path segment when the file has
        // no explicit folder path. We strip any "/" from that segment because
        // some titles (e.g. E2EE ciphertext encoded in standard base64) contain
        // "/" characters which would otherwise be mis-interpreted as path
        // separators, nesting the file inside phantom collapsed folders.
        this.files.forEach(file => {
            let treeWalker = this.root.children;
            let path = file.path;
            if (!path.length || path.endsWith("/")) {
                const safeName = (file.title || gettext("Untitled")).replace(/\//g, "\u2215" // U+2215 DIVISION SLASH — visually identical, not a path separator
                );
                path += safeName;
            }
            const pathParts = path.split("/");
            pathParts.forEach((pathPart, pathIndex) => {
                if (!pathPart.length) {
                    return;
                }
                if (pathIndex === pathParts.length - 1) {
                    if (this.showFiles) {
                        treeWalker.push({
                            name: pathPart,
                            type: "file",
                            path: pathParts.slice(0, pathIndex + 1).join("/"),
                            file
                        });
                    }
                    return;
                }
                let folder = treeWalker.find(item => item.name === pathPart && item.type === "folder");
                if (!folder) {
                    folder = {
                        name: pathPart,
                        type: "folder",
                        open: false,
                        selected: false,
                        path: pathParts.slice(0, pathIndex + 1).join("/") + "/",
                        children: []
                    };
                    treeWalker.push(folder);
                }
                treeWalker = folder.children;
            });
        });
    }
    sortDirStructure(entries = this.root.children) {
        entries.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }
            return a.name > b.name ? 1 : -1;
        });
        entries.forEach(entry => {
            if (entry.type === "folder" && entry.children.length) {
                this.sortDirStructure(entry.children);
            }
        });
    }
    addFolder(rawName) {
        const name = rawName.replace(/\//g, "");
        // Add a new folder as a subfolder to the currently selected folder
        if (!this.selected.length ||
            this.selected[0].type !== "folder" ||
            this.selected[0].children.find(child => child.type === "folder" && child.name === name)) {
            // A file is selected. Give up.
            return;
        }
        const selectedFolder = this.selected[0];
        const newFolder = {
            name,
            type: "folder",
            open: true,
            selected: true,
            path: selectedFolder.path + name + "/",
            children: []
        };
        selectedFolder.children.push(newFolder);
        this.sortDirStructure(selectedFolder.children);
        selectedFolder.open = true;
        if (!this.multiSelect) {
            selectedFolder.selected = false;
            this.selected = [];
        }
        this.selected.push(newFolder);
        this.currentPath = selectedFolder.path;
        this.selectDir(newFolder.path);
        this.render();
    }
    deselectAll() {
        this.selected.forEach(entry => (entry.selected = false));
        this.selected = [];
        this.render();
    }
    /**
     * Resolve a folder from its path, or `null` when the path is unknown.
     */
    findFolderByPath(path) {
        if (path === "/" || !path.length) {
            return this.root;
        }
        const parts = path.split("/").filter(part => part.length);
        let folder = this.root;
        for (const part of parts) {
            const child = folder.children.find(entry => entry.type === "folder" && entry.name === part);
            if (!child) {
                return null;
            }
            folder = child;
        }
        return folder;
    }
    /** Path chain from the root to `path` (inclusive). */
    pathChain(path) {
        const chain = [this.root];
        if (path === "/" || !path.length) {
            return chain;
        }
        const parts = path.split("/").filter(part => part.length);
        let folder = this.root;
        for (const part of parts) {
            const child = folder.children.find(entry => entry.type === "folder" && entry.name === part);
            if (!child) {
                break;
            }
            chain.push(child);
            folder = child;
        }
        return chain;
    }
    /**
     * Build the column list from the currently opened path. A column is added
     * for every folder along the chain plus one final column listing the
     * deepest opened folder's contents.
     */
    buildColumns() {
        const chain = this.pathChain(this.currentPath);
        this.columns = chain.map(folder => {
            const old = this.columns.find(column => column.folder === folder);
            return {
                folder,
                active: old?.active ?? null,
                focusActive: old?.focusActive
            };
        });
        this.columns.forEach(column => {
            const entries = column.folder.children;
            if (!column.active || !entries.includes(column.active)) {
                column.active =
                    entries.find(entry => entry.selected) ??
                        entries[0] ??
                        null;
            }
        });
    }
    render() {
        const previousActive = document.activeElement;
        const hasExplicitFocus = this.columns.some(column => column.focusActive);
        const wasFocused = !hasExplicitFocus &&
            !!previousActive &&
            previousActive.classList.contains("fw-file-selector-row") &&
            this.dom.contains(previousActive);
        const previousPath = wasFocused ? previousActive.dataset.path : null;
        const previousType = wasFocused ? previousActive.dataset.type : null;
        this.buildColumns();
        if (wasFocused) {
            // Keep the roving focus with the row that had it, when it still
            // exists after the rebuild.
            this.columns.forEach(column => {
                column.focusActive =
                    !!column.active &&
                        column.active.path === previousPath &&
                        column.active.type === previousType;
            });
            if (!this.columns.some(column => column.focusActive)) {
                const column = this.columns[this.columns.length - 1];
                if (column) {
                    column.focusActive = true;
                }
            }
        }
        this.dom.classList.add("fw-file-selector");
        this.dom.setAttribute("role", "tree");
        this.dom.setAttribute("aria-label", gettext("Folders and files"));
        this.dom.innerHTML = `${this.renderBreadcrumb()}${this.renderColumns()}`;
        const activated = this.columns.find(column => column.focusActive);
        const row = activated ? this.rowElement(activated) : null;
        if (row) {
            row.focus();
            this.ensureVisible(row);
        }
        this.columns.forEach(column => (column.focusActive = false));
    }
    /** The DOM row element for a column's active entry. */
    rowElement(column) {
        if (!column.active) {
            return null;
        }
        const rows = this.dom.querySelectorAll(`.fw-file-selector-row[data-path="${escapeSelector(column.active.path)}"]`);
        for (const row of Array.from(rows)) {
            if (row.dataset.type === column.active.type) {
                return row;
            }
        }
        return null;
    }
    /** Scroll a row into view, horizontally for its column strip. */
    ensureVisible(element) {
        const columnsEl = this.dom.querySelector(".fw-file-selector-columns");
        const columnEl = element.closest(".fw-file-selector-column");
        if (columnsEl && columnEl) {
            const columnsRect = columnsEl.getBoundingClientRect();
            const columnRect = columnEl.getBoundingClientRect();
            if (columnRect.right > columnsRect.right) {
                columnsEl.scrollLeft +=
                    columnRect.right - columnsRect.right + 16;
            }
            else if (columnRect.left < columnsRect.left) {
                columnsEl.scrollLeft -= columnsRect.left - columnRect.left + 16;
            }
        }
        if (columnEl) {
            const columnRect = columnEl.getBoundingClientRect();
            const rowRect = element.getBoundingClientRect();
            if (rowRect.bottom > columnRect.bottom) {
                columnEl.scrollTop += rowRect.bottom - columnRect.bottom;
            }
            else if (rowRect.top < columnRect.top) {
                columnEl.scrollTop -= columnRect.top - rowRect.top;
            }
        }
    }
    renderBreadcrumb() {
        const chain = this.pathChain(this.currentPath);
        const segments = chain.map(folder => {
            const icon = folder === this.root ? "fa-hard-drive" : "fa-folder";
            const label = `<i class="fas ${icon}" aria-hidden="true"></i>
                <span>${escapeText(folder === this.root ? gettext("Root") : folder.name)}</span>`;
            if (folder === chain[chain.length - 1]) {
                return `<span class="fw-file-selector-crumb fw-current" aria-current="location">${label}</span>`;
            }
            return `<button type="button" class="fw-file-selector-crumb" data-path="${escapeText(folder.path)}">${label}</button>`;
        });
        return `<nav class="fw-file-selector-breadcrumb" aria-label="${escapeText(gettext("Path"))}">${segments.join('<span class="fw-file-selector-crumb-sep" aria-hidden="true">›</span>')}</nav>`;
    }
    renderColumns() {
        return `<div class="fw-file-selector-columns">${this.columns
            .map(column => this.renderColumn(column))
            .join("")}</div>`;
    }
    renderColumn(column) {
        const folder = column.folder;
        const label = folder === this.root ? gettext("Root") : folder.name || folder.path;
        const rows = folder.children.length
            ? folder.children
                .map(entry => this.renderRow(entry, column))
                .join("")
            : `<li class="fw-file-selector-empty" role="presentation">${escapeText(gettext("No items"))}</li>`;
        return `<div class="fw-file-selector-column fw-folder${folder.open ? "" : " fw-closed"}" role="group" aria-label="${escapeText(label)}" data-path="${escapeText(folder.path)}">
    <ul class="fw-folder-content" role="presentation">${rows}</ul>
</div>`;
    }
    renderRow(entry, column) {
        const isFolder = entry.type === "folder";
        const isActive = column.active === entry;
        const isSelected = !!entry.selected;
        const isOpen = isFolder && this.columns.some(state => state.folder === entry);
        const icon = isFolder
            ? `<i class="fas fa-folder" aria-hidden="true"></i>`
            : `<i class="${this.fileIcon}" aria-hidden="true"></i>`;
        const classes = [
            "fw-file-selector-row",
            isFolder ? "fw-folder-row" : "fw-file",
            isActive ? "fw-active" : "",
            isSelected ? "fw-selected" : "",
            isFolder && entry.open ? "fw-open" : ""
        ]
            .filter(Boolean)
            .join(" ");
        // `fw-folder-name` / `fw-file-name` are kept so that downstream
        // selectors and existing tests keep resolving.
        const nameClass = isFolder
            ? `fw-folder-name${isSelected ? " fw-selected" : ""}`
            : `fw-file-name${isSelected ? " fw-selected" : ""}`;
        const expanded = isFolder
            ? ` aria-expanded="${isOpen || entry.open ? "true" : "false"}"`
            : "";
        return `<li class="${classes}" role="treeitem" tabindex="${isActive ? "0" : "-1"}" aria-selected="${isSelected}"${expanded} data-path="${escapeText(entry.path)}" data-type="${entry.type}">
    <span class="fw-file-selector-row-icon">${icon}</span>
    <span class="${nameClass}">${escapeText(entry.name)}</span>
    ${isFolder ? '<i class="fas fa-chevron-right fw-file-selector-row-chevron" aria-hidden="true"></i>' : ""}
</li>`;
    }
    /** The column whose folder directly contains `entry`. */
    columnContaining(entry) {
        return (this.columns.find(column => column.folder.children.includes(entry)) ?? null);
    }
    focusColumn(column) {
        this.columns.forEach(state => {
            state.focusActive = state === column;
        });
        this.render();
    }
    /** Select (and, for folders, open) an entry. */
    selectEntry(entry) {
        if (this.multiSelect && entry.type === "file") {
            const existing = this.selected.find(selected => selected.type === "file" && selected.path === entry.path);
            if (existing) {
                existing.selected = false;
                this.selected = this.selected.filter(selected => selected !== existing);
                this.render();
                return;
            }
            entry.selected = true;
        }
        else {
            this.selected.forEach(selected => (selected.selected = false));
            this.selected = [];
            entry.selected = true;
            this.selected.push(entry);
        }
        if (entry.type === "folder") {
            this.openFolder(entry);
            this.selectDir(entry.path);
        }
        else {
            this.render();
            this.selectFile(entry.path);
        }
    }
    openFolder(folder) {
        folder.open = true;
        this.currentPath = folder.path;
        const column = this.columnContaining(folder);
        if (column) {
            column.active = folder;
        }
        this.render();
    }
    /** Collapse every folder below `folder` and make it the current one. */
    closePathTo(folder) {
        const reset = (entries) => {
            entries.forEach(entry => {
                if (entry.type === "folder") {
                    entry.open = entry === folder;
                    reset(entry.children);
                }
            });
        };
        reset(this.root.children);
        folder.open = true;
        this.currentPath = folder.path;
        if (this.selectFolders && !this.multiSelect) {
            this.selected.forEach(selected => (selected.selected = false));
            this.selected = [folder];
            folder.selected = true;
        }
        this.focusColumn(this.columnContaining(folder));
    }
    toggleFolder(folder) {
        if (folder.open && folder.path === this.currentPath) {
            const parent = this.findParent(folder) ?? this.root;
            this.closePathTo(parent);
        }
        else {
            this.openFolder(folder);
        }
    }
    findParent(entry) {
        const found = (entries, parent) => {
            for (const child of entries) {
                if (child === entry) {
                    return parent;
                }
                if (child.type === "folder") {
                    const result = found(child.children, child);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        };
        return found(this.root.children, this.root);
    }
    moveWithinColumn(column, delta) {
        const entries = column.folder.children;
        if (!entries.length) {
            return false;
        }
        const index = column.active ? entries.indexOf(column.active) : -1;
        const nextIndex = index === -1
            ? 0
            : Math.min(Math.max(index + delta, 0), entries.length - 1);
        column.active = entries[nextIndex];
        column.focusActive = true;
        this.render();
        return true;
    }
    goToColumn(offset, sourceColumn) {
        const index = sourceColumn
            ? this.columns.indexOf(sourceColumn)
            : this.columns.findIndex(column => column.focusActive);
        const source = this.columns[index];
        const target = this.columns[index + offset];
        if (!source || !target) {
            return false;
        }
        if (offset < 0 && target.folder.children.includes(source.folder)) {
            // Walking left re-highlights, in its parent column, the folder
            // whose contents the source column lists.
            target.active = source.folder;
        }
        this.focusColumn(target);
        return true;
    }
    handleTypeAhead(key, column) {
        if (this.typeAheadTimer) {
            clearTimeout(this.typeAheadTimer);
        }
        this.typeAhead += key.toLowerCase();
        this.typeAheadTimer = setTimeout(() => {
            this.typeAhead = "";
            this.typeAheadTimer = null;
        }, 700);
        const matches = column.folder.children.filter(entry => entry.name.toLowerCase().startsWith(this.typeAhead));
        const chosen = matches.find(entry => entry !== column.active) ?? matches[0];
        if (!chosen) {
            return false;
        }
        column.active = chosen;
        column.focusActive = true;
        this.render();
        return true;
    }
    onKeydown(event) {
        const row = event.target?.closest(".fw-file-selector-row");
        if (!row) {
            return;
        }
        const entry = this.entryFromRow(row);
        const column = entry ? this.columnContaining(entry) : null;
        if (!entry || !column) {
            return;
        }
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.moveWithinColumn(column, 1);
                break;
            case "ArrowUp":
                event.preventDefault();
                this.moveWithinColumn(column, -1);
                break;
            case "ArrowRight":
                event.preventDefault();
                if (entry.type === "folder") {
                    this.openFolder(entry);
                }
                break;
            case "ArrowLeft":
                event.preventDefault();
                this.goToColumn(-1, column);
                break;
            case "Home":
                event.preventDefault();
                if (column.folder.children.length) {
                    column.active = column.folder.children[0];
                    column.focusActive = true;
                    this.render();
                }
                break;
            case "End":
                event.preventDefault();
                if (column.folder.children.length) {
                    column.active =
                        column.folder.children[column.folder.children.length - 1];
                    column.focusActive = true;
                    this.render();
                }
                break;
            case "Enter":
            case " ":
                event.preventDefault();
                this.selectEntry(entry);
                break;
            default:
                if (event.key.length === 1 &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey) {
                    if (this.handleTypeAhead(event.key, column)) {
                        event.preventDefault();
                    }
                }
                break;
        }
    }
    onFocus(event) {
        const row = event.target?.closest(".fw-file-selector-row");
        const entry = row ? this.entryFromRow(row) : null;
        const column = entry ? this.columnContaining(entry) : null;
        if (!entry || !column) {
            return;
        }
        if (column.active !== entry) {
            column.active = entry;
        }
        this.columns.forEach(state => (state.focusActive = false));
    }
    bind() {
        if (this.bound) {
            return;
        }
        this.bound = true;
        this.dom.addEventListener("click", event => {
            const el = {};
            switch (true) {
                case findTarget(event, ".fw-file-selector-crumb", el): {
                    event.preventDefault();
                    const path = el.target.dataset.path;
                    const folder = path ? this.findFolderByPath(path) : null;
                    if (folder) {
                        this.closePathTo(folder);
                    }
                    break;
                }
                case findTarget(event, ".fa-plus-square", el):
                case findTarget(event, ".fw-file-selector-row-chevron", el): {
                    event.preventDefault();
                    const row = el.target.closest(".fw-file-selector-row");
                    const entry = row ? this.entryFromRow(row) : null;
                    if (entry && entry.type === "folder") {
                        this.toggleFolder(entry);
                    }
                    break;
                }
                case findTarget(event, ".fw-file-selector-row", el): {
                    event.preventDefault();
                    const entry = this.entryFromRow(el.target);
                    if (entry) {
                        this.selectEntry(entry);
                    }
                    break;
                }
            }
        });
        this.dom.addEventListener("keydown", event => this.onKeydown(event));
        this.dom.addEventListener("focusin", event => this.onFocus(event));
    }
    entryFromRow(row) {
        const path = row.dataset.path;
        const type = row.dataset.type;
        const search = (entries) => {
            for (const entry of entries) {
                if (entry.path === path && entry.type === type) {
                    return entry;
                }
                if (entry.type === "folder") {
                    const result = search(entry.children);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        };
        return search(this.root.children);
    }
    /**
     * Locate the entry for a DOM node. Retained for backwards compatibility
     * with earlier versions that exposed tree-based lookup.
     */
    findEntry(dom) {
        const row = dom.closest(".fw-file-selector-row");
        return (row ? this.entryFromRow(row) : null) ?? this.root;
    }
}
const escapeSelector = (value) => typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value;
//# sourceMappingURL=selector.js.map