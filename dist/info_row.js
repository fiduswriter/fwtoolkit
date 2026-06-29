export class InfoRow {
    constructor(options) {
        this.label = options.label;
        this.helpText = options.helpText;
        this.fieldClass = options.fieldClass;
    }
    /**
     * Return an HTML string for a table row with a labelled header and a
     * content cell. If `helpText` is provided, the label includes a tooltip
     * info icon.
     */
    html() {
        const fieldClass = this.fieldClass || "";
        const fieldTitle = this.helpText
            ? `<h4 class="fw-tablerow-title fw-wtooltip">${this.label}<span class="fw-tooltip">${this.helpText}</span></h4>`
            : `<h4 class="fw-tablerow-title">${this.label}</h4>`;
        return `<tr><th>${fieldTitle}</th><td class="fw-entry-field ${fieldClass}"></td></tr>`;
    }
}
//# sourceMappingURL=info_row.js.map