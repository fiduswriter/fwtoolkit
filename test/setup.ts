import { initSettings } from "../src/settings.js"

// Initialize app settings so tests can run outside Fidus Writer.
initSettings({
    apiUrl: (url: string) => url,
    apiUrlMap: {
        "i18n.setLang": "/api/i18n/setlang/",
        "test.static": "/api/test/static/",
        "test.dynamic": "/api/test/{id}/dynamic/"
    },
    getCsrfToken: () => "",
    gettext: (msgid: string) => msgid,
    staticUrl: (path: string) => path,
    interpolate: (fmt: string, args: unknown[]) =>
        fmt.replace(/%s/g, () => String(args.shift()))
})
