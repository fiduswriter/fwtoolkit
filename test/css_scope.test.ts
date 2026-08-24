import { scopeCss } from "../src/css_scope.js"

/** Compare ignoring whitespace, since the transform normalizes it. */
const norm = (s: string) => s.replace(/\s+/g, "")

const PREFIX = "#my-host"

describe("scopeCss", () => {
    it("maps the page body to the host container", () => {
        expect(norm(scopeCss("body { width: 100% }", { prefix: PREFIX }))).toBe(
            norm("#my-host { width: 100% }")
        )
    })

    it("maps body.class selectors to the container", () => {
        expect(
            norm(
                scopeCss("body.foo header { position: fixed }", {
                    prefix: PREFIX
                })
            )
        ).toBe(norm("#my-host.foo header { position: fixed }"))
    })

    it("maps state classes onto the container", () => {
        expect(
            norm(
                scopeCss("body.state-closed #toolbar { display: none }", {
                    prefix: PREFIX
                })
            )
        ).toBe(norm("#my-host.state-closed #toolbar { display: none }"))
    })

    it("scopes body in descendant positions", () => {
        expect(
            norm(scopeCss("body .fw-foo { color: red }", { prefix: PREFIX }))
        ).toBe(norm("#my-host .fw-foo { color: red }"))
    })

    it("drops page-context html rules", () => {
        expect(
            norm(
                scopeCss('html[hc="a4"] body { width: 210mm }', {
                    prefix: PREFIX
                })
            )
        ).toBe(norm("{ width: 210mm }"))
    })

    it("leaves prefixed classes alone", () => {
        expect(
            norm(scopeCss(".fw-dialog a { color: blue }", { prefix: PREFIX }))
        ).toBe(norm(".fw-dialog a { color: blue }"))
    })

    it("scopes bare element selectors only when elements is enabled", () => {
        const css = "a, .fw-link-text { color: red }"
        expect(norm(scopeCss(css, { prefix: PREFIX }))).toBe(
            norm("a, .fw-link-text { color: red }")
        )
        expect(norm(scopeCss(css, { prefix: PREFIX, elements: true }))).toBe(
            norm(":where(#my-host) a, .fw-link-text { color: red }")
        )
    })

    it("uses :where() for element scoping so resets keep zero specificity", () => {
        const css = "div, span, h1 { margin: 0; padding: 0 }"
        expect(norm(scopeCss(css, { prefix: PREFIX, elements: true }))).toBe(
            norm(
                ":where(#my-host) div, :where(#my-host) span, :where(#my-host) h1 { margin: 0; padding: 0 }"
            )
        )
    })

    it("maps body to :where() when element scoping is enabled", () => {
        expect(
            norm(
                scopeCss("body { margin: 0 }", {
                    prefix: PREFIX,
                    elements: true
                })
            )
        ).toBe(norm(":where(#my-host) { margin: 0 }"))
        expect(
            norm(scopeCss("body { overflow: hidden }", { prefix: PREFIX }))
        ).toBe(norm("#my-host { overflow: hidden }"))
    })

    it("drops page-context html selectors without leaving a stray comma", () => {
        expect(
            norm(
                scopeCss("html, body, div { margin: 0 }", {
                    prefix: PREFIX,
                    elements: true
                })
            )
        ).toBe(norm(":where(#my-host), :where(#my-host) div { margin: 0 }"))
    })

    it("scopes inside @media while preserving the media query", () => {
        expect(
            norm(
                scopeCss(
                    "@media print { body { margin: 0 } .fw-foo { display: none } }",
                    { prefix: PREFIX }
                )
            )
        ).toBe(
            norm(
                "@media print { #my-host { margin: 0 } .fw-foo { display: none } }"
            )
        )
    })

    it("passes @keyframes through untouched", () => {
        const css =
            "@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }"
        expect(norm(scopeCss(css, { prefix: PREFIX }))).toBe(norm(css))
    })

    it("passes @font-face through untouched", () => {
        const css =
            '@font-face { font-family: X; src: url(x.woff2) format("woff2") }'
        expect(norm(scopeCss(css, { prefix: PREFIX }))).toBe(norm(css))
    })

    it("handles comma-separated selector lists", () => {
        const css = "input, textarea, button { font-family: Lato }"
        expect(norm(scopeCss(css, { prefix: PREFIX }))).toBe(norm(css))
        expect(norm(scopeCss(css, { prefix: PREFIX, elements: true }))).toBe(
            norm(
                ":where(#my-host) input, :where(#my-host) textarea, :where(#my-host) button { font-family: Lato }"
            )
        )
    })

    describe("comments", () => {
        it("keeps commas inside comments from splitting selector groups", () => {
            // Regression: a comment containing a comma ahead of a selector
            // list used to corrupt the grouping — everything up to the
            // comma inside the comment was treated as one selector and
            // leaked through unscoped.
            const css =
                "/* the caption is inline, and a colon follows */\n" +
                "figcaption p, caption p { display: inline }"
            expect(
                norm(scopeCss(css, { prefix: PREFIX, elements: true }))
            ).toBe(
                norm(
                    "/* the caption is inline, and a colon follows */ " +
                        ":where(#my-host) figcaption p, :where(#my-host) caption p { display: inline }"
                )
            )
        })

        it("scopes the first selector of a group after a comma-bearing comment", () => {
            const css = "/* sizes, in mm */\nh1, h2 { margin: 0 }"
            expect(
                norm(scopeCss(css, { prefix: PREFIX, elements: true }))
            ).toBe(
                norm(
                    "/* sizes, in mm */ :where(#my-host) h1, :where(#my-host) h2 { margin: 0 }"
                )
            )
        })

        it("preserves banner comments between rules", () => {
            const css =
                "/* License: SIL OFL */\nbody { margin: 0 }\n/* section */\ntable { border-collapse: collapse }"
            const out = scopeCss(css, { prefix: PREFIX })
            expect(out).toContain("/* License: SIL OFL */")
            expect(out).toContain("/* section */")
            // Without `elements`, bare element selectors are untouched;
            // only the banner positions and body mapping matter here.
            expect(norm(out)).toBe(
                norm(
                    "/* License: SIL OFL */ #my-host { margin: 0 } /* section */ table { border-collapse: collapse }"
                )
            )
        })

        it("collapses comments inside selector lists without leaking them", () => {
            const css = ".a /* note, with a comma */, .b { color: red }"
            const out = scopeCss(css, { prefix: PREFIX })
            expect(out).not.toContain("note")
            // Class selectors are left untouched by design; the point is
            // that both selectors survive as separate list entries.
            expect(norm(out)).toBe(norm(".a , .b { color: red }"))
        })

        it("preserves comments inside declaration bodies", () => {
            const css = "body { /* keep, this one */ margin: 0 }"
            const out = scopeCss(css, { prefix: PREFIX })
            expect(out).toContain("/* keep, this one */")
            expect(norm(out)).toBe(
                norm("#my-host { /* keep, this one */ margin: 0 }")
            )
        })

        it("handles unterminated comments without throwing", () => {
            const css = "h1 { color: red } /* trailing, unterminated"
            const out = scopeCss(css, { prefix: PREFIX, elements: true })
            expect(norm(out)).toContain(
                norm(":where(#my-host) h1 { color: red }")
            )
        })

        it("treats comment markers inside strings as literal text", () => {
            const css = 'body::after { content: "a/*b,c" }'
            expect(norm(scopeCss(css, { prefix: PREFIX }))).toBe(
                norm('#my-host::after { content: "a/*b,c" }')
            )
        })
    })
})
