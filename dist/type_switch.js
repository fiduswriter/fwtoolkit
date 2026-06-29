import { ensureCSS } from "./network.js";
import { escapeText } from "./basic.js";
import { staticUrl } from "./settings.js";
/**
 * A sliding two-state toggle that switches between two rendered views.
 */
export class TypeSwitch {
    constructor(options) {
        this.options = options;
        this.dom = options.dom;
        this.currentMode = options.initialMode || 1;
        ensureCSS(staticUrl("css/type_switch.css"));
        this.renderWrapper();
        this.switcher = this.dom.querySelector(".fw-type-switch");
        this.inner = this.dom.querySelector(".fw-type-switch-input-inner");
        this.updateView(false);
        if (options.disabled) {
            this.switcher.classList.add("fw-disabled");
        }
        else {
            this.switcher.addEventListener("click", () => this.switchMode());
        }
    }
    get mode() {
        return this.currentMode;
    }
    set mode(mode) {
        if (mode !== this.currentMode) {
            if (this.options.beforeChange) {
                this.options.beforeChange(mode);
            }
            this.currentMode = mode;
            this.updateView(true);
        }
    }
    switchMode() {
        this.mode = this.currentMode === 1 ? 2 : 1;
    }
    /**
     * The container element that holds the current mode's rendered content.
     * Host code can use this to query or further initialise sub-widgets after
     * a switch.
     */
    get innerElement() {
        return this.inner;
    }
    renderWrapper() {
        this.dom.innerHTML = `<div class="fw-type-switch-input-wrapper">
            <button class="fw-type-switch fw-value${this.currentMode}">
                <span class="fw-type-switch-inner">
                    <span class="fw-type-switch-label">${escapeText(this.options.label1)}</span>
                    <span class="fw-type-switch-label">${escapeText(this.options.label2)}</span>
                </span>
            </button>
            <div class="fw-type-switch-input-inner"></div>
        </div>`;
    }
    updateView(notify) {
        this.switcher.classList.remove("fw-value1", "fw-value2");
        this.switcher.classList.add(`fw-value${this.currentMode}`);
        const render = this.currentMode === 1 ? this.options.render1 : this.options.render2;
        if (render) {
            this.setContent(render());
        }
        if (notify && this.options.onChange) {
            this.options.onChange(this.currentMode);
        }
    }
    setContent(content) {
        if (typeof content === "string") {
            this.inner.innerHTML = content;
        }
        else {
            this.inner.innerHTML = "";
            this.inner.appendChild(content);
        }
    }
}
//# sourceMappingURL=type_switch.js.map