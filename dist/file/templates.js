import { escapeText } from "../basic.js";
import { gettext } from "../settings.js";
export const moveTemplate = ({ path }) => `<div class="fw-file-dialog">
    <div class="fw-file-dialog-path">
        <label for="path">${gettext("Path")}</label>
        <input type="text" value="${escapeText(path)}" id="path" placeholder="${gettext("Insert path")}" autocomplete="off" spellcheck="false">
    </div>
    <div class="fw-file-selector"></div>
    </div>`;
export const newFolderTemplate = () => `<div><input type="text" id="new-folder-name" placeholder="${gettext("Insert folder name")}" aria-label="${gettext("Insert folder name")}"></div>`;
//# sourceMappingURL=templates.js.map