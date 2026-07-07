const SETTINGS_KEY = "__fwtoolkit_settings__";
function getGlobalSettings() {
    if (typeof globalThis !== "undefined") {
        return globalThis[SETTINGS_KEY];
    }
    return null;
}
function setGlobalSettings(settings) {
    if (typeof globalThis !== "undefined") {
        ;
        globalThis[SETTINGS_KEY] = settings;
    }
}
let _settings = getGlobalSettings();
export function initSettings(rawSettings) {
    if (_settings) {
        throw new Error("Settings already initialized");
    }
    // Freeze to prevent accidental mutation at runtime
    _settings = Object.freeze({ ...rawSettings });
    setGlobalSettings(_settings);
}
export function getSettings() {
    if (!_settings) {
        _settings = getGlobalSettings();
    }
    if (!_settings) {
        throw new Error("App settings not initialized. Call initSettings() first.");
    }
    return _settings;
}
/**
 * Return the gettext function configured in settings, or a default identity
 * function that returns the input string unchanged.
 */
export function gettext(msgid) {
    if (_settings && typeof _settings.gettext === "function") {
        return _settings.gettext(msgid);
    }
    return msgid;
}
/**
 * Return the interpolate function configured in settings, or a default
 * function that performs simple `%s` positional replacement.
 */
export function interpolate(fmt, args, named = false) {
    if (_settings && typeof _settings.interpolate === "function") {
        return _settings.interpolate(fmt, args, named);
    }
    return fmt.replace(/%s/g, () => String(args.shift()));
}
/**
 * Return the staticUrl function configured in settings, or a default identity
 * function that returns the input path unchanged.
 */
export function staticUrl(path) {
    if (_settings && typeof _settings.staticUrl === "function") {
        return _settings.staticUrl(path);
    }
    return path;
}
//# sourceMappingURL=settings.js.map