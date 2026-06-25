import {InputList} from "../src/input_list.js"

describe("InputList", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("uses empty value when no initial values are given", () => {
        const dom = document.createElement("div")
        new InputList<string>({
            dom,
            emptyValue: "",
            renderItem: value => ({html: `<input value="${value}">`}),
            getValue: el => (el.querySelector("input") as HTMLInputElement).value
        })
        const inputs = dom.querySelectorAll("input")
        expect(inputs.length).toBe(1)
        expect((inputs[0] as HTMLInputElement).value).toBe("")
    })

    test("renders provided initial values", () => {
        const dom = document.createElement("div")
        new InputList<string>({
            dom,
            initialValues: ["a", "b"],
            emptyValue: "",
            renderItem: value => ({html: `<input value="${value}">`}),
            getValue: el => (el.querySelector("input") as HTMLInputElement).value
        })
        const inputs = dom.querySelectorAll("input")
        expect(inputs.length).toBe(2)
        expect((inputs[0] as HTMLInputElement).value).toBe("a")
        expect((inputs[1] as HTMLInputElement).value).toBe("b")
    })

    test("adds a row when plus is clicked", () => {
        const dom = document.createElement("div")
        new InputList<string>({
            dom,
            initialValues: ["a"],
            emptyValue: "",
            renderItem: value => ({html: `<input value="${value}">`}),
            getValue: el => (el.querySelector("input") as HTMLInputElement).value
        })
        const plus = dom.querySelector(".fa-plus-circle") as HTMLElement
        plus.click()
        expect(dom.querySelectorAll("input").length).toBe(2)
    })

    test("removes a row when minus is clicked", () => {
        const dom = document.createElement("div")
        new InputList<string>({
            dom,
            initialValues: ["a", "b"],
            emptyValue: "",
            renderItem: value => ({html: `<input value="${value}">`}),
            getValue: el => (el.querySelector("input") as HTMLInputElement).value
        })
        const minusButtons = dom.querySelectorAll(".fa-minus-circle")
        ;(minusButtons[1] as HTMLElement).click()
        expect(dom.querySelectorAll("input").length).toBe(1)
    })

    test("check validates values", () => {
        const dom = document.createElement("div")
        const list = new InputList<string>({
            dom,
            initialValues: ["a", ""],
            emptyValue: "",
            renderItem: value => ({html: `<input value="${value}">`}),
            getValue: el => (el.querySelector("input") as HTMLInputElement).value,
            validate: value => value.length > 0
        })
        expect(list.check()).toBe(false)
        expect(dom.querySelectorAll("tr.fw-form-error").length).toBe(1)
    })
})
