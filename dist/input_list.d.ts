export interface InputListItemRenderResult<T> {
    html: string;
    bind?: (el: HTMLElement, value: T, index: number) => void;
}
export interface InputListOptions<T> {
    dom: HTMLElement;
    initialValues?: T[];
    emptyValue: T;
    renderItem: (value: T, index: number) => InputListItemRenderResult<T>;
    getValue: (el: HTMLElement) => T;
    validate?: (value: T) => boolean;
    onChange?: (values: T[]) => void;
}
/**
 * Generic add/remove list for form fields.
 *
 * Renders a table of items with plus/minus controls. Each item is rendered by
 * the host via `renderItem`; the host also extracts values via `getValue`.
 */
export declare class InputList<T> {
    dom: HTMLElement;
    options: InputListOptions<T>;
    private values_;
    constructor(options: InputListOptions<T>);
    get values(): T[];
    /**
     * Validate all current values and highlight invalid items.
     */
    check(): boolean;
    private render;
    private addRow;
    private handlePlus;
    private handleMinus;
    private readValues;
    private listRows;
    private notifyChange;
}
//# sourceMappingURL=input_list.d.ts.map