export interface Settings {
    apiUrl: (url: string, params?: Record<string, string>) => string
    apiUrlMap?: Record<string, string>
    getCsrfToken: () => string
    gettext?: (msgid: string) => string
    interpolate?: (fmt: string, args: unknown[], named?: boolean) => string
    staticUrl?: (path: string) => string
    [key: string]: unknown
}

const SETTINGS_KEY = "__fwtoolkit_settings__"

function getGlobalSettings(): Settings | null {
    if (typeof globalThis !== "undefined") {
        return (globalThis as Record<string, unknown>)[
            SETTINGS_KEY
        ] as Settings | null
    }
    return null
}

function setGlobalSettings(settings: Settings): void {
    if (typeof globalThis !== "undefined") {
        ;(globalThis as Record<string, unknown>)[SETTINGS_KEY] = settings
    }
}

let _settings: Settings | null = getGlobalSettings()

export function initSettings(rawSettings: Settings): void {
    if (_settings) {
        throw new Error("Settings already initialized")
    }
    // Freeze to prevent accidental mutation at runtime
    _settings = Object.freeze({ ...rawSettings })
    setGlobalSettings(_settings)
}

export function getSettings(): Settings {
    if (!_settings) {
        _settings = getGlobalSettings()
    }
    if (!_settings) {
        throw new Error(
            "App settings not initialized. Call initSettings() first."
        )
    }
    return _settings
}

/**
 * Return the gettext function configured in settings, or a default identity
 * function that returns the input string unchanged.
 */
export function gettext(msgid: string): string {
    if (_settings && typeof _settings.gettext === "function") {
        return _settings.gettext(msgid)
    }
    return msgid
}

/**
 * Return the interpolate function configured in settings, or a default
 * function that performs simple `%s` positional replacement.
 */
export function interpolate(
    fmt: string,
    args: unknown[],
    named = false
): string {
    if (_settings && typeof _settings.interpolate === "function") {
        return _settings.interpolate(fmt, args, named)
    }
    return fmt.replace(/%s/g, () => String(args.shift()))
}

/**
 * Resolve a logical API endpoint name to a concrete URL.
 *
 * If an `apiUrlMap` is configured and contains the name, the mapped template is
 * returned. Templates may contain `{paramName}` placeholders, which are filled
 * from the optional `params` object.
 *
 * If the name is not in the map, the configured `settings.apiUrl` function is
 * called unchanged, so literal paths and absolute URLs continue to work.
 */
export function apiUrl(name: string, params?: Record<string, string>): string {
    const settings = getSettings()
    const mapped = settings.apiUrlMap?.[name]
    if (mapped !== undefined) {
        const resolved = mapped.replace(/\{(\w+)\}/g, (_, key) => {
            if (!params) {
                throw new Error(`Missing apiUrl param "${key}" for "${name}"`)
            }
            const value = params[key]
            if (value === undefined) {
                throw new Error(`Missing apiUrl param "${key}" for "${name}"`)
            }
            return encodeURIComponent(value)
        })
        return resolved
    }
    return settings.apiUrl(name, params)
}

/**
 * Return the staticUrl function configured in settings, or a default identity
 * function that returns the input path unchanged.
 */
export function staticUrl(path: string): string {
    if (_settings && typeof _settings.staticUrl === "function") {
        return _settings.staticUrl(path)
    }
    return path
}
