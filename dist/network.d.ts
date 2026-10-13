export interface FileUploadValue {
    file: Blob;
    filename: string;
}
export type PostFiles = Record<string, Blob | File | FileUploadValue | Blob[] | File[] | string[] | string>;
export interface PostOptions {
    csrfToken?: string;
    keepalive?: boolean;
    signal?: AbortSignal;
}
/** Get cookie to set as part of the request header of all AJAX requests to the server.
 * @param name The name of the token to look for in the cookie.
 */
export declare const getCookie: (name: string) => string | null;
export declare const get: (url: string, params?: Record<string, string>, csrfToken?: string | false, signal?: AbortSignal) => Promise<Response>;
export declare const getJson: (url: string, params?: Record<string, string>, csrfToken?: string | false, signal?: AbortSignal) => Promise<unknown>;
export declare const postBare: (url: string, object?: Record<string, unknown>, files?: PostFiles, options?: PostOptions) => Promise<Response>;
export declare const post: (url: string, object?: Record<string, unknown>, files?: PostFiles, options?: PostOptions) => Promise<Response>;
export declare const postJson: (url: string, object?: Record<string, unknown>, files?: PostFiles, options?: PostOptions) => Promise<{
    json: unknown;
    status: number;
}>;
export declare const ensureCSS: (cssUrl: string | string[]) => boolean | void;
//# sourceMappingURL=network.d.ts.map