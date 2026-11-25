import {readFileSync} from "node:fs"
import {join} from "node:path"
import {fileURLToPath} from "node:url"

/**
 * WCAG 2.2 contrast assertions over the Design 5 token palette.
 *
 * The palette lives in css/tokens.css; this test parses it and asserts the
 * rules documented there (green is fill-only, blue is text-safe, non-text
 * strokes reach 3:1). It fails if a future token edit breaks them.
 */

const tokensSource = readFileSync(
    join(
        fileURLToPath(new URL(".", import.meta.url)),
        "..",
        "css",
        "tokens.css"
    ),
    "utf8"
)

const token = (name: string): string => {
    const match = tokensSource.match(new RegExp(`--${name}:\\s*([^;]+);`))
    if (!match) {
        throw new Error(`Token --${name} not found in tokens.css`)
    }
    return match[1].trim()
}

const parseHex = (hex: string): [number, number, number] => {
    const value = hex.replace("#", "")
    const full =
        value.length === 3
            ? value
                  .split("")
                  .map(char => char + char)
                  .join("")
            : value
    return [
        parseInt(full.slice(0, 2), 16),
        parseInt(full.slice(2, 4), 16),
        parseInt(full.slice(4, 6), 16)
    ]
}

const channel = (value: number): number => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (rgb: [number, number, number]): number =>
    0.2126 * channel(rgb[0]) +
    0.7152 * channel(rgb[1]) +
    0.0722 * channel(rgb[2])

const contrast = (a: string, b: string): number => {
    const la = luminance(parseHex(a))
    const lb = luminance(parseHex(b))
    const [light, dark] = la > lb ? [la, lb] : [lb, la]
    return (light + 0.05) / (dark + 0.05)
}

const AA_TEXT = 4.5
const AA_LARGE_TEXT = 3
const AA_NON_TEXT = 3

describe("Design 5 palette contrast (WCAG 2.2 AA)", () => {
    test("body text passes AA on all surfaces", () => {
        for (const surface of [
            "surface",
            "surface-1",
            "surface-2",
            "surface-3"
        ]) {
            expect(
                contrast(token("fw-text-primary"), token(`fw-${surface}`))
            ).toBeGreaterThanOrEqual(AA_TEXT)
        }
    })

    test("secondary text passes AA on white", () => {
        expect(
            contrast(token("fw-text-secondary"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-muted"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-secondary"), token("fw-surface-2"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("dark text on brand green passes AA", () => {
        // Brand green is used as a fill; the mock's white text would only
        // reach ~2.1:1, hence the dark on-brand text token.
        expect(
            contrast(token("fw-text-on-brand"), token("fw-brand"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-on-brand"), token("fw-brand-hover"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("decorative tertiary grey is large-text only", () => {
        // #848383 from the design: fine for large text (3:1) but not body.
        expect(
            contrast(token("fw-text-tertiary"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_LARGE_TEXT)
        expect(
            contrast(token("fw-text-tertiary"), token("fw-surface"))
        ).toBeLessThan(AA_TEXT)
    })

    test("brand green is not text-safe on white (documented rule)", () => {
        expect(contrast(token("fw-brand"), token("fw-surface"))).toBeLessThan(
            AA_TEXT
        )
    })

    test("accent blue is text-safe on white and takes white text", () => {
        expect(
            contrast(token("fw-accent"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-on-accent"), token("fw-accent"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-on-accent"), token("fw-accent-active"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("danger fill and text pass AA", () => {
        expect(
            contrast(token("fw-text-inverse"), token("fw-danger-text"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-danger-text"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("success fill takes white text", () => {
        expect(
            contrast(token("fw-text-inverse"), token("fw-success"))
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("non-text control strokes reach 3:1 (WCAG 1.4.11)", () => {
        expect(
            contrast(token("fw-border-control"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_NON_TEXT)
        expect(
            contrast(token("fw-border-strong"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_NON_TEXT)
    })

    test("focus ring reaches 3:1 against white and brand fills", () => {
        expect(
            contrast(token("fw-focus"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_NON_TEXT)
        expect(
            contrast(token("fw-focus"), token("fw-surface-2"))
        ).toBeGreaterThanOrEqual(AA_NON_TEXT)
    })

    test("selected-row tint keeps primary text readable", () => {
        // The 10% brand tint resolves to ~#edfaef on white.
        expect(
            contrast(token("fw-text-primary"), "edfaef")
        ).toBeGreaterThanOrEqual(AA_TEXT)
        expect(
            contrast(token("fw-text-on-brand"), "edfaef")
        ).toBeGreaterThanOrEqual(AA_TEXT)
    })

    test("dialog title (display size) meets the large-text bar", () => {
        expect(
            contrast(token("fw-text-primary"), token("fw-surface"))
        ).toBeGreaterThanOrEqual(AA_LARGE_TEXT)
    })
})
