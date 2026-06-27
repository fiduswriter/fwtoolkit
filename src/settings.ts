export interface Settings {
    apiUrl: (url: string) => string
    getCsrfToken: () => string
    gettext?: (msgid: string) => string
    interpolate?: (fmt: string, args: unknown[], named?: boolean) => string
    staticUrl?: (path: string) => string
    [key: string]: unknown
}

let _settings: Settings | null = null

export function initSettings(rawSettings: Settings): void {
    if (_settings) {
        throw new Error("Settings already initialized")
    }
    // Freeze to prevent accidental mutation at runtime
    _settings = Object.freeze({ ...rawSettings })
}

export function getSettings(): Settings {
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
 * Return the staticUrl function configured in settings, or a default identity
 * function that returns the input path unchanged.
 */
export function staticUrl(path: string): string {
    if (_settings && typeof _settings.staticUrl === "function") {
        return _settings.staticUrl(path)
    }
    return path
}
