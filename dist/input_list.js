import { ensureCSS } from "./network.js";
import { getFocusIndex, setFocusIndex } from "./focus.js";
import { isActivationEvent } from "./events.js";
import { gettext, staticUrl } from "./settings.js";
/**
 * Generic add/remove list for form fields.
 *
 * Renders a table of items with plus/minus controls. Each item is rendered by
 * the host via `renderItem`; the host also extracts values via `getValue`.
 */
export class InputList {
    constructor(options) {
        this.options = options;
        this.dom = options.dom;
        this.values_ = options.initialValues?.length
            ? options.initialValues.slice()
            : [options.emptyValue];
        ensureCSS(staticUrl("css/input_list.css"));
        this.render();
    }
    get values() {
        return this.readValues();
    }
    /**
     * Validate all current values and highlight invalid items.
     */
    check() {
        const { validate } = this.options;
        if (!validate) {
            return true;
        }
        let passed = true;
        const rows = this.listRows();
        this.readValues().forEach((value, index) => {
            const row = rows[index];
            if (!row) {
                return;
            }
            const valid = validate(value);
            if (valid) {
                row.classList.remove("fw-form-error");
            }
            else {
                row.classList.add("fw-form-error");
                passed = false;
            }
        });
        return passed;
    }
    render() {
        this.dom.innerHTML =
            '<table class="fw-input-list-wrapper"><tbody></tbody></table>';
        const tbody = this.dom.querySelector("tbody");
        this.values_.forEach((value, index) => this.addRow(tbody, value, index));
    }
    addRow(tbody, value, index) {
        const { html, bind } = this.options.renderItem(value, index);
        tbody.insertAdjacentHTML("beforeend", `<tr>
                <td class="fw-input-list-item-cell">${html}</td>
                <td class="fw-input-field-list-ctrl">
                    <span class="fa fa-minus-circle" tabindex="0" role="button" aria-label="${gettext("Remove")}"></span>&nbsp;<span class="fa fa-plus-circle" tabindex="0" role="button" aria-label="${gettext("Add")}"></span>
                </td>
            </tr>`);
        const row = tbody.lastElementChild;
        const itemCell = row.querySelector(".fw-input-list-item-cell");
        if (bind) {
            bind(itemCell, value, index);
        }
        const addItemEl = row.querySelector(".fa-plus-circle");
        const removeItemEl = row.querySelector(".fa-minus-circle");
        addItemEl.addEventListener("click", event => this.handlePlus(event, index));
        addItemEl.addEventListener("keydown", event => this.handlePlus(event, index));
        removeItemEl.addEventListener("click", event => this.handleMinus(event, index));
        removeItemEl.addEventListener("keydown", event => this.handleMinus(event, index));
    }
    handlePlus(event, index) {
        if (!isActivationEvent(event)) {
            return;
        }
        event.preventDefault();
        const focusIndex = getFocusIndex();
        const currentValues = this.readValues();
        currentValues.splice(index + 1, 0, this.options.emptyValue);
        this.values_ = currentValues;
        this.render();
        setFocusIndex(focusIndex + 1);
        this.notifyChange();
    }
    handleMinus(event, index) {
        if (!isActivationEvent(event)) {
            return;
        }
        event.preventDefault();
        const focusIndex = getFocusIndex();
        const currentValues = this.readValues();
        currentValues.splice(index, 1);
        if (currentValues.length === 0) {
            currentValues.push(this.options.emptyValue);
        }
        this.values_ = currentValues;
        this.render();
        setFocusIndex(Math.max(0, focusIndex - 1));
        this.notifyChange();
    }
    readValues() {
        return this.listRows().map(row => {
            const itemCell = row.querySelector(".fw-input-list-item-cell");
            return this.options.getValue(itemCell);
        });
    }
    listRows() {
        const tbody = this.dom.querySelector("tbody");
        if (!tbody) {
            return [];
        }
        return Array.from(tbody.children);
    }
    notifyChange() {
        if (this.options.onChange) {
            this.options.onChange(this.readValues());
        }
    }
}
//# sourceMappingURL=input_list.js.map