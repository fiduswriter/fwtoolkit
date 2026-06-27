import {InfoRow} from "../src/info_row.js"

describe("InfoRow", () => {
    test("returns a compact table row without help text", () => {
        const row = new InfoRow({label: "Title", fieldClass: "title"})
        const html = row.html()
        expect(html).toContain("fw-tablerow-title")
        expect(html).toContain("Title")
        expect(html).toContain('class="fw-entry-field title"')
        expect(html).not.toContain("fw-wtooltip")
    })

    test("includes an info-icon tooltip when helpText is provided", () => {
        const row = new InfoRow({
            label: "Title",
            helpText: "The title of the work.",
            fieldClass: "title"
        })
        const html = row.html()
        expect(html).toContain("fw-wtooltip")
        expect(html).toContain("fw-tooltip")
        expect(html).toContain("The title of the work.")
    })
})
