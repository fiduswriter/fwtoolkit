import {jest} from "@jest/globals"

import {PulldownMenu, PulldownMenuItem} from "../src/pulldown_menu.js"

describe("PulldownMenu", () => {
    let container: HTMLElement

    beforeEach(() => {
        document.body.innerHTML = ""
        container = document.createElement("div")
        document.body.appendChild(container)
    })

    afterEach(() => {
        container.remove()
    })

    function makeMenu(actions: string[] = []): {
        menu: {content: PulldownMenuItem[]}
    } {
        return {
            menu: {
                content: [
                    {
                        id: "file",
                        title: "File",
                        type: "menu",
                        content: [
                            {
                                id: "new",
                                title: "New",
                                type: "action",
                                action: () => actions.push("new")
                            },
                            {
                                id: "open",
                                title: "Open",
                                type: "action",
                                action: () => actions.push("open")
                            },
                            {
                                id: "sep",
                                type: "separator"
                            },
                            {
                                id: "recent",
                                title: "Recent",
                                type: "menu",
                                content: [
                                    {
                                        id: "doc1",
                                        title: "Doc 1",
                                        type: "action",
                                        action: () => actions.push("doc1")
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "edit",
                        title: "Edit",
                        type: "menu",
                        content: [
                            {
                                id: "undo",
                                title: "Undo",
                                type: "action",
                                keys: "Ctrl-z",
                                action: () => actions.push("undo")
                            }
                        ]
                    }
                ]
            }
        }
    }

    test("render returns a menu bar with headers", () => {
        const pulldown = new PulldownMenu(makeMenu())
        const html = pulldown.render()
        expect(html).toContain("fw-pulldown-menu-bar")
        expect(html).toContain("File")
        expect(html).toContain("Edit")
    })

    test("bind renders into the container", () => {
        const pulldown = new PulldownMenu(makeMenu())
        pulldown.bind(container)
        expect(container.querySelector(".fw-pulldown-menu-bar")).not.toBeNull()
        expect(container.textContent).toContain("File")
    })

    test("clicking a header opens its pulldown", () => {
        const pulldown = new PulldownMenu(makeMenu())
        pulldown.bind(container)
        const fileHeader = container.querySelector(
            '[data-id="file"] .fw-pulldown-menu-title'
        ) as HTMLElement
        fileHeader.click()
        const openMenus = container.querySelectorAll(".fw-pulldown.fw-open")
        expect(openMenus.length).toBe(1)
        expect(openMenus[0].textContent).toContain("New")
    })

    test("clicking an action item executes and closes the menu", () => {
        const actions: string[] = []
        const pulldown = new PulldownMenu({...makeMenu(actions)})
        pulldown.bind(container)
        ;(
            container.querySelector(
                '[data-id="file"] .fw-pulldown-menu-title'
            ) as HTMLElement
        ).click()
        ;(container.querySelector('[data-id="new"]') as HTMLElement).click()
        expect(actions).toEqual(["new"])
        expect(container.querySelector(".fw-pulldown.fw-open")).toBeNull()
    })

    test("clicking a menu item opens its submenu", () => {
        const pulldown = new PulldownMenu(makeMenu())
        pulldown.bind(container)
        ;(
            container.querySelector(
                '[data-id="file"] .fw-pulldown-menu-title'
            ) as HTMLElement
        ).click()
        ;(container.querySelector('[data-id="recent"]') as HTMLElement).click()
        const openMenus = container.querySelectorAll(".fw-pulldown.fw-open")
        expect(openMenus.length).toBe(2)
        expect(openMenus[1].textContent).toContain("Doc 1")
    })

    test("clicking outside closes all menus", () => {
        const pulldown = new PulldownMenu(makeMenu())
        pulldown.bind(container)
        ;(
            container.querySelector(
                '[data-id="file"] .fw-pulldown-menu-title'
            ) as HTMLElement
        ).click()
        expect(container.querySelector(".fw-pulldown.fw-open")).not.toBeNull()
        document.body.click()
        expect(container.querySelector(".fw-pulldown.fw-open")).toBeNull()
    })

    test("keyboard shortcut executes action", () => {
        const actions: string[] = []
        const pulldown = new PulldownMenu({...makeMenu(actions)})
        pulldown.bind(container)
        const event = new KeyboardEvent("keydown", {key: "z", ctrlKey: true})
        document.body.dispatchEvent(event)
        expect(actions).toEqual(["undo"])
    })

    test("disabled items are not actionable", () => {
        const actions: string[] = []
        const model = makeMenu(actions)
        model.menu.content[0].content![0].disabled = true
        const pulldown = new PulldownMenu(model)
        pulldown.bind(container)
        ;(
            container.querySelector(
                '[data-id="file"] .fw-pulldown-menu-title'
            ) as HTMLElement
        ).click()
        ;(container.querySelector('[data-id="new"]') as HTMLElement).click()
        expect(actions).toEqual([])
    })

    test("update refreshes rendered content with new context", () => {
        const model = {
            menu: {
                content: [
                    {
                        id: "greet",
                        title: (ctx: {name: string}) => `Hello ${ctx.name}`,
                        type: "action",
                        action: () => {}
                    } as PulldownMenuItem
                ]
            }
        }
        const pulldown = new PulldownMenu({
            menu: model.menu,
            context: {name: "World"}
        })
        pulldown.bind(container)
        expect(container.textContent).toContain("Hello World")
        pulldown.update({name: "Fidus"})
        expect(container.textContent).toContain("Hello Fidus")
    })

    test("separator renders as hr", () => {
        const pulldown = new PulldownMenu(makeMenu())
        pulldown.bind(container)
        ;(
            container.querySelector(
                '[data-id="file"] .fw-pulldown-menu-title'
            ) as HTMLElement
        ).click()
        expect(container.querySelector(".fw-pulldown hr")).not.toBeNull()
    })

    describe("viewport flip", () => {
        // jsdom's default window height is 768.
        const viewportHeight = window.innerHeight

        function makeRect(top: number, bottom: number): DOMRect {
            return {
                x: 0,
                y: top,
                top,
                bottom,
                left: 0,
                right: 100,
                width: 100,
                height: bottom - top,
                toJSON: () => ({})
            } as DOMRect
        }

        function openRecentSubmenu(): Element[] {
            const pulldown = new PulldownMenu(makeMenu())
            pulldown.bind(container)
            ;(
                container.querySelector(
                    '[data-id="file"] .fw-pulldown-menu-title'
                ) as HTMLElement
            ).click()
            ;(
                container.querySelector('[data-id="recent"]') as HTMLElement
            ).click()
            return Array.from(
                container.querySelectorAll(".fw-pulldown.fw-open")
            )
        }

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test("submenu inside the viewport is not flipped", () => {
            jest.spyOn(
                Element.prototype,
                "getBoundingClientRect"
            ).mockImplementation(function (this: Element) {
                return makeRect(100, 300)
            })
            const openMenus = openRecentSubmenu()
            expect(openMenus[1].classList.contains("fw-flip-up")).toBe(false)
        })

        test("submenu overflowing the viewport flips up", () => {
            jest.spyOn(
                Element.prototype,
                "getBoundingClientRect"
            ).mockImplementation(function (this: Element) {
                if (
                    this.classList.contains("fw-pulldown") &&
                    this.textContent?.includes("Doc 1") &&
                    !this.textContent?.includes("New")
                ) {
                    // The Recent submenu reaches past the viewport.
                    return makeRect(600, viewportHeight + 200)
                }
                if (this.tagName === "LI") {
                    // The "Recent" item the submenu is anchored to.
                    return makeRect(500, 549)
                }
                return makeRect(0, 10)
            })
            const openMenus = openRecentSubmenu()
            expect(openMenus[1].classList.contains("fw-flip-up")).toBe(true)
        })

        test("submenu with more room below than above is not flipped", () => {
            jest.spyOn(
                Element.prototype,
                "getBoundingClientRect"
            ).mockImplementation(function (this: Element) {
                if (
                    this.classList.contains("fw-pulldown") &&
                    this.textContent?.includes("Doc 1") &&
                    !this.textContent?.includes("New")
                ) {
                    return makeRect(600, viewportHeight + 200)
                }
                if (this.tagName === "LI") {
                    // Near the top: flipping would make it worse.
                    return makeRect(100, 149)
                }
                return makeRect(0, 10)
            })
            const openMenus = openRecentSubmenu()
            expect(openMenus[1].classList.contains("fw-flip-up")).toBe(false)
        })

        test("resizing the window re-evaluates the flip", () => {
            const rectSpy = jest.spyOn(
                Element.prototype,
                "getBoundingClientRect"
            )
            rectSpy.mockImplementation(function (this: Element) {
                return makeRect(100, 300)
            })
            const openMenus = openRecentSubmenu()
            expect(openMenus[1].classList.contains("fw-flip-up")).toBe(false)
            rectSpy.mockImplementation(function (this: Element) {
                if (
                    this.classList.contains("fw-pulldown") &&
                    this.textContent?.includes("Doc 1") &&
                    !this.textContent?.includes("New")
                ) {
                    return makeRect(600, viewportHeight + 200)
                }
                if (this.tagName === "LI") {
                    return makeRect(500, 549)
                }
                return makeRect(0, 10)
            })
            window.dispatchEvent(new Event("resize"))
            expect(openMenus[1].classList.contains("fw-flip-up")).toBe(true)
        })
    })
})
