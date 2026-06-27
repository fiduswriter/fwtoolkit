import { Schema } from "prosemirror-model"
import { toggleMark } from "prosemirror-commands"

import { InlineInput } from "../src/inline_input.js"
import { icon } from "../src/inline_tools.js"

describe("InlineInput", () => {
    const schema = new Schema({
        nodes: {
            doc: { content: "field" },
            field: {
                content: "inline*",
                parseDOM: [{ tag: "p" }],
                toDOM: () => ["p", 0]
            },
            text: {},
            hard_break: {
                inline: true,
                group: "inline",
                selectable: false,
                parseDOM: [{ tag: "br" }],
                toDOM: () => ["br"]
            }
        },
        marks: {
            strong: {
                parseDOM: [{ tag: "strong" }],
                toDOM: () => ["strong", 0]
            },
            em: {
                parseDOM: [{ tag: "em" }],
                toDOM: () => ["em", 0]
            }
        }
    })

    test("creates an editor in the given DOM element", () => {
        const dom = document.createElement("div")
        const input = new InlineInput(dom, {
            schema,
            nodeType: "field"
        })
        expect(dom.querySelector(".ProseMirror")).not.toBeNull()
        expect(input.check()).toBe(true)
        expect(input.value).toBe(false)
    })

    test("renders a placeholder when empty", () => {
        const dom = document.createElement("div")
        new InlineInput(dom, {
            schema,
            nodeType: "field",
            placeholder: "Enter text"
        })
        const placeholder = dom.querySelector("[data-placeholder]")
        expect(placeholder).not.toBeNull()
        expect(placeholder!.getAttribute("data-placeholder")).toBe("Enter text")
    })

    test("exposes the current content as JSON", () => {
        const dom = document.createElement("div")
        const input = new InlineInput(dom, {
            schema,
            nodeType: "field",
            initialValue: [{ type: "text", text: "Hello" }]
        })
        const value = input.value as Array<{ type: string; text: string }>
        expect(value).toHaveLength(1)
        expect(value[0].text).toBe("Hello")
    })

    test("supports an inline formatting toolbar", () => {
        const dom = document.createElement("div")
        new InlineInput(dom, {
            schema,
            nodeType: "field",
            tools: [
                {
                    command: toggleMark(schema.marks.strong),
                    dom: icon("strong", "Strong")
                }
            ]
        })
        const toolbar = dom.querySelector(".inline-tools")
        expect(toolbar).not.toBeNull()
        expect(toolbar!.querySelector(".menuicon.strong")).not.toBeNull()
    })
})

describe("InlineTools", () => {
    test("icon creates a span with data-type", () => {
        const el = icon("strong", "Strong")
        expect(el.tagName).toBe("SPAN")
        expect(el.classList.contains("menuicon")).toBe(true)
        expect(el.classList.contains("strong")).toBe(true)
        expect(el.getAttribute("data-type")).toBe("strong")
    })
})
