import { OverviewDataTable } from "../src/datatable/overview.js"
import { SelectionDataTable } from "../src/datatable/selection.js"

describe("OverviewDataTable", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("renders a table with checkboxes and reports selected ids", () => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const dt = new OverviewDataTable({
            dom,
            columns: [
                { select: 0, hidden: true },
                { select: 1, sortable: false },
                { select: 2, title: "Name" },
                { select: 3, title: "Email" },
                { select: 4, title: "Date" }
            ],
            data: [
                {
                    cells: [
                        1,
                        false,
                        "Alice",
                        "alice@example.com",
                        "2024-01-15"
                    ]
                },
                { cells: [2, false, "Bob", "bob@example.com", "2024-02-20"] }
            ]
        })
        dt.init()

        const table = dom.querySelector("table.fw-data-table")
        expect(table).not.toBeNull()
        expect(dom.querySelectorAll("input.entry-select").length).toBe(2)
        expect(dt.getSelected()).toEqual([])
    })

    test("removeRows deletes rows by id", () => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const dt = new OverviewDataTable({
            dom,
            columns: [
                { select: 0, hidden: true },
                { select: 1, sortable: false },
                { select: 2, title: "Name" }
            ],
            data: [{ cells: [1, false, "Alice"] }, { cells: [2, false, "Bob"] }]
        })
        dt.init()
        dt.removeRows([1])
        expect(dt.table?.data.data.length).toBe(1)
        expect(dt.table?.data.data[0].cells[0].text).toBe("2")
    })
})

describe("SelectionDataTable", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("selects and deselects rows by id", () => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const dt = new SelectionDataTable({
            dom,
            columns: [
                { select: 0, hidden: true, name: "id" },
                { select: 1, name: "Name" }
            ],
            data: [{ cells: ["a", "Apple"] }, { cells: ["b", "Banana"] }],
            multiple: true
        })
        dt.init()

        expect(dt.getSelected()).toEqual([])
        dt.toggleRow(0)
        expect(dt.getSelected()).toEqual(["a"])
        dt.toggleRow(1)
        expect(dt.getSelected()).toEqual(["a", "b"])
        dt.deselectAll()
        expect(dt.getSelected()).toEqual([])
    })
})
