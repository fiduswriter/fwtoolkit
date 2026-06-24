export interface Settings {
    apiUrl: (url: string) => string
    getCsrfToken: () => string
    [key: string]: unknown
}

let _settings: Settings | null = null

export function initSettings(rawSettings: Settings): void {
    if (_settings) {
        throw new Error("Settings already initialized")
    }
    // Freeze to prevent accidental mutation at runtime
    _settings = Object.freeze({...rawSettings})
}

export function getSettings(): Settings {
    if (!_settings) {
        throw new Error(
            "App settings not initialized. Call initSettings() first."
        )
    }
    return _settings
}
