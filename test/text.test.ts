import {escapeText, unescapeText, noSpaceTmp} from "../src/basic.js"

describe("text helpers", () => {
    test("escapeText escapes HTML entities", () => {
        expect(escapeText("<div>Tom & Jerry</div>")).toBe(
            "&lt;div&gt;Tom &amp; Jerry&lt;/div&gt;"
        )
    })

    test("unescapeText reverses escapeText", () => {
        const original = "<p>Tom & Jerry</p>"
        expect(unescapeText(escapeText(original))).toBe(original)
    })

    test("noSpaceTmp trims leading whitespace and removes newlines", () => {
        const name = "world"
        expect(noSpaceTmp`  hello
        ${name}`).toBe("helloworld")
    })
})
