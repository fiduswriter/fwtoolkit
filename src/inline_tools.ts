import type {EditorState, Transaction} from "prosemirror-state"
import {Plugin} from "prosemirror-state"
import type {EditorView} from "prosemirror-view"

type Command = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView
) => boolean

export interface InlineToolItem {
    command: Command
    dom: HTMLElement
}

export const icon = (text: string, name: string): HTMLElement => {
    const span = document.createElement("span")
    span.className = "menuicon " + text
    span.title = name
    span.textContent = text
    span.setAttribute("data-type", text)
    return span
}

class MenuView {
    items: InlineToolItem[]
    editorView: EditorView
    dom: HTMLElement

    constructor(items: InlineToolItem[], view: EditorView) {
        this.items = items
        this.editorView = view

        this.dom = document.createElement("div")
        this.dom.className = "inline-tools"
        items.forEach(({dom}) => this.dom.appendChild(dom))

        this.dom.addEventListener("mousedown", e => {
            e.preventDefault()
            view.focus()
            items.forEach(({command, dom}) => {
                if (dom.contains(e.target as Node)) {
                    command(view.state, view.dispatch, view)
                }
            })
        })

        this.update(view)
    }

    update(view: EditorView) {
        const activeMarks: Record<string, boolean> = {}

        const storedMarks =
            view.state?.storedMarks || view.state?.selection.$head.marks()
        if (storedMarks) {
            for (const mark of storedMarks) {
                activeMarks[mark.type.name] = true
            }
        }

        this.items.forEach(({dom}) => {
            if (activeMarks[dom.getAttribute("data-type") as string]) {
                dom.classList.add("fw-active")
            } else {
                dom.classList.remove("fw-active")
            }
        })
    }

    destroy() {
        this.dom.remove()
    }
}

export const InlineTools = (tools: InlineToolItem[]): Plugin =>
    new Plugin({
        view(view: EditorView) {
            const menuView = new MenuView(tools, view)
            view.dom.parentNode!.appendChild(menuView.dom)
            return menuView
        }
    })
