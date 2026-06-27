import { baseKeymap, toggleMark } from "prosemirror-commands"
import { history, redo, undo } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import type { Schema } from "prosemirror-model"
import { Plugin } from "prosemirror-state"
import { EditorState } from "prosemirror-state"
import type { Transaction } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { EditorView } from "prosemirror-view"

import type { InlineToolItem } from "./inline_tools.js"
import { InlineTools } from "./inline_tools.js"

export interface InlineInputOptions {
    schema: Schema
    nodeType: string
    initialValue?: Record<string, unknown>[]
    placeholder?: string
    tools?: InlineToolItem[]
}

export class InlineInput {
    dom: HTMLElement
    schema: Schema
    nodeType: string
    placeHolder?: string
    view: EditorView

    constructor(dom: HTMLElement, options: InlineInputOptions) {
        this.dom = dom
        this.schema = options.schema
        this.nodeType = options.nodeType
        this.placeHolder = options.placeholder

        const doc = options.schema.nodeFromJSON({
            type: "doc",
            content: [
                {
                    type: options.nodeType,
                    content: options.initialValue || []
                }
            ]
        })

        const plugins = [
            history(),
            keymap({
                ...baseKeymap,
                "Mod-z": undo,
                "Mod-shift-z": undo,
                "Mod-y": redo,
                "Mod-b": () => {
                    const sMark = this.view.state.schema.marks["strong"]
                    if (!sMark) {
                        return false
                    }
                    const command = toggleMark(sMark)
                    return command(this.view.state, tr =>
                        this.view.dispatch(tr)
                    )
                },
                "Mod-i": () => {
                    const sMark = this.view.state.schema.marks["em"]
                    if (!sMark) {
                        return false
                    }
                    const command = toggleMark(sMark)
                    return command(this.view.state, tr =>
                        this.view.dispatch(tr)
                    )
                }
            })
        ]
        if (this.placeHolder) {
            plugins.push(this.placeholderPlugin())
        }
        if (options.tools?.length) {
            plugins.push(InlineTools(options.tools))
        }

        this.view = new EditorView(this.dom, {
            state: EditorState.create({
                schema: options.schema,
                doc,
                plugins
            }),
            dispatchTransaction: (tr: Transaction) => {
                const newState = this.view.state.apply(tr)
                this.view.updateState(newState)
            }
        })
    }

    get value(): Record<string, unknown>[] | false {
        const contents = this.view.state.doc.firstChild?.content.toJSON()
        return contents && contents.length ? contents : false
    }

    check(): boolean {
        return true
    }

    private placeholderPlugin(): Plugin {
        return new Plugin({
            props: {
                decorations: state => {
                    const doc = state.doc
                    if (
                        doc.childCount === 1 &&
                        doc.firstChild &&
                        doc.firstChild.isTextblock &&
                        doc.firstChild.content.size === 0 &&
                        this.placeHolder
                    ) {
                        const placeHolder = document.createElement("span")
                        placeHolder.classList.add("fw-placeholder")
                        placeHolder.classList.add("fw-selected")
                        placeHolder.setAttribute(
                            "data-placeholder",
                            this.placeHolder
                        )
                        return DecorationSet.create(doc, [
                            Decoration.widget(1, placeHolder)
                        ])
                    }
                    return null
                }
            }
        })
    }
}
