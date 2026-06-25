import {ensureCSS} from "./network.js"
import {escapeText} from "./basic.js"

export interface DialogTab {
    id?: string
    title: string
    description?: string
    template: () => string
}

export interface DialogTabsOptions {
    containerId?: string
    onShow?: (index: number) => void
}

/**
 * Reusable tab switcher for dialog content.
 *
 * Renders a `.fw-tabs-nav` list plus `.fw-tab-content.fw-tabs-panel` panels and
 * handles switching between them.
 */
export class DialogTabs {
    tabs: DialogTab[]
    options: DialogTabsOptions

    constructor(tabs: DialogTab[], options: DialogTabsOptions = {}) {
        this.tabs = tabs
        this.options = options
        ensureCSS(staticUrl("css/ui_tabs.css"))
    }

    /**
     * Generate the tab HTML. The caller is responsible for wrapping it in a
     * container element if needed.
     */
    render(): string {
        const {containerId} = this.options
        const wrapperAttrs = containerId ? ` id="${containerId}"` : ""
        return `<div${wrapperAttrs}>
            <ul class="fw-tabs-nav">
                ${this.tabs
                    .map(
                        (tab, index) =>
                            `<li class="fw-tab-link ${index === 0 ? "fw-current-tab" : ""}">
                                <a href="#${this.tabId(index, tab)}" class="fw-tab-link-inner" title="${escapeText(
                                    tab.description || ""
                                )}">
                                    ${escapeText(tab.title)}
                                </a>
                            </li>`
                    )
                    .join("")}
            </ul>
            ${this.tabs
                .map(
                    (tab, index) =>
                        `<div class="fw-tab-content fw-tabs-panel" id="${this.tabId(
                            index,
                            tab
                        )}" title="${escapeText(tab.description || "")}">
                            ${tab.template()}
                        </div>`
                )
                .join("")}
        </div>`
    }

    /**
     * Wire click handlers on the tab links inside `container` and show the
     * first tab. Call this after the rendered HTML has been inserted into the
     * DOM.
     */
    bind(container: HTMLElement): void {
        const tabLinks = Array.from(
            container.querySelectorAll(".fw-tabs-nav .fw-tab-link a")
        )
        tabLinks.forEach((linkEl, index) => {
            linkEl.addEventListener("click", event => {
                event.preventDefault()
                this.showTab(index, container)
            })
        })
        this.showTab(0, container)
    }

    /**
     * Show the tab at the given index and hide all others.
     */
    showTab(index: number, container?: HTMLElement): void {
        if (index < 0 || index >= this.tabs.length) {
            return
        }
        const tabContainer = container || this.findContainer()
        if (!tabContainer) {
            return
        }
        const targetId = this.tabId(index, this.tabs[index])

        tabContainer
            .querySelectorAll(".fw-tabs-nav .fw-tab-link")
            .forEach((tabLink, tabIndex) => {
                if (tabIndex === index) {
                    tabLink.classList.add("fw-current-tab")
                } else {
                    tabLink.classList.remove("fw-current-tab")
                }
            })

        tabContainer.querySelectorAll(".fw-tab-content").forEach(contentEl => {
            if ((contentEl as HTMLElement).id === targetId) {
                ;(contentEl as HTMLElement).style.display = ""
            } else {
                ;(contentEl as HTMLElement).style.display = "none"
            }
        })

        if (this.options.onShow) {
            this.options.onShow(index)
        }
    }

    private tabId(index: number, tab: DialogTab): string {
        return tab.id || `dialog-tab-${index}`
    }

    private findContainer(): HTMLElement | null {
        const {containerId} = this.options
        if (containerId) {
            return document.getElementById(containerId)
        }
        return document.querySelector(".fw-tabs-nav")?.closest("div") || null
    }
}
