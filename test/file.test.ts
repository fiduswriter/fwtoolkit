import { shortFileTitle, longFilePath } from "../src/file/tools.js"

describe("file path helpers", () => {
    test("shortFileTitle returns the title when path ends with /", () => {
        expect(shortFileTitle("document.txt", "/home/user/")).toBe(
            "document.txt"
        )
    })

    test("shortFileTitle returns the last path segment otherwise", () => {
        expect(shortFileTitle("ignored", "/home/user/document.txt")).toBe(
            "document.txt"
        )
    })

    test("longFilePath appends title when directory ends with /", () => {
        expect(longFilePath("document.txt", "/home/user/")).toBe(
            "/home/user/document.txt"
        )
    })
})
