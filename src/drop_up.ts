import {escapeText} from "./basic.js"

export interface DropUpOption {
    title: string
    className?: string
    action: () => void
}

export interface DropUpOptions {
    options: DropUpOption[]
    head?: string
    onClose?: () => void
}

export class DropUp {
    options: DropUpOptions
    focusedIndex: number
    element: HTMLElement
    listElement: HTMLElement
    isOpen: boolean

    constructor(options: DropUpOptions) {
        this.options = options
        this.focusedIndex = -1
        this.isOpen = false
        this.element = this.buildElement()
        this.listElement = this.element.querySelector(
            ".fw-drop-up-options"
        ) as HTMLElement
        this.bindEvents()
    }

    private buildElement(): HTMLElement {
        const container = document.createElement("span")
        container.classList.add("fw-drop-up-outer")

        const inner = document.createElement("div")
        inner.classList.add("fw-drop-up-inner")

        if (this.options.head) {
            const head = document.createElement("div")
            head.classList.add("fw-drop-up-head")
            head.innerHTML = this.options.head
            inner.appendChild(head)
        }

        const list = document.createElement("ul")
        list.classList.add("fw-drop-up-options")
        list.setAttribute("role", "menu")
        list.setAttribute("tabindex", "0")

        this.options.options.forEach((option, index) => {
            const li = document.createElement("li")
            li.classList.add("fw-drop-up-option")
            if (option.className) {
                option.className.split(/\s+/).forEach(cls => {
                    if (cls) {
                        li.classList.add(cls)
                    }
                })
            }
            li.setAttribute("role", "menuitem")
            li.setAttribute("tabindex", "-1")
            li.setAttribute("data-index", String(index))
            li.innerHTML = escapeText(option.title)
            list.appendChild(li)
        })

        inner.appendChild(list)
        container.appendChild(inner)

        return container
    }

    render(): HTMLElement {
        return this.element
    }

    private bindEvents(): void {
        const options = Array.from(
            this.listElement.querySelectorAll(".fw-drop-up-option")
        )

        options.forEach((option, index) => {
            option.addEventListener("mouseenter", () => {
                this.focusOption(index)
            })

            option.addEventListener("mouseleave", () => {
                this.unfocusOption(index)
            })

            option.addEventListener("click", event => {
                event.preventDefault()
                this.activateOption(index)
            })

            option.addEventListener("mousedown", event => {
                event.preventDefault()
                event.stopPropagation()
            })
        })

        this.listElement.addEventListener("keydown", event => {
            this.handleKeyDown(event)
        })

        this.listElement.addEventListener("blur", () => {
            requestAnimationFrame(() => {
                if (!this.element.contains(document.activeElement)) {
                    this.close()
                }
            })
        })

        this.element.addEventListener("mousedown", event => {
            event.stopPropagation()
        })
    }

    open(): void {
        this.isOpen = true
        this.element.classList.add("fw-drop-up-open")
        this.focusOption(0)
    }

    close(): void {
        this.isOpen = false
        this.element.classList.remove("fw-drop-up-open")
        this.focusedIndex = -1
        this.updateFocusedOption()
        if (this.options.onClose) {
            this.options.onClose()
        }
    }

    focusOption(index: number): void {
        const options = Array.from(
            this.listElement.querySelectorAll(".fw-drop-up-option")
        )
        if (index < 0 || index >= options.length) {
            return
        }
        this.focusedIndex = index
        this.updateFocusedOption()
        const active = options[index] as HTMLElement
        active.focus()
    }

    private unfocusOption(index: number): void {
        const options = Array.from(
            this.listElement.querySelectorAll(".fw-drop-up-option")
        )
        if (options[index]) {
            options[index].classList.remove("focused")
        }
        if (this.focusedIndex === index) {
            this.focusedIndex = -1
        }
    }

    private updateFocusedOption(): void {
        const options = Array.from(
            this.listElement.querySelectorAll(".fw-drop-up-option")
        )
        options.forEach(option => option.classList.remove("focused"))
        if (
            this.focusedIndex >= 0 &&
            this.focusedIndex < options.length
        ) {
            options[this.focusedIndex].classList.add("focused")
        }
    }

    private activateOption(index: number): void {
        const option = this.options.options[index]
        if (option && option.action) {
            option.action()
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const optionCount = this.options.options.length
        if (optionCount === 0) {
            return
        }

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault()
                event.stopPropagation()
                this.focusedIndex =
                    (this.focusedIndex + 1) % optionCount
                this.focusOption(this.focusedIndex)
                break
            case "ArrowUp":
                event.preventDefault()
                event.stopPropagation()
                this.focusedIndex =
                    (this.focusedIndex - 1 + optionCount) % optionCount
                this.focusOption(this.focusedIndex)
                break
            case "Enter":
            case " ":
                event.preventDefault()
                event.stopPropagation()
                if (this.focusedIndex >= 0) {
                    this.activateOption(this.focusedIndex)
                }
                break
            case "Escape":
                event.preventDefault()
                event.stopPropagation()
                this.close()
                break
            case "Home":
                event.preventDefault()
                event.stopPropagation()
                this.focusOption(0)
                break
            case "End":
                event.preventDefault()
                event.stopPropagation()
                this.focusOption(optionCount - 1)
                break
            default:
                break
        }
    }
}
