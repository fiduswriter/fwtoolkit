export interface Settings {
    apiUrl: (url: string, params?: Record<string, string>) => string;
    apiUrlMap?: Record<string, string>;
    getCsrfToken: () => string;
    gettext?: (msgid: string) => string;
    interpolate?: (fmt: string, args: unknown[], named?: boolean) => string;
    staticUrl?: (path: string) => string;
    [key: string]: unknown;
}
export declare function initSettings(rawSettings: Settings): void;
export declare function getSettings(): Settings;
/**
 * Return the gettext function configured in settings, or a default identity
 * function that returns the input string unchanged.
 */
export declare function gettext(msgid: string): string;
/**
 * Return the interpolate function configured in settings, or a default
 * function that performs simple `%s` positional replacement.
 */
export declare function interpolate(fmt: string, args: unknown[], named?: boolean): string;
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
export declare function apiUrl(name: string, params?: Record<string, string>): string;
/**
 * Return the staticUrl function configured in settings, or a default identity
 * function that returns the input path unchanged.
 */
export declare function staticUrl(path: string): string;
//# sourceMappingURL=settings.d.ts.map