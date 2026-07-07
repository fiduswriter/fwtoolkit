// Simple demo worker used by fwtoolkit's makeWorker demo.
self.addEventListener("message", event => {
    const { a, b } = event.data
    self.postMessage({ result: a + b })
})
