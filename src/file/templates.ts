import {escapeText} from "../index.js"

export const moveTemplate = ({path}: {path: string}): string =>
    `<div>
    <span>${gettext("Path")}:</span>
    <input type="text" value="${escapeText(path)}" id="path" placeholder="${gettext("Insert path")}">
    <div class="fw-file-selector"></div>
    </div>`

export const newFolderTemplate = (): string =>
    `<div><input type="text" id="new-folder-name" placeholder="${gettext("Insert folder name")}"></div>`
