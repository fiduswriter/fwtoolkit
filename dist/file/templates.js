import { escapeText } from "../basic.js";
import { gettext } from "../settings.js";
export const moveTemplate = ({ path }) => `<div>
    <span>${gettext("Path")}:</span>
    <input type="text" value="${escapeText(path)}" id="path" placeholder="${gettext("Insert path")}">
    <div class="fw-file-selector"></div>
    </div>`;
export const newFolderTemplate = () => `<div><input type="text" id="new-folder-name" placeholder="${gettext("Insert folder name")}"></div>`;
//# sourceMappingURL=templates.js.map