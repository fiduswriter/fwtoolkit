import { jest } from "@jest/globals"
import { infoTooltip } from "../src/basic.js"
import { InfoRow } from "../src/info_row.js"
import { initTooltips } from "../src/tooltip.js"

describe("initTooltips", () => {
    beforeAll(() => {
        initTooltips()
    })

    beforeEach(() => {
        document.body.innerHTML = ""
        jest.useRealTimers()
    })

    const mountInfoTooltip = (): {
        trigger: HTMLElement
        tooltip: HTMLElement
        container: HTMLElement
        button: HTMLElement
    } => {
        const container = document.createElement("div")
        container.innerHTML = infoTooltip("Helpful text")
        document.body.appendChild(container)
        return {
            trigger: container.querySelector(".fw-info-tooltip") as HTMLElement,
            tooltip: container.querySelector(
                ".fw-info-tooltip-text"
            ) as HTMLElement,
            container,
            button: container.querySelector(
                ".fw-info-tooltip-trigger"
            ) as HTMLElement
        }
    }

    test("portals the info tooltip into document.body on hover", () => {
        const { trigger, tooltip, button } = mountInfoTooltip()
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(true)
        expect(tooltip.parentElement).toBe(document.body)
        expect(tooltip.style.position).toBe("fixed")
        expect(tooltip.style.top).toMatch(/px$/)
        expect(tooltip.style.left).toMatch(/px$/)
        expect(tooltip.style.visibility).toBe("visible")
        expect(tooltip.style.opacity).toBe("1")
    })

    test("hides and restores the info tooltip when the pointer leaves", () => {
        const { trigger, tooltip, button } = mountInfoTooltip()
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
        expect(tooltip.parentElement).toBe(document.body)
        jest.useFakeTimers()
        button.dispatchEvent(
            new MouseEvent("mouseout", {
                bubbles: true,
                relatedTarget: document.body
            })
        )
        jest.advanceTimersByTime(200)
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(false)
        expect(tooltip.parentElement).toBe(trigger)
        expect(tooltip.style.visibility).toBe("hidden")
        expect(tooltip.style.position).toBe("")
    })

    test("does not hide while focus stays inside the trigger", () => {
        const { trigger, tooltip, button } = mountInfoTooltip()
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
        expect(tooltip.parentElement).toBe(document.body)
        button.focus() // focusin keeps the tooltip alive after mouse leaves
        jest.useFakeTimers()
        button.dispatchEvent(
            new MouseEvent("mouseout", {
                bubbles: true,
                relatedTarget: document.body
            })
        )
        jest.advanceTimersByTime(200)
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(true)
        expect(tooltip.parentElement).toBe(document.body)
        expect(tooltip.style.visibility).toBe("visible")
        button.blur() // cleanup so later tests start fresh
        jest.advanceTimersByTime(200)
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(false)
    })

    test("portals the table-row tooltip on keyboard focus", () => {
        const row = new InfoRow({ label: "Title", helpText: "Help" })
        document.body.insertAdjacentHTML(
            "beforeend",
            `<table>${row.html()}</table>`
        )
        const trigger = document.querySelector(".fw-wtooltip") as HTMLElement
        const tooltip = document.querySelector(".fw-tooltip") as HTMLElement
        trigger.focus()
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(true)
        expect(tooltip.parentElement).toBe(document.body)
        expect(tooltip.style.visibility).toBe("visible")
        jest.useFakeTimers()
        trigger.blur()
        jest.advanceTimersByTime(200)
        expect(trigger.classList.contains("fw-tooltip-active")).toBe(false)
        expect(tooltip.parentElement).toBe(trigger)
    })

    test("ignores elements that are not tooltip triggers", () => {
        document.body.insertAdjacentHTML(
            "beforeend",
            '<div><button type="button">plain</button></div>'
        )
        const button = document.querySelector("button") as HTMLElement
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
        expect(document.querySelector(".fw-info-tooltip-text")).toBeNull()
        expect(document.querySelector(".fw-tooltip")).toBeNull()
    })
})
