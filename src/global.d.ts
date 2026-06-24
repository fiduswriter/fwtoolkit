// Globals provided by the Fidus Writer host page.

declare const gettext: (msgid: string) => string

declare const staticUrl: (path: string) => string

declare const settings: Record<string, any>

interface Window {
    settings?: Record<string, any>
}
