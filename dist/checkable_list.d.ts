export interface CheckableListOption {
    id: string | number;
    label: string;
}
export interface CheckableListOptions {
    dom: HTMLElement;
    options: CheckableListOption[];
    initialValue?: (string | number)[];
    multiple?: boolean;
    onChange?: (selected: (string | number)[]) => void;
}
/**
 * A list of checkable labels for single or multiple selection.
 */
export declare class CheckableList {
    dom: HTMLElement;
    options: CheckableListOptions;
    private selected;
    constructor(options: CheckableListOptions);
    get value(): (string | number)[];
    private render;
    private handleClick;
    private readId;
}
//# sourceMappingURL=checkable_list.d.ts.map