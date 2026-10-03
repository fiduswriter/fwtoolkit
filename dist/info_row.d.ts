export interface InfoRowOptions {
    label: string;
    helpText?: string;
    fieldClass?: string;
    /** Optional HTML placed inside the entry-field cell. */
    field?: string;
}
export declare class InfoRow {
    label: string;
    helpText?: string;
    fieldClass?: string;
    field?: string;
    constructor(options: InfoRowOptions);
    /**
     * Return an HTML string for a table row with a labelled header and a
     * content cell. If `helpText` is provided, the label includes an
     * accessible tooltip info icon: the header is keyboard focusable and the
     * tooltip is exposed through `role="tooltip"` + `aria-describedby`.
     */
    html(): string;
}
//# sourceMappingURL=info_row.d.ts.map