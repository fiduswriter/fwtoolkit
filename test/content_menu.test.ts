import {ContentMenu} from "../src/content_menu.js"

describe("ContentMenu z-index", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    it("opens above a dialog whose z-index comes from the stylesheet", () => {
        // Regression: .fw-dialog carries z-index 1000 in the stylesheet, not
        // inline. Reading the inline style only made the menu land at 102,
        // under the dialog it was opened from, so its items could never be
        // clicked in a host with a dialog open.
        const style = document.createElement("style")
        style.textContent = ".fw-dialog { position: absolute; z-index: 1000; }"
        document.head.appendChild(style)
        const dialog = document.createElement("div")
        dialog.className = "fw-dialog"
        document.body.appendChild(dialog)

        const menu = new ContentMenu({
            menu: {
                content: [{type: "action", title: "Run", action: () => {}}]
            }
        })
        menu.open()

        const menuEl = document.querySelector(
            "div.fw-content-menu"
        ) as HTMLElement
        expect(menuEl).not.toBeNull()
        expect(Number.parseInt(menuEl.style.zIndex)).toBeGreaterThan(1000)

        menu.close()
        style.remove()
        dialog.remove()
    })
})
