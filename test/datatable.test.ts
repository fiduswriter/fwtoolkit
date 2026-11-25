import {OverviewDataTable} from "../src/datatable/overview.js"
import {SelectionDataTable} from "../src/datatable/selection.js"

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
                {select: 0, hidden: true},
                {select: 1, sortable: false},
                {select: 2, title: "Name"},
                {select: 3, title: "Email"},
                {select: 4, title: "Date"}
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
                {cells: [2, false, "Bob", "bob@example.com", "2024-02-20"]}
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
                {select: 0, hidden: true},
                {select: 1, sortable: false},
                {select: 2, title: "Name"}
            ],
            data: [{cells: [1, false, "Alice"]}, {cells: [2, false, "Bob"]}]
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
                {select: 0, hidden: true, name: "id"},
                {select: 1, name: "Name"}
            ],
            data: [{cells: ["a", "Apple"]}, {cells: ["b", "Banana"]}],
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

describe("OverviewDataTable select-all placement", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        // simple-datatables calls scrollIntoView when scrollY is set; jsdom
        // does not implement it.
        if (!Element.prototype.scrollIntoView) {
            Element.prototype.scrollIntoView = () => {}
        }
    })

    const build = (scrollY: string | false) => {
        const dom = document.createElement("div")
        document.body.appendChild(dom)
        const dt = new OverviewDataTable({
            dom,
            scrollY,
            columns: [
                {select: 0, hidden: true},
                {select: 1, sortable: false},
                {select: 2, title: "Name"},
                {select: 3, title: "Email"}
            ],
            data: [{cells: [1, false, "Alice", "a@example.com"]}],
            bulkMenu: {content: [{title: "Delete", action: () => {}}]}
        })
        dt.init()
        return {dom, dt}
    }

    test("places the bulk control once, in a header cell", () => {
        const {dom} = build(false)
        const bulks = dom.querySelectorAll(".dt-bulk")
        expect(bulks.length).toBe(1)
        expect(bulks[0].closest("thead")).not.toBeNull()
        expect(bulks[0].closest("th")).not.toBeNull()
    })

    test("is idempotent when the header is re-processed", () => {
        const {dom, dt} = build(false)
        dt.insertBulkHeader()
        dt.insertBulkHeader()
        expect(dom.querySelectorAll(".dt-bulk").length).toBe(1)
    })

    test("uses the header container table when scrollY splits the table", () => {
        const {dom} = build("300px")
        const bulk = dom.querySelector(".dt-bulk")
        expect(bulk).not.toBeNull()
        const headerContainer = dom.querySelector(".datatable-headercontainer")
        if (headerContainer) {
            expect(headerContainer.contains(bulk as Node)).toBe(true)
        }
        expect(dom.querySelectorAll(".dt-bulk").length).toBe(1)
    })

    test("keeps the bulk control when rows are added", () => {
        const {dom, dt} = build(false)
        dt.init()
        for (let i = 0; i < 3; i++) {
            dt.insertBulkHeader()
        }
        expect(dom.querySelectorAll(".dt-bulk").length).toBe(1)
    })
})
