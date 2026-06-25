export type ContentMenuItemTitle = string | ((page: unknown) => string)

export interface ContentMenuBaseItem {
    type?: "header" | "separator" | "action"
    title?: ContentMenuItemTitle
    tooltip?: string
    action?: (page: unknown) => void
    disabled?: (page: unknown) => boolean
    selected?: boolean
    order?: number
    icon?: string
}

export interface ContentMenuHeaderItem extends ContentMenuBaseItem {
    type: "header"
    title: ContentMenuItemTitle
}

export interface ContentMenuSeparatorItem extends ContentMenuBaseItem {
    type: "separator"
}

export interface ContentMenuActionItem extends ContentMenuBaseItem {
    type?: "action"
    title: ContentMenuItemTitle
    action: (page: unknown) => void
}

export type ContentMenuItem =
    | ContentMenuHeaderItem
    | ContentMenuSeparatorItem
    | ContentMenuActionItem

export interface ContentMenuInit {
    content: ContentMenuItem[]
}

export interface ContentMenuPosition {
    X: number
    Y: number
}

export interface ContentMenuOptions {
    id?: string | false
    page?: unknown | false
    classes?: string | false
    menu?: ContentMenuInit
    height?: number | false
    width?: number | false
    onClose?: (() => void) | false
    scroll?: boolean | false
    dialogEl?: HTMLElement | false
    backdropEl?: HTMLElement | false
    menuPos?: ContentMenuPosition | false
}

const menuTemplate = ({
    id,
    classes,
    height,
    width,
    zIndex,
    menu,
    scroll,
    page
}: {
    id: string | false
    classes: string | false
    height: string
    width: string
    zIndex: number
    menu: ContentMenuInit
    scroll: boolean | false
    page: unknown | false
}) =>
    `<div tabindex="-1" role="incontent_menu"
        class="fw-content-menu"
        ${id ? `aria-describedby="${id}"` : ""} style="z-index: ${zIndex};">
    <div ${id ? `id="${id}"` : ""} class="fw-content-menu-content${classes ? ` ${classes}` : ""}${scroll ? " fw-scrollable" : ""}" style="width: ${width}; height: ${height};">
    <div>
        <ul class="fw-content-menu-list">
        ${menu.content
            .map((menuItem, index) => {
                switch (menuItem.type) {
                    case "header":
                        return `<li><span class="fw-content-menu-item-header" title="${menuItem.tooltip || ""}">${
                            typeof menuItem.title === "function"
                                ? menuItem.title(page)
                                : menuItem.title
                        }</span></li>`
                    case "separator":
                        return '<li><hr class="fw-content-menu-item-divider"/></li>'
                    default:
                        return `<li tabindex="0" data-index="${index}" class="fw-content-menu-item${
                            menuItem.disabled && menuItem.disabled(page)
                                ? " fw-disabled"
                                : menuItem.selected
                                  ? " fw-selected"
                                  : ""
                        }" title='${menuItem.tooltip || ""}'>
                        ${
                            typeof menuItem.title === "function"
                                ? menuItem.title(page)
                                : menuItem.title
                        } ${
                            menuItem.icon
                                ? `<span class="fw-content-menu-item-icon"><i class="fa fa-${menuItem.icon}"></i></span>`
                                : ""
                        }
                        </li>`
                }
            })
            .join("")}
        </ul>
    </div>
    </div>
</div>
<div class="fw-overlay" style="z-index: ${zIndex - 1}"></div>`

export class ContentMenu {
    id: string | false
    page: unknown | false
    classes: string | false
    menu: ContentMenuInit
    height: string
    width: string
    onClose: (() => void) | false
    scroll: boolean | false
    dialogEl!: HTMLElement
    backdropEl!: HTMLElement
    menuPos: ContentMenuPosition | false

    focusedIndex: number
    previouslyFocusedElement: Element | null

    constructor({
        id = false,
        page = false,
        classes = false,
        menu = {content: []},
        height = false,
        width = false,
        onClose = false,
        scroll = false,
        dialogEl = false,
        backdropEl = false,
        menuPos = false
    }: ContentMenuOptions = {}) {
        this.id = id
        this.page = page
        this.classes = classes
        this.menu = menu
        this.height = height ? `${height}px` : "auto"
        this.width = width ? `${width}px` : "auto"
        this.onClose = onClose
        this.scroll = scroll
        this.dialogEl = (dialogEl || null) as HTMLElement
        this.backdropEl = (backdropEl || null) as HTMLElement
        this.menuPos = menuPos

        this.focusedIndex = 0
        this.previouslyFocusedElement = null
    }

    open(): void {
        if (this.dialogEl) {
            return
        }

        this.previouslyFocusedElement = document.activeElement

        document.body.insertAdjacentHTML(
            "beforeend",
            menuTemplate({
                id: this.id,
                classes: this.classes,
                height: this.height,
                width: this.width,
                zIndex: this.getHighestDialogZIndex() + 2,
                menu: this.menu,
                scroll: this.scroll,
                page: this.page
            })
        )
        this.backdropEl = document.body.lastElementChild as HTMLElement
        this.dialogEl = this.backdropEl
            .previousElementSibling as HTMLElement
        if (this.menuPos && this.menuPos.X && this.menuPos.Y) {
            this.positionDialog()
        } else {
            this.centerDialog()
        }
        this.checkAndAddColumns()
        this.bind()
        this.focusFirstMenuItem()
    }

    renderColumnsHtml(columns: number): string {
        const itemsPerColumn = Math.ceil(this.menu.content.length / columns)
        let html = '<div class="fw-content-menu-columns">'
        for (let col = 0; col < columns; col++) {
            const start = col * itemsPerColumn
            const end = Math.min(
                start + itemsPerColumn,
                this.menu.content.length
            )
            if (start >= this.menu.content.length) {
                break
            }
            html += '<ul class="fw-content-menu-list">'
            for (let i = start; i < end; i++) {
                const menuItem = this.menu.content[i]
                switch (menuItem.type) {
                    case "header":
                        html += `<li><span class="fw-content-menu-item-header" title="${menuItem.tooltip || ""}">${
                            typeof menuItem.title === "function"
                                ? menuItem.title(this.page)
                                : menuItem.title
                        }</span></li>`
                        break
                    case "separator":
                        html +=
                            '<li><hr class="fw-content-menu-item-divider"/></li>'
                        break
                    default:
                        html += `<li tabindex="0" data-index="${i}" class="fw-content-menu-item${
                            menuItem.disabled && menuItem.disabled(this.page)
                                ? " fw-disabled"
                                : menuItem.selected
                                  ? " fw-selected"
                                  : ""
                        }" title='${menuItem.tooltip || ""}'>
                        ${
                            typeof menuItem.title === "function"
                                ? menuItem.title(this.page)
                                : menuItem.title
                        } ${
                            menuItem.icon
                                ? `<span class="fw-content-menu-item-icon"><i class="fa fa-${menuItem.icon}"></i></span>`
                                : ""
                        }
                        </li>`
                }
            }
            html += "</ul>"
        }
        html += "</div>"
        return html
    }

    checkAndAddColumns(): void {
        const dialogRect = this.dialogEl.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const maxHeight = viewportHeight * 0.9
        const maxWidth = viewportWidth * 0.95

        if (dialogRect.height >= maxHeight) {
            const contentEl = this.dialogEl.querySelector(".fw-content-menu-content") as HTMLElement
            const contentDiv = contentEl.querySelector(":scope > div") as HTMLElement
            let columns = 2
            while (columns <= 6) {
                contentDiv.innerHTML = this.renderColumnsHtml(columns)
                const columnsDiv = contentDiv.querySelector(".fw-content-menu-columns")
                if (columnsDiv) {
                    const naturalWidth = columnsDiv.scrollWidth + 20
                    contentEl.style.width = `${naturalWidth}px`
                }
                const newRect = this.dialogEl.getBoundingClientRect()
                if (newRect.height < maxHeight && newRect.width < maxWidth) {
                    if (this.menuPos && this.menuPos.X && this.menuPos.Y) {
                        this.positionDialog()
                    } else {
                        this.centerDialog()
                    }
                    return
                }
                columns++
            }
            // Fallback: restore single column with scrolling
            contentDiv.innerHTML = `<ul class="fw-content-menu-list">${this.renderSingleColumnHtml()}</ul>`
            contentEl.style.width = this.width
            this.dialogEl
                .querySelector(".fw-content-menu-content")!
                .classList.add("fw-scrollable")
            if (this.menuPos && this.menuPos.X && this.menuPos.Y) {
                this.positionDialog()
            } else {
                this.centerDialog()
            }
        }
    }

    renderSingleColumnHtml(): string {
        return this.menu.content
            .map((menuItem, index) => {
                switch (menuItem.type) {
                    case "header":
                        return `<li><span class="fw-content-menu-item-header" title="${menuItem.tooltip || ""}">${
                            typeof menuItem.title === "function"
                                ? menuItem.title(this.page)
                                : menuItem.title
                        }</span></li>`
                    case "separator":
                        return '<li><hr class="fw-content-menu-item-divider"/></li>'
                    default:
                        return `<li tabindex="0" data-index="${index}" class="fw-content-menu-item${
                            menuItem.disabled && menuItem.disabled(this.page)
                                ? " fw-disabled"
                                : menuItem.selected
                                  ? " fw-selected"
                                  : ""
                        }" title='${menuItem.tooltip || ""}'>
                    ${
                        typeof menuItem.title === "function"
                            ? menuItem.title(this.page)
                            : menuItem.title
                    } ${
                        menuItem.icon
                            ? `<span class="fw-content-menu-item-icon"><i class="fa fa-${menuItem.icon}"></i></span>`
                            : ""
                    }
                    </li>`
                }
            })
            .join("")
    }

    centerDialog(): void {
        const totalWidth = window.innerWidth,
            totalHeight = window.innerHeight,
            dialogRect = this.dialogEl.getBoundingClientRect(),
            dialogWidth = dialogRect.width + 10,
            dialogHeight = dialogRect.height + 10,
            scrollTopOffset = window.pageYOffset,
            scrollLeftOffset = window.pageXOffset
        this.dialogEl.style.top = `${(totalHeight - dialogHeight) / 2 + scrollTopOffset}px`
        this.dialogEl.style.left = `${(totalWidth - dialogWidth) / 2 + scrollLeftOffset}px`
    }

    positionDialog(): void {
        const dialogHeight = this.dialogEl.getBoundingClientRect().height + 10,
            dialogWidth = this.dialogEl.getBoundingClientRect().width + 10,
            scrollTopOffset = window.pageYOffset,
            clientHeight = window.document.documentElement.clientHeight,
            clientWidth = window.document.documentElement.clientWidth

        // We try to ensure that the menu is seen in the browser at the preferred location.
        // Adjustments are made in case it doesn't fit.
        let top = this.menuPos ? this.menuPos.Y : 0,
            left = this.menuPos ? this.menuPos.X : 0

        if (top + dialogHeight > scrollTopOffset + clientHeight) {
            top -= top + dialogHeight - (scrollTopOffset + clientHeight)
        }

        if (top < scrollTopOffset) {
            top = scrollTopOffset + 10
        }

        if (left + dialogWidth > clientWidth) {
            left -= left + dialogWidth - clientWidth
        }

        this.dialogEl.style.top = `${top}px`
        this.dialogEl.style.left = `${left}px`
    }

    bind(): void {
        this.backdropEl.addEventListener("click", () => this.close())
        this.dialogEl.addEventListener("click", event => this.onclick(event))
        this.dialogEl.addEventListener("keydown", event =>
            this.onKeyDown(event)
        )
        this.dialogEl.focus()
    }

    getHighestDialogZIndex(): number {
        let zIndex = 100
        document
            .querySelectorAll("div.fw-content-menu")
            .forEach(
                dialogEl => (zIndex = Math.max(zIndex, parseInt((dialogEl as HTMLElement).style.zIndex) || 100))
            )
        document
            .querySelectorAll("div.fw-dialog")
            .forEach(
                dialogEl => (zIndex = Math.max(zIndex, parseInt((dialogEl as HTMLElement).style.zIndex) || 100))
            )
        return zIndex
    }

    close(): void {
        if (!this.dialogEl || !this.dialogEl.parentElement) {
            return
        }
        this.dialogEl.parentElement.removeChild(this.dialogEl)
        this.backdropEl.parentElement!.removeChild(this.backdropEl)

        // Restore focus to the previously focused element
        if (
            this.previouslyFocusedElement &&
            (this.previouslyFocusedElement as HTMLElement).focus
        ) {
            (this.previouslyFocusedElement as HTMLElement).focus()
        }

        if (this.onClose) {
            this.onClose()
        }
    }

    onclick(event: MouseEvent): void {
        event.preventDefault()
        event.stopImmediatePropagation()
        const target = (event.target as Element).closest("li.fw-content-menu-item") as HTMLElement
        if (target) {
            const menuNumber = target.dataset.index
            if (menuNumber === undefined) {
                return
            }
            const menuItem = this.menu.content[parseInt(menuNumber)] as ContentMenuActionItem
            if (menuItem.disabled?.(this.page)) {
                return
            }
            menuItem.action(this.page)
            this.close()
        }
    }

    onKeyDown(event: KeyboardEvent): void {
        const {key} = event
        const menuItems = this.dialogEl.querySelectorAll("li.fw-content-menu-item:not(.fw-disabled)")

        const columnsDiv = this.dialogEl.querySelector(".fw-content-menu-columns")
        const totalColumns = columnsDiv
            ? columnsDiv.querySelectorAll(".fw-content-menu-list").length
            : 1
        const itemsPerColumn =
            totalColumns > 1
                ? Math.ceil(menuItems.length / totalColumns)
                : menuItems.length

        switch (key) {
            case "Escape":
                this.close()
                break
            case "ArrowUp":
                event.preventDefault()
                this.focusedIndex =
                    (this.focusedIndex - 1 + menuItems.length) %
                    menuItems.length
                this.focusMenuItem(this.focusedIndex)
                break
            case "ArrowDown":
                event.preventDefault()
                this.focusedIndex = (this.focusedIndex + 1) % menuItems.length
                this.focusMenuItem(this.focusedIndex)
                break
            case "ArrowLeft":
                event.preventDefault()
                if (totalColumns <= 1) {
                    break
                }
                {
                    const currentCol = Math.floor(
                        this.focusedIndex / itemsPerColumn
                    )
                    const currentRow = this.focusedIndex % itemsPerColumn
                    if (currentCol > 0) {
                        let newIndex =
                            (currentCol - 1) * itemsPerColumn + currentRow
                        const prevColEnd = Math.min(
                            currentCol * itemsPerColumn,
                            menuItems.length
                        )
                        if (newIndex >= prevColEnd) {
                            newIndex = prevColEnd - 1
                        }
                        this.focusedIndex = newIndex
                        this.focusMenuItem(this.focusedIndex)
                    }
                }
                break
            case "ArrowRight":
                event.preventDefault()
                if (totalColumns <= 1) {
                    break
                }
                {
                    const currentCol = Math.floor(
                        this.focusedIndex / itemsPerColumn
                    )
                    const currentRow = this.focusedIndex % itemsPerColumn
                    if (currentCol < totalColumns - 1) {
                        let newIndex =
                            (currentCol + 1) * itemsPerColumn + currentRow
                        const nextColEnd = Math.min(
                            (currentCol + 2) * itemsPerColumn,
                            menuItems.length
                        )
                        if (newIndex >= nextColEnd) {
                            newIndex = nextColEnd - 1
                        }
                        this.focusedIndex = newIndex
                        this.focusMenuItem(this.focusedIndex)
                    }
                }
                break
            case "Tab":
                event.preventDefault()
                if (event.shiftKey) {
                    this.focusedIndex =
                        (this.focusedIndex - 1 + menuItems.length) %
                        menuItems.length
                } else {
                    this.focusedIndex =
                        (this.focusedIndex + 1) % menuItems.length
                }
                this.focusMenuItem(this.focusedIndex)
                break
            case "Enter":
            case " ": {
                event.preventDefault()
                const menuItem = this.menu.content[this.focusedIndex] as ContentMenuActionItem
                if (!menuItem.disabled?.(this.page)) {
                    menuItem.action(this.page)
                    this.close()
                }
                break
            }
        }
    }

    focusFirstMenuItem(): void {
        const menuItems = this.dialogEl.querySelectorAll("li.fw-content-menu-item:not(.fw-disabled)")
        if (menuItems.length > 0) {
            this.focusedIndex = 0
            this.focusMenuItem(this.focusedIndex)
        }
    }

    focusMenuItem(index: number): void {
        const menuItems = this.dialogEl.querySelectorAll("li.fw-content-menu-item:not(.fw-disabled)")
        if (menuItems[index]) {
            (menuItems[index] as HTMLElement).focus()
        }
    }
}
