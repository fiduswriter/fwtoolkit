export interface DropUpOption {
    title: string;
    className?: string;
    action: () => void;
}
export interface DropUpOptions {
    options: DropUpOption[];
    head?: string;
    onClose?: () => void;
}
export declare class DropUp {
    options: DropUpOptions;
    focusedIndex: number;
    element: HTMLElement;
    listElement: HTMLElement;
    isOpen: boolean;
    constructor(options: DropUpOptions);
    private buildElement;
    render(): HTMLElement;
    private bindEvents;
    open(): void;
    close(): void;
    focusOption(index: number): void;
    private unfocusOption;
    private updateFocusedOption;
    private activateOption;
    private handleKeyDown;
}
//# sourceMappingURL=drop_up.d.ts.map