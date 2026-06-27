import {initSettings} from "../src/settings.js"

// Initialize app settings so tests can run outside Fidus Writer.
initSettings({
    apiUrl: (url: string) => url,
    getCsrfToken: () => "",
    gettext: (msgid: string) => msgid,
    staticUrl: (path: string) => path,
    interpolate: (fmt: string, args: any[]) =>
        fmt.replace(/%s/g, () => args.shift())
})
