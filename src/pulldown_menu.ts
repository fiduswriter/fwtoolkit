import { DiffDOM } from "diff-dom"
import { keyName } from "w3c-keyname"

import { escapeText } from "./basic.js"

export interface PulldownMenuItem {
    id?: string
    title: string | ((context: unknown) => string)
    type: "action" | "menu" | "separator"
    order?: number
    keys?: string
    icon?: string
    disabled?: boolean | ((context: unknown) => boolean)
    selected?: boolean | ((context: unknown) => boolean)
    tooltip?: string | ((context: unknown) => string)
    action?: (context: unknown, item: PulldownMenuItem) => void
    content?: PulldownMenuItem[]
    open?: boolean
}

export interface PulldownMenuModel {
    content: PulldownMenuItem[]
}

interface PulldownMenuContainer {
    content: PulldownMenuItem[]
}

export interface PulldownMenuOptions {
    menu: PulldownMenuModel
    context?: unknown
    onClose?: () => void
}

function resolve<T>(value: T | ((context: unknown) => T), context: unknown): T {
    if (typeof value === "function") {
        return (value as (context: unknown) => T)(context)
    }
    return value
}

export class PulldownMenu {
    options: PulldownMenuOptions
    context: unknown
    dd: DiffDOM
    container: HTMLElement | null
    barEl: HTMLElement | null
    listeners: Record<string, (event: Event) => void>
    openMenu: PulldownMenuItem | null
    parentChain: PulldownMenuItem[]
    cursorMenuItem: PulldownMenuItem | null

    constructor(options: PulldownMenuOptions) {
        this.options = options
        this.context = options.context ?? null
        this.dd = new DiffDOM({ valueDiffing: false })
        this.container = null
        this.barEl = null
        this.listeners = {}
        this.openMenu = null
        this.parentChain = []
        this.cursorMenuItem = null
        this.addMissingIds(this.options.menu)
    }

    private addMissingIds(menu: PulldownMenuContainer): void {
        menu.content.forEach(item => {
            if (!item.id) {
                item.id = Math.random().toString(36).substring(2)
            }
            if (item.type === "menu" && item.content) {
                this.addMissingIds(item as PulldownMenuContainer)
            }
        })
    }

    render(): string {
        return `<div class="fw-pulldown-menu-bar" role="menubar">${this.options.menu.content
            .map(
                menu => `
                <div class="fw-pulldown-menu-header" data-id="${menu.id}">
                    <span class="fw-pulldown-menu-title${
                        resolve(menu.disabled, this.context)
                            ? " fw-disabled"
                            : ""
                    }"
                          title="${
                              menu.tooltip
                                  ? escapeText(
                                        String(
                                            resolve(menu.tooltip, this.context)
                                        )
                                    )
                                  : ""
                          }"
                          aria-label="${
                              menu.tooltip
                                  ? escapeText(
                                        String(
                                            resolve(menu.tooltip, this.context)
                                        )
                                    )
                                  : ""
                          }"
                          role="menuitem"
                          aria-haspopup="true"
                          tabindex="0">
                        ${this.getAccessKeyHTML(
                            resolve(menu.title, this.context),
                            menu.keys?.slice(-1)
                        )}
                    </span>
                    ${menu.open ? this.getMenuHTML(menu) : ""}
                </div>`
            )
            .join("")}</div>`
    }

    bind(container: HTMLElement): void {
        this.container = container
        container.innerHTML = this.render()
        this.barEl = container.firstElementChild as HTMLElement
        this.bindEvents()
    }

    private bindEvents(): void {
        this.listeners.onclick = event => this.onclick(event as MouseEvent)
        document.body.addEventListener("click", this.listeners.onclick)
        this.listeners.onKeydown = event =>
            this.onKeydown(event as KeyboardEvent)
        document.body.addEventListener("keydown", this.listeners.onKeydown)
    }

    destroy(): void {
        if (this.listeners.onclick) {
            document.body.removeEventListener("click", this.listeners.onclick)
        }
        if (this.listeners.onKeydown) {
            document.body.removeEventListener(
                "keydown",
                this.listeners.onKeydown
            )
        }
        this.listeners = {}
        this.openMenu = null
        this.parentChain = []
        this.cursorMenuItem = null
    }

    private onclick(event: MouseEvent): void {
        const target = event.target as Element
        if (!this.container) {
            return
        }

        if (target.closest(".fw-pulldown-menu-item")) {
            const itemEl = target.closest(
                ".fw-pulldown-menu-item"
            ) as HTMLElement
            const menuItem = this.findMenuItemByElement(itemEl)
            if (menuItem) {
                this.executeMenuItem(menuItem)
            }
            return
        }

        const headerTitle = target.closest(".fw-pulldown-menu-title")
        if (
            headerTitle &&
            this.container.contains(headerTitle) &&
            !headerTitle.classList.contains("fw-disabled")
        ) {
            const headerEl = headerTitle.closest(
                ".fw-pulldown-menu-header"
            ) as HTMLElement
            const menu = this.options.menu.content.find(
                item => item.id === headerEl.dataset.id
            )
            if (menu) {
                this.closeAllMenus()
                menu.open = true
                this.openMenu = menu
                this.parentChain = [menu]
                this.cursorMenuItem = null
                this.update()
            }
            return
        }

        if (this.openMenu) {
            this.closeAllMenus()
            this.openMenu = null
            this.parentChain = []
            this.cursorMenuItem = null
            this.update()
            if (this.options.onClose) {
                this.options.onClose()
            }
        }
    }

    private findMenuItemByElement(
        element: HTMLElement
    ): PulldownMenuItem | null {
        if (!this.container) {
            return null
        }
        const path: number[] = []
        let seekItem: Element | null = element
        // Walk up from the item to the root pulldown, collecting sibling indices.
        while (seekItem) {
            const li: Element | null = seekItem.closest("li")
            if (!li) {
                break
            }
            let itemNumber = 0
            let sibling: Element | null = li
            while (sibling && sibling.previousElementSibling) {
                itemNumber++
                sibling = sibling.previousElementSibling
            }
            path.push(itemNumber)
            seekItem = li.parentElement?.parentElement ?? null
        }

        const headerEl = seekItem?.closest(".fw-pulldown-menu-header") as
            | HTMLElement
            | undefined
        if (!headerEl) {
            return null
        }
        const menu = this.options.menu.content.find(
            item => item.id === headerEl.dataset.id
        )
        if (!menu) {
            return null
        }

        let menuItem: PulldownMenuItem = menu
        while (path.length) {
            const index = path.pop()!
            if (!menuItem.content || index >= menuItem.content.length) {
                return null
            }
            menuItem = menuItem.content[index]
        }
        return menuItem
    }

    private executeMenuItem(menuItem: PulldownMenuItem): void {
        if (resolve(menuItem.disabled, this.context)) {
            return
        }
        switch (menuItem.type) {
            case "action": {
                if (menuItem.action) {
                    menuItem.action(this.context, menuItem)
                }
                this.closeAllMenus()
                this.openMenu = null
                this.parentChain = []
                this.cursorMenuItem = null
                if (this.options.onClose) {
                    this.options.onClose()
                }
                this.update()
                break
            }
            case "menu": {
                this.openSubMenu(menuItem)
                this.update()
                break
            }
            default:
                break
        }
    }

    private openSubMenu(menuItem: PulldownMenuItem): void {
        if (!this.parentChain.length) {
            this.parentChain = [menuItem]
            if (this.openMenu) {
                this.openMenu.open = false
            }
            this.openMenu = menuItem
            this.openMenu.open = true
            return
        }

        const parent = this.parentChain[this.parentChain.length - 1]
        const isChildOfParent = parent.content?.some(
            child => child.id === menuItem.id
        )

        if (isChildOfParent) {
            this.parentChain.push(menuItem)
        } else {
            let foundAncestor = false
            for (let index = this.parentChain.length - 2; index >= 0; index--) {
                const ancestor = this.parentChain[index]
                if (ancestor.content?.some(child => child.id === menuItem.id)) {
                    const removals = this.parentChain.length - (index + 1)
                    if (removals > 0) {
                        this.parentChain.splice(index + 1, removals)
                    }
                    this.closeOtherMenus(
                        ancestor as PulldownMenuContainer,
                        menuItem
                    )
                    this.parentChain.push(menuItem)
                    foundAncestor = true
                    break
                }
            }
            if (!foundAncestor) {
                this.closeAllMenus()
                this.parentChain = [menuItem]
            }
        }
        menuItem.open = true
        this.openMenu = menuItem
    }

    private closeAllMenus(
        menu: PulldownMenuContainer = this.options.menu
    ): void {
        menu.content.forEach(item => {
            if (item.type === "menu" && item.open) {
                item.open = false
                if (item.content) {
                    this.closeAllMenus(item as PulldownMenuContainer)
                }
            }
        })
    }

    private closeOtherMenus(
        menu: PulldownMenuContainer,
        currentMenuItem: PulldownMenuItem
    ): void {
        menu.content.forEach(item => {
            if (item.type === "menu" && item.open) {
                if (
                    !this.parentChain.includes(item) &&
                    item.id !== currentMenuItem.id
                ) {
                    item.open = false
                }
                if (item.content) {
                    this.closeOtherMenus(
                        item as PulldownMenuContainer,
                        currentMenuItem
                    )
                }
            }
        })
    }

    private onKeydown(event: KeyboardEvent): void {
        let name = keyName(event)
        if (event.altKey) {
            name = "Alt-" + name
        }
        if (event.ctrlKey) {
            name = "Ctrl-" + name
        }
        if (event.metaKey) {
            name = "Meta-" + name
        }
        if (event.shiftKey) {
            name = "Shift-" + name
        }

        if (this.openMenu) {
            if (
                ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(
                    name
                )
            ) {
                event.preventDefault()
                event.stopPropagation()
                this.changeCursorMenuItem(name)
                return
            } else if (["Enter", " "].includes(name) && this.cursorMenuItem) {
                event.preventDefault()
                event.stopPropagation()
                const menuItem = this.cursorMenuItem
                if (menuItem.type === "menu") {
                    this.cursorMenuItem = menuItem.content?.[0] ?? null
                }
                this.executeMenuItem(menuItem)
                return
            } else if (name === "Escape") {
                event.preventDefault()
                event.stopPropagation()
                this.closeAllMenus()
                this.openMenu = null
                this.parentChain = []
                this.cursorMenuItem = null
                this.update()
                if (this.options.onClose) {
                    this.options.onClose()
                }
                return
            }
        }

        this.checkKeys(event, this.options.menu, name)
    }

    private changeCursorMenuItem(name: string): void {
        const parent = this.parentChain[this.parentChain.length - 1]
        if (!parent || !parent.content) {
            return
        }
        if (!this.cursorMenuItem) {
            this.cursorMenuItem = parent.content[0]
        } else if (["ArrowDown", "ArrowUp"].includes(name)) {
            let index = parent.content.indexOf(this.cursorMenuItem)
            if (name === "ArrowDown") {
                index = index < parent.content.length - 1 ? index + 1 : 0
            } else {
                index = index > 0 ? index - 1 : parent.content.length - 1
            }
            this.cursorMenuItem = parent.content[index]
        } else if (name === "ArrowLeft") {
            if (this.parentChain.length > 1) {
                this.cursorMenuItem = parent
                this.parentChain.pop()
                this.closeAllMenus(
                    this.parentChain[
                        this.parentChain.length - 1
                    ] as PulldownMenuContainer
                )
            } else {
                const currentMenuIndex = this.options.menu.content.findIndex(
                    menu => menu.open
                )
                const newMenuIndex = currentMenuIndex
                    ? currentMenuIndex - 1
                    : this.options.menu.content.length - 1
                if (this.openMenu) {
                    this.openMenu.open = false
                }
                this.openMenu = this.options.menu.content[newMenuIndex]
                this.openMenu.open = true
                this.cursorMenuItem = this.openMenu.content?.[0] ?? null
                this.parentChain = [this.openMenu]
            }
        } else if (name === "ArrowRight") {
            if (this.cursorMenuItem.type === "menu") {
                const menuItem = this.cursorMenuItem
                this.cursorMenuItem = menuItem.content?.[0] ?? null
                this.executeMenuItem(menuItem)
                return
            } else {
                const currentMenuIndex = this.options.menu.content.findIndex(
                    menu => menu.open
                )
                const newMenuIndex =
                    currentMenuIndex === this.options.menu.content.length - 1
                        ? 0
                        : currentMenuIndex + 1
                if (this.openMenu) {
                    this.openMenu.open = false
                }
                this.openMenu = this.options.menu.content[newMenuIndex]
                this.openMenu.open = true
                this.cursorMenuItem = this.openMenu.content?.[0] ?? null
                this.parentChain = [this.openMenu]
            }
        }
        this.update()
    }

    private checkKeys(
        event: KeyboardEvent,
        menu: PulldownMenuContainer,
        nameKey: string
    ): void {
        menu.content.forEach(menuItem => {
            if (menuItem.keys === nameKey) {
                event.preventDefault()
                event.stopPropagation()
                this.executeMenuItem(menuItem)
            } else if (menuItem.content) {
                this.checkKeys(
                    event,
                    menuItem as PulldownMenuContainer,
                    nameKey
                )
            }
        })
    }

    update(context?: unknown): void {
        if (context !== undefined) {
            this.context = context
        }
        if (!this.barEl) {
            return
        }
        const diff = this.dd.diff(this.barEl, this.render())
        this.dd.apply(this.barEl, diff)
    }

    private getMenuHTML(menu: PulldownMenuItem): string {
        const title = resolve(menu.title, this.context)
        return `<div class="fw-pulldown fw-left fw-open"
                     role="menu"
                     aria-label="${escapeText(String(title))}"
                     title="${escapeText(String(title))}">
            <ul role="presentation">
                ${(menu.content || [])
                    .map(
                        menuItem => `
                        <li role="none">
                            ${this.getMenuItemHTML(menuItem)}
                        </li>`
                    )
                    .join("")}
            </ul>
        </div>`
    }

    private getMenuItemHTML(menuItem: PulldownMenuItem): string {
        switch (menuItem.type) {
            case "action":
                return this.getActionMenuItemHTML(menuItem)
            case "menu":
                return this.getMenuMenuItemHTML(menuItem)
            case "separator":
                return "<hr>"
            default:
                return ""
        }
    }

    private getActionMenuItemHTML(menuItem: PulldownMenuItem): string {
        const disabled = resolve(menuItem.disabled, this.context)
        const selected = resolve(menuItem.selected, this.context)
        const tooltip = menuItem.tooltip
            ? resolve(menuItem.tooltip, this.context)
            : undefined
        return `<span class="fw-pulldown-menu-item fw-pulldown-item${
            selected ? " fw-selected" : ""
        }${disabled ? " fw-disabled" : ""}${
            menuItem === this.cursorMenuItem ? " fw-cursor" : ""
        }"
        role="menuitem"
        tabindex="0"
        data-id="${menuItem.id}"
        ${disabled ? 'aria-disabled="true"' : ""}
        ${selected ? 'aria-checked="true"' : ""}
        ${tooltip ? `title="${escapeText(String(tooltip))}" aria-label="${escapeText(String(tooltip))}"` : ""}>
            ${menuItem.icon ? `<i class="fa-solid fa-${menuItem.icon}" aria-hidden="true"></i>` : ""}
            ${escapeText(String(resolve(menuItem.title, this.context)))}
        </span>`
    }

    private getMenuMenuItemHTML(menuItem: PulldownMenuItem): string {
        const disabled = resolve(menuItem.disabled, this.context)
        const selected = resolve(menuItem.selected, this.context)
        const tooltip = menuItem.tooltip
            ? resolve(menuItem.tooltip, this.context)
            : undefined
        return `<span class="fw-pulldown-menu-item fw-pulldown-item${
            selected ? " fw-selected" : ""
        }${disabled ? " fw-disabled" : ""}${
            menuItem === this.cursorMenuItem ? " fw-cursor" : ""
        }"
              role="menuitem"
              tabindex="0"
              data-id="${menuItem.id}"
              aria-haspopup="true"
              ${tooltip ? `title="${escapeText(String(tooltip))}" aria-label="${escapeText(String(tooltip))}"` : ""}>
            ${menuItem.icon ? `<i class="fa-solid fa-${menuItem.icon}" aria-hidden="true"></i>` : ""}
            ${escapeText(String(resolve(menuItem.title, this.context)))}
            <span class="fw-icon-right" aria-hidden="true"><i class="fa-solid fa-caret-right"></i></span>
        </span>
        ${menuItem.open ? this.getMenuHTML(menuItem) : ""}`
    }

    private getAccessKeyHTML(
        title: string,
        accessKey: string | undefined
    ): string {
        if (!accessKey) {
            return escapeText(title)
        }
        const index = title.toLowerCase().indexOf(accessKey.toLowerCase())
        if (index === -1) {
            return escapeText(title)
        }
        return `${escapeText(title.substring(0, index))}<span class="fw-access-key">${escapeText(title.charAt(index))}</span>${escapeText(title.substring(index + 1))}`
    }
}
