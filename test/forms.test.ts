import {initFloatingLabels} from "../src/forms.js"

const build = (value = "") => {
    document.body.innerHTML = `<div class="fw-floating-field">
        <label for="x">Label</label>
        <input type="text" id="x" placeholder=" " value="${value}">
    </div>`
    return document.querySelector(".fw-floating-field") as HTMLElement
}

describe("initFloatingLabels", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("marks a field empty when its control is empty", () => {
        const field = build("")
        initFloatingLabels()
        expect(field.classList.contains("fw-filled")).toBe(false)
    })

    test("marks a prefilled field as filled", () => {
        const field = build("hello")
        initFloatingLabels()
        expect(field.classList.contains("fw-filled")).toBe(true)
    })

    test("updates on input", () => {
        const field = build("")
        initFloatingLabels()
        const input = document.getElementById("x") as HTMLInputElement
        input.value = "typed"
        input.dispatchEvent(new Event("input", {bubbles: true}))
        expect(field.classList.contains("fw-filled")).toBe(true)
        input.value = ""
        input.dispatchEvent(new Event("input", {bubbles: true}))
        expect(field.classList.contains("fw-filled")).toBe(false)
    })

    test("mirrors the disabled state", () => {
        const field = build("")
        const input = document.getElementById("x") as HTMLInputElement
        input.disabled = true
        initFloatingLabels()
        expect(field.classList.contains("fw-disabled")).toBe(true)
    })

    test("is idempotent", () => {
        const field = build("a")
        initFloatingLabels()
        initFloatingLabels()
        expect(field.classList.contains("fw-filled")).toBe(true)
        expect(document.body.dataset.fwFloatingBound).toBe("true")
    })

    test("picks up fields added later", () => {
        initFloatingLabels()
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div class="fw-floating-field" id="late">
                <label for="y">Late</label>
                <input type="text" id="y" placeholder=" " value="v">
            </div>`
        )
        initFloatingLabels()
        expect(
            document.getElementById("late")!.classList.contains("fw-filled")
        ).toBe(true)
    })

    test("ignores checkboxes", () => {
        document.body.innerHTML = `<div class="fw-floating-field">
            <label for="c">C</label>
            <input type="checkbox" id="c">
        </div>`
        const field = document.querySelector(
            ".fw-floating-field"
        ) as HTMLElement
        initFloatingLabels()
        expect(field.classList.contains("fw-filled")).toBe(false)
    })
})
