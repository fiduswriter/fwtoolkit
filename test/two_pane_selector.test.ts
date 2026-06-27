import { TwoPaneSelector } from "../src/two_pane_selector.js"

describe("TwoPaneSelector", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("renders available and selected items", () => {
        const dom = document.createElement("div")
        const selector = new TwoPaneSelector<string>({
            dom,
            availableItems: ["a", "b"],
            selectedItems: ["c"],
            renderItem: item => `<span>${item}</span>`,
            getItemId: item => item
        })
        expect(dom.textContent).toContain("a")
        expect(dom.textContent).toContain("b")
        expect(dom.textContent).toContain("c")
        expect(selector.selectedItems).toEqual(["c"])
    })

    test("add button moves selected available items", () => {
        const dom = document.createElement("div")
        const selector = new TwoPaneSelector<string>({
            dom,
            availableItems: ["a", "b"],
            selectedItems: [],
            renderItem: item => `<span>${item}</span>`,
            getItemId: item => item
        })
        const leftItems = dom.querySelectorAll(
            '.fw-two-pane-list[data-pane="left"] .fw-two-pane-item'
        )
        ;(leftItems[0] as HTMLElement).click()
        dom.querySelector(".fw-two-pane-add")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true })
        )
        expect(selector.selectedItems).toEqual(["a"])
        expect(
            dom.querySelector(
                '.fw-two-pane-list[data-pane="left"] [data-id="a"]'
            )
        ).toBeNull()
    })

    test("remove button moves selected items back", () => {
        const dom = document.createElement("div")
        const selector = new TwoPaneSelector<string>({
            dom,
            availableItems: ["a"],
            selectedItems: ["b"],
            renderItem: item => `<span>${item}</span>`,
            getItemId: item => item,
            removeButtonTitle: "Remove"
        })
        const rightItems = dom.querySelectorAll(
            '.fw-two-pane-list[data-pane="right"] .fw-two-pane-item'
        )
        ;(rightItems[0] as HTMLElement).click()
        dom.querySelector(".fw-two-pane-remove")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true })
        )
        expect(selector.selectedItems).toEqual([])
        expect(
            dom.querySelector(
                '.fw-two-pane-list[data-pane="left"] [data-id="b"]'
            )
        ).not.toBeNull()
    })
})
