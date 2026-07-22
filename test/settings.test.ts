import { apiUrl } from "../src/settings.js"

describe("apiUrl helper", () => {
    test("returns a mapped static URL unchanged", () => {
        expect(apiUrl("test.static")).toBe("/api/test/static/")
    })

    test("substitutes path parameters", () => {
        expect(apiUrl("test.dynamic", { id: "42" })).toBe(
            "/api/test/42/dynamic/"
        )
    })

    test("encodes path parameters", () => {
        expect(apiUrl("test.dynamic", { id: "a/b" })).toBe(
            "/api/test/a%2Fb/dynamic/"
        )
    })

    test("falls back to settings.apiUrl for unmapped names", () => {
        expect(apiUrl("/some/literal/path/")).toBe("/some/literal/path/")
    })

    test("throws when a required parameter is missing", () => {
        expect(() => apiUrl("test.dynamic")).toThrow(
            'Missing apiUrl param "id" for "test.dynamic"'
        )
    })
})
