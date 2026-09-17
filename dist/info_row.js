let infoRowId = 0;
export class InfoRow {
    constructor(options) {
        this.label = options.label;
        this.helpText = options.helpText;
        this.fieldClass = options.fieldClass;
        this.field = options.field;
    }
    /**
     * Return an HTML string for a table row with a labelled header and a
     * content cell. If `helpText` is provided, the label includes an
     * accessible tooltip info icon: the header is keyboard focusable and the
     * tooltip is exposed through `role="tooltip"` + `aria-describedby`.
     */
    html() {
        const fieldClass = this.fieldClass || "";
        const id = `fw-row-tooltip-${++infoRowId}`;
        const fieldTitle = this.helpText
            ? `<h4 class="fw-tablerow-title fw-wtooltip" tabindex="0" aria-describedby="${id}">${this.label}<span class="fw-tooltip" id="${id}" role="tooltip">${this.helpText}</span></h4>`
            : `<h4 class="fw-tablerow-title">${this.label}</h4>`;
        return `<tr><th>${fieldTitle}</th><td class="fw-entry-field ${fieldClass}">${this.field || ""}</td></tr>`;
    }
}
//# sourceMappingURL=info_row.js.map