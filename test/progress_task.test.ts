import { jest } from "@jest/globals"
import { addProgress } from "../src/progress_task.js"

describe("ProgressTask", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    test("addProgress creates a visible task", () => {
        const task = addProgress("info", "Test task")
        const container = document.getElementById("fw-progress-outer-wrapper")
        expect(container).not.toBeNull()
        const item = document.querySelector(".fw-progress-task")
        expect(item).not.toBeNull()
        expect(item?.textContent).toContain("Test task")
        expect(task.isClosed()).toBe(false)
    })

    test("update changes percentage and message", () => {
        const task = addProgress("info", "Test task", {
            message: "Starting..."
        })
        task.update(50, "Halfway")
        const fill = document.querySelector(".fw-progress-fill") as HTMLElement
        expect(fill.style.width).toBe("50%")
        expect(document.body.textContent).toContain("Halfway")
    })

    test("percentage is clamped between 0 and 100", () => {
        const task = addProgress("info", "Test task", { percentage: 150 })
        const fill = document.querySelector(".fw-progress-fill") as HTMLElement
        expect(fill.style.width).toBe("100%")
        task.update(-10)
        expect(fill.style.width).toBe("0%")
    })

    test("indeterminate mode renders animated bar", () => {
        addProgress("info", "Test task", { percentage: null })
        const bar = document.querySelector(".fw-progress-bar")
        expect(bar?.classList.contains("fw-indeterminate")).toBe(true)
    })

    test("close removes the task and container", () => {
        const task = addProgress("info", "Test task")
        task.close()
        jest.runAllTimers()
        expect(task.isClosed()).toBe(true)
        expect(document.getElementById("fw-progress-outer-wrapper")).toBeNull()
    })

    test("cancelable task renders cancel button", () => {
        const onCancel = jest.fn()
        addProgress("info", "Test task", { cancelable: true, onCancel })
        const button = document.querySelector(".fw-progress-cancel")
        expect(button).not.toBeNull()
        ;(button as HTMLElement).click()
        expect(onCancel).toHaveBeenCalled()
    })

    test("reaching 100% swaps icon and auto-closes by default", () => {
        const task = addProgress("info", "Test task", {
            percentage: 90
        })
        const icon = document.querySelector(".fw-progress-icon") as HTMLElement
        expect(icon.classList.contains("fa-spinner")).toBe(true)
        task.update(100)
        expect(icon.classList.contains("fa-circle-check")).toBe(true)
        jest.advanceTimersByTime(2000)
        jest.runAllTimers()
        expect(task.isClosed()).toBe(true)
    })

    test("autoClose can be disabled to keep task open", () => {
        const task = addProgress("info", "Test task", {
            percentage: 90,
            autoClose: false
        })
        task.update(100)
        jest.advanceTimersByTime(5000)
        expect(task.isClosed()).toBe(false)
    })

    test("non-cancelable task still shows dismiss button by default", () => {
        const task = addProgress("info", "Test task")
        const button = document.querySelector(".fw-progress-cancel")
        expect(button).not.toBeNull()
        expect(button?.getAttribute("aria-label")).toBe("Dismiss")
        ;(button as HTMLElement).click()
        jest.runAllTimers()
        expect(task.isClosed()).toBe(true)
    })

    test("dismiss button can be hidden", () => {
        addProgress("info", "Test task", { dismissable: false })
        const button = document.querySelector(".fw-progress-cancel")
        expect(button).toBeNull()
    })

    test("initial percentage of 100 triggers auto-close", () => {
        const task = addProgress("success", "Done task", {
            percentage: 100,
            autoClose: 500
        })
        const icon = document.querySelector(".fw-progress-icon") as HTMLElement
        expect(icon.classList.contains("fa-circle-check")).toBe(true)
        jest.advanceTimersByTime(500)
        jest.runAllTimers()
        expect(task.isClosed()).toBe(true)
    })

    test("multiple tasks share the same container", () => {
        addProgress("info", "Task one")
        addProgress("info", "Task two")
        const items = document.querySelectorAll(".fw-progress-task")
        expect(items.length).toBe(2)
        expect(
            document.querySelectorAll("#fw-progress-outer-wrapper").length
        ).toBe(1)
    })
})
