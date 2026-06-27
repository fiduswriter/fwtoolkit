import { escapeText } from "../basic.js"
import { postJson } from "../network.js"
import { gettext } from "../settings.js"

export const shortFileTitle = (title: string, path: string): string => {
    if (!path.length || path.endsWith("/")) {
        return escapeText(title || gettext("Untitled"))
    }
    return escapeText(path.split("/").pop() || "")
}

export const longFilePath = (
    title: string,
    path: string,
    prefix = ""
): string => {
    if (!path.length) {
        path = "/"
    }
    if (path.endsWith("/")) {
        path += title.replace(/\//g, "") || gettext("Untitled")
    }
    if (prefix.length) {
        const pathParts = path.split("/")
        const fileName = pathParts.pop()
        pathParts.push(prefix + fileName)
        path = pathParts.join("/")
    }

    return path
}

export const cleanPath = (title: string, path: string): string => {
    if (!path.startsWith("/")) {
        path = "/" + path
    }
    path = path.replace(/\/{2,}/g, "/") // replace multiple backslashes

    if (path.endsWith(`/${title.replace(/\//g, "") || gettext("Untitled")}`)) {
        path = path.split("/").slice(0, -1).join("/") + "/"
    }
    if (path === "/") {
        path = ""
    }
    return path
}

export const moveFile = (
    fileId: number,
    title: string,
    path: string,
    moveUrl: string
): Promise<string> => {
    path = cleanPath(title, path)
    return new Promise((resolve, reject) => {
        postJson(moveUrl, { id: fileId, path }).then(({ json }) => {
            const response = json as { done?: boolean }
            if (response.done) {
                resolve(path)
            } else {
                reject(new Error("Could not move file"))
            }
        })
    })
}
