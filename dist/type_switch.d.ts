export interface TypeSwitchOptions {
    dom: HTMLElement;
    label1: string;
    label2: string;
    render1?: () => string | HTMLElement;
    render2?: () => string | HTMLElement;
    initialMode?: 1 | 2;
    disabled?: boolean;
    beforeChange?: (mode: 1 | 2) => void;
    onChange?: (mode: 1 | 2) => void;
}
/**
 * A sliding two-state toggle that switches between two rendered views.
 */
export declare class TypeSwitch {
    dom: HTMLElement;
    options: TypeSwitchOptions;
    private currentMode;
    private switcher;
    private inner;
    constructor(options: TypeSwitchOptions);
    get mode(): 1 | 2;
    set mode(mode: 1 | 2);
    switchMode(): void;
    /**
     * The container element that holds the current mode's rendered content.
     * Host code can use this to query or further initialise sub-widgets after
     * a switch.
     */
    get innerElement(): HTMLElement;
    private renderWrapper;
    private updateView;
    private setContent;
}
//# sourceMappingURL=type_switch.d.ts.map