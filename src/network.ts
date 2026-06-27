import { getSettings } from "./settings.js"

export interface FileUploadValue {
    file: Blob
    filename: string
}

export type PostFiles = Record<
    string,
    Blob | File | FileUploadValue | Blob[] | File[] | string[] | string
>

export interface PostOptions {
    csrfToken?: string
    keepalive?: boolean
}

/** Get cookie to set as part of the request header of all AJAX requests to the server.
 * @param name The name of the token to look for in the cookie.
 */
export const getCookie = (name: string): string | null => {
    if (!document.cookie || document.cookie === "") {
        return null
    }
    const cookie = document.cookie
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => {
            if (cookie.substring(0, name.length + 1) == name + "=") {
                return true
            } else {
                return false
            }
        })
    if (cookie) {
        return decodeURIComponent(cookie.substring(name.length + 1))
    }
    return null
}

/* from https://www.tjvantoll.com/2015/09/13/fetch-and-errors/ */
const handleFetchErrors = (response: Response): Response => {
    if (!response.ok) {
        throw response
    }
    return response
}

export const get = (
    url: string,
    params: Record<string, string> = {},
    csrfToken: string | false = false
): Promise<Response> => {
    const settings = getSettings()
    const token = csrfToken || settings.getCsrfToken() // Won't work in web worker.
    const queryString = Object.keys(params)
        .map(
            key =>
                `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        )
        .join("&")
    if (queryString.length) {
        url = `${url}?${queryString}`
    }
    return fetch(settings.apiUrl(url), {
        method: "GET",
        headers: {
            "X-CSRFToken": token,
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include"
    }).then(handleFetchErrors)
}

export const getJson = (
    url: string,
    params: Record<string, string> = {},
    csrfToken: string | false = false
): Promise<unknown> =>
    get(url, params, csrfToken).then(response => response.json())

export const postBare = (
    url: string,
    object: Record<string, unknown> = {},
    files: PostFiles = {},
    options: PostOptions = {}
): Promise<Response> => {
    const settings = getSettings()

    const { csrfToken: csrfTokenOpt, keepalive = false } = options
    const csrfToken = csrfTokenOpt || settings.getCsrfToken() // Won't work in web worker.

    const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        keepalive
    }

    if (Object.keys(files).length) {
        const body = new FormData()
        body.append("csrfmiddlewaretoken", csrfToken)
        body.append("json", JSON.stringify(object))
        Object.keys(files).forEach(key => {
            const value = files[key]
            if (
                typeof value === "object" &&
                value !== null &&
                "file" in value &&
                "filename" in value
            ) {
                const uploadValue = value as FileUploadValue
                body.append(key, uploadValue.file, uploadValue.filename)
            } else if (Array.isArray(value)) {
                value.forEach(item => body.append(`${key}[]`, item))
            } else if (value !== undefined && value !== null) {
                body.append(key, value as Blob | string)
            }
        })
        fetchOptions.body = body
    } else {
        ;(fetchOptions.headers as Record<string, string>)["Content-Type"] =
            "application/json"
        fetchOptions.body = JSON.stringify(object)
    }

    return fetch(settings.apiUrl(url), fetchOptions)
}

export const post = (
    url: string,
    object: Record<string, unknown> = {},
    files: PostFiles = {},
    options: PostOptions = {}
): Promise<Response> => {
    return postBare(url, object, files, options).then(handleFetchErrors)
}

// post json object and return json and status
export const postJson = (
    url: string,
    object: Record<string, unknown> = {},
    files: PostFiles = {},
    options: PostOptions = {}
): Promise<{ json: unknown; status: number }> =>
    post(url, object, files, options).then(response =>
        response.json().then(json => ({ json, status: response.status }))
    )

export const ensureCSS = (cssUrl: string | string[]): boolean | void => {
    if (typeof cssUrl === "object") {
        cssUrl.forEach(url => ensureCSS(url))
        return
    }
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = cssUrl
    const styleSheet = Array.from(document.styleSheets).find(
        styleSheet => styleSheet.href === link.href
    )
    if (!styleSheet) {
        document.head.appendChild(link)
        return true
    }
    return false
}
