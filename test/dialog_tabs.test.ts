import {DialogTabs} from "../src/dialog_tabs.js"

describe("DialogTabs", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("render returns nav and panels", () => {
        const tabs = new DialogTabs([
            {title: "First", template: () => "<p>first body</p>"},
            {title: "Second", template: () => "<p>second body</p>"}
        ])
        const html = tabs.render()
        expect(html).toContain("First")
        expect(html).toContain("Second")
        expect(html).toContain("first body")
        expect(html).toContain("second body")
    })

    test("bind shows first tab and switches on click", () => {
        const container = document.createElement("div")
        container.innerHTML = new DialogTabs([
            {title: "A", template: () => "<p>a</p>"},
            {title: "B", template: () => "<p>b</p>"}
        ]).render()
        document.body.appendChild(container)

        const tabs = new DialogTabs([
            {title: "A", template: () => "<p>a</p>"},
            {title: "B", template: () => "<p>b</p>"}
        ])
        tabs.bind(container)

        const panels = container.querySelectorAll(".fw-tab-content")
        expect((panels[0] as HTMLElement).style.display).not.toBe("none")
        expect((panels[1] as HTMLElement).style.display).toBe("none")

        const secondLink = container.querySelectorAll(".fw-tab-link a")[1]
        secondLink.dispatchEvent(new MouseEvent("click", {bubbles: true}))

        expect((panels[0] as HTMLElement).style.display).toBe("none")
        expect((panels[1] as HTMLElement).style.display).not.toBe("none")
    })
})
