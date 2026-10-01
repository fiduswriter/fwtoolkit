import {addAlert, deactivateWait} from "../src/basic.js"

describe("basic UI helpers", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("addAlert appends an alert element", () => {
        addAlert("info", "Hello from fwtoolkit")
        const alerts = document.querySelectorAll("#fw-alerts-wrapper li")
        expect(alerts.length).toBe(1)
        expect(alerts[0].textContent).toContain("Hello from fwtoolkit")
    })

    test("deactivateWait removes the active class and message", () => {
        const waitEl = document.createElement("div")
        waitEl.id = "fw-wait"
        waitEl.className = "fw-active fw-full"
        const messageEl = document.createElement("span")
        messageEl.className = "fw-message"
        waitEl.appendChild(messageEl)
        document.body.appendChild(waitEl)

        deactivateWait()

        expect(waitEl.classList.contains("fw-active")).toBe(false)
        expect(waitEl.querySelector("span.fw-message")).toBeNull()
    })
})
