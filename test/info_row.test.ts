import { InfoRow } from "../src/info_row.js"

describe("InfoRow", () => {
    test("returns a compact table row without help text", () => {
        const row = new InfoRow({ label: "Title", fieldClass: "title" })
        const html = row.html()
        expect(html).toContain("fw-tablerow-title")
        expect(html).toContain("Title")
        expect(html).toContain('class="fw-entry-field title"')
        expect(html).not.toContain("fw-wtooltip")
    })

    test("includes an accessible info-icon tooltip when helpText is provided", () => {
        const row = new InfoRow({
            label: "Title",
            helpText: "The title of the work.",
            fieldClass: "title"
        })
        const html = row.html()
        expect(html).toContain("fw-wtooltip")
        expect(html).toContain("fw-tooltip")
        expect(html).toContain("The title of the work.")
        // Accessibility: the header is keyboard focusable and describes the
        // tooltip, and the tooltip text carries role="tooltip".
        expect(html).toContain('tabindex="0"')
        expect(html).toContain('aria-describedby="')
        expect(html).toContain('role="tooltip"')
        const id = /aria-describedby="([^"]+)"/.exec(html)![1]
        expect(html).toContain(`id="${id}"`)
    })
})
