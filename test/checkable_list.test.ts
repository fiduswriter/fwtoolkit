import {CheckableList} from "../src/checkable_list.js"

describe("CheckableList", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("renders options with initial selection", () => {
        const dom = document.createElement("div")
        const list = new CheckableList({
            dom,
            options: [
                {id: 1, label: "One"},
                {id: 2, label: "Two"}
            ],
            initialValue: [1]
        })
        const items = dom.querySelectorAll(".fw-checkable-label")
        expect(items.length).toBe(2)
        expect(items[0].classList.contains("fw-checked")).toBe(true)
        expect(items[1].classList.contains("fw-checked")).toBe(false)
        expect(list.value).toEqual([1])
    })

    test("single selection switches value", () => {
        const dom = document.createElement("div")
        const list = new CheckableList({
            dom,
            options: [
                {id: 1, label: "One"},
                {id: 2, label: "Two"}
            ],
            initialValue: [1]
        })
        const items = dom.querySelectorAll(".fw-checkable-label")
        ;(items[1] as HTMLElement).click()
        expect(list.value).toEqual([2])
        expect(items[0].classList.contains("fw-checked")).toBe(false)
    })

    test("multiple selection accumulates values", () => {
        const dom = document.createElement("div")
        const list = new CheckableList({
            dom,
            options: [
                {id: 1, label: "One"},
                {id: 2, label: "Two"}
            ],
            multiple: true
        })
        const items = dom.querySelectorAll(".fw-checkable-label")
        ;(items[0] as HTMLElement).click()
        ;(items[1] as HTMLElement).click()
        expect(list.value).toEqual([1, 2])
    })
})
