import {DropUp} from "../src/drop_up.js"

describe("DropUp", () => {
    let container: HTMLElement

    beforeEach(() => {
        document.body.innerHTML = ""
        container = document.createElement("div")
        document.body.appendChild(container)
    })

    afterEach(() => {
        container.remove()
    })

    test("render returns a drop-up element", () => {
        const dropUp = new DropUp({
            options: [{title: "Edit", action: () => {}}]
        })
        const el = dropUp.render()
        expect(el.classList.contains("fw-drop-up-outer")).toBe(true)
        expect(el.querySelector(".fw-drop-up-options")).not.toBeNull()
        expect(el.textContent).toContain("Edit")
    })

    test("render includes head HTML", () => {
        const dropUp = new DropUp({
            head: "<span class=\"title\">Contributor</span>",
            options: [{title: "Edit", action: () => {}}]
        })
        const el = dropUp.render()
        expect(el.querySelector(".fw-drop-up-head")).not.toBeNull()
        expect(el.querySelector(".title")?.textContent).toBe("Contributor")
    })

    test("open focuses the first option", () => {
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => {}},
                {title: "Remove", action: () => {}}
            ]
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        const options = container.querySelectorAll(".fw-drop-up-option")
        expect(options[0].classList.contains("fw-focused")).toBe(true)
    })

    test("focusOption updates focused class", () => {
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => {}},
                {title: "Remove", action: () => {}}
            ]
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        dropUp.focusOption(1)
        const options = container.querySelectorAll(".fw-drop-up-option")
        expect(options[0].classList.contains("fw-focused")).toBe(false)
        expect(options[1].classList.contains("fw-focused")).toBe(true)
    })

    test("clicking an option triggers its action", () => {
        const actions: string[] = []
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => actions.push("edit")},
                {title: "Remove", action: () => actions.push("remove")}
            ]
        })
        container.appendChild(dropUp.render())
        const options = container.querySelectorAll(".fw-drop-up-option")
        ;(options[1] as HTMLElement).click()
        expect(actions).toEqual(["remove"])
    })

    test("keyboard navigation with ArrowDown wraps around", () => {
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => {}},
                {title: "Remove", action: () => {}}
            ]
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        const list = container.querySelector(".fw-drop-up-options") as HTMLElement
        list.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown"}))
        const options = container.querySelectorAll(".fw-drop-up-option")
        expect(options[1].classList.contains("fw-focused")).toBe(true)
    })

    test("keyboard Enter activates focused option", () => {
        const actions: string[] = []
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => actions.push("edit")},
                {title: "Remove", action: () => actions.push("remove")}
            ]
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        dropUp.focusOption(1)
        const list = container.querySelector(".fw-drop-up-options") as HTMLElement
        list.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter"}))
        expect(actions).toEqual(["remove"])
    })

    test("Escape closes the drop-up", () => {
        let closed = false
        const onClose = () => {
            closed = true
        }
        const dropUp = new DropUp({
            options: [{title: "Edit", action: () => {}}],
            onClose
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        const list = container.querySelector(".fw-drop-up-options") as HTMLElement
        list.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}))
        expect(dropUp.isOpen).toBe(false)
        expect(closed).toBe(true)
    })

    test("close resets focused state", () => {
        const dropUp = new DropUp({
            options: [
                {title: "Edit", action: () => {}},
                {title: "Remove", action: () => {}}
            ]
        })
        container.appendChild(dropUp.render())
        dropUp.open()
        dropUp.close()
        const options = container.querySelectorAll(".fw-drop-up-option")
        options.forEach(option => {
            expect(option.classList.contains("fw-focused")).toBe(false)
        })
    })

    test("className is applied to option", () => {
        const dropUp = new DropUp({
            options: [
                {title: "Edit", className: "edit-option", action: () => {}}
            ]
        })
        const el = dropUp.render()
        expect(el.querySelector(".edit-option")).not.toBeNull()
    })
})
