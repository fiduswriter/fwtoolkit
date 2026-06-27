export const isActivationEvent = (event: Event): boolean => {
    if (event.type === "click") {
        return true
    }
    if (event.type === "keydown") {
        return (
            (event as KeyboardEvent).key === "Enter" ||
            (event as KeyboardEvent).key === " "
        )
    }
    return false
}
