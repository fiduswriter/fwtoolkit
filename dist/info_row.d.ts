export interface InfoRowOptions {
    label: string;
    helpText?: string;
    fieldClass?: string;
}
export declare class InfoRow {
    label: string;
    helpText?: string;
    fieldClass?: string;
    constructor(options: InfoRowOptions);
    /**
     * Return an HTML string for a table row with a labelled header and a
     * content cell. If `helpText` is provided, the label includes a tooltip
     * info icon.
     */
    html(): string;
}
//# sourceMappingURL=info_row.d.ts.map