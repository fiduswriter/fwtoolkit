import { getCookie } from "../src/network.js"

describe("network helpers", () => {
    test("getCookie returns the value of an existing cookie", () => {
        document.cookie = "testcookie=testvalue; path=/"
        expect(getCookie("testcookie")).toBe("testvalue")
    })

    test("getCookie returns null for a missing cookie", () => {
        expect(getCookie("nonexistent")).toBeNull()
    })
})
