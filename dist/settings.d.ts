export interface Settings {
    apiUrl: (url: string) => string;
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
 * Return the staticUrl function configured in settings, or a default identity
 * function that returns the input path unchanged.
 */
export declare function staticUrl(path: string): string;
//# sourceMappingURL=settings.d.ts.map