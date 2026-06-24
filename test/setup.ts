// Mock globals provided by the Fidus Writer host page.
;(globalThis as any).gettext = (msgid: string) => msgid
;(globalThis as any).staticUrl = (path: string) => path
;(globalThis as any).settings = {}
;(globalThis as any).interpolate = (fmt: string, args: any[]) =>
    fmt.replace(/%s/g, () => args.shift())
