import {convertDataURIToBlob} from "../src/blob.js"

describe("blob helpers", () => {
    test("convertDataURIToBlob converts a data URI to a Blob", () => {
        const dataURI = "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=="
        const blob = convertDataURIToBlob(dataURI)
        expect(blob).toBeInstanceOf(Blob)
        expect(blob.type).toBe("text/plain")
    })
})
