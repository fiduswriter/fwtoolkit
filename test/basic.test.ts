import {addAlert, deactivateWait} from "../src/basic.js"

describe("basic UI helpers", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("addAlert appends an alert element", () => {
        addAlert("info", "Hello from fwtoolkit")
        const alerts = document.querySelectorAll(".alerts-info")
        expect(alerts.length).toBe(1)
        expect(alerts[0].textContent).toContain("Hello from fwtoolkit")
    })

    test("deactivateWait removes the active class and message", () => {
        const waitEl = document.createElement("div")
        waitEl.id = "wait"
        waitEl.className = "active full"
        const messageEl = document.createElement("span")
        messageEl.className = "message"
        waitEl.appendChild(messageEl)
        document.body.appendChild(waitEl)

        deactivateWait()

        expect(waitEl.classList.contains("active")).toBe(false)
        expect(waitEl.querySelector("span.message")).toBeNull()
    })
})
