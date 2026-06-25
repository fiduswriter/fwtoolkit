import {TypeSwitch} from "../src/type_switch.js"

describe("TypeSwitch", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("renders initial mode 1 content", () => {
        const dom = document.createElement("div")
        const ts = new TypeSwitch({
            dom,
            label1: "A",
            label2: "B",
            render1: () => "<input class='mode1-input'>",
            render2: () => "<input class='mode2-input'>"
        })
        expect(ts.mode).toBe(1)
        expect(dom.querySelector(".mode1-input")).not.toBeNull()
        expect(dom.querySelector(".mode2-input")).toBeNull()
    })

    test("switchMode toggles content and calls onChange", () => {
        const calls: (1 | 2)[] = []
        const onChange = (mode: 1 | 2) => calls.push(mode)
        const dom = document.createElement("div")
        const ts = new TypeSwitch({
            dom,
            label1: "A",
            label2: "B",
            render1: () => "<span>one</span>",
            render2: () => "<span>two</span>",
            onChange
        })
        ts.switchMode()
        expect(ts.mode).toBe(2)
        expect(dom.textContent).toContain("two")
        expect(calls).toEqual([2])
    })

    test("mode setter ignores repeated values", () => {
        const calls: (1 | 2)[] = []
        const onChange = (mode: 1 | 2) => calls.push(mode)
        const dom = document.createElement("div")
        const ts = new TypeSwitch({
            dom,
            label1: "A",
            label2: "B",
            render1: () => "",
            render2: () => "",
            onChange
        })
        ts.mode = 1
        expect(calls).toEqual([])
    })
})
