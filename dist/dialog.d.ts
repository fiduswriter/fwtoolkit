export interface DialogButtonSpec {
    type?: "close" | "cancel" | "ok";
    text?: string;
    classes?: string;
    click?: (event?: Event) => unknown;
    icon?: string;
    dropdown?: boolean;
}
export interface DialogOptions {
    id?: string | false;
    classes?: string | false;
    title?: string;
    body?: string;
    restoreActiveElement?: boolean;
    height?: number | false;
    width?: number | false;
    canClose?: boolean;
    help?: (() => void) | false;
    note?: {
        text?: string;
        display?: boolean;
    };
    blur?: boolean;
    buttons?: DialogButtonSpec[];
    beforeClose?: (() => void) | false;
    onClose?: (() => void) | false;
    icon?: string | false;
    scroll?: boolean | false;
    canEscape?: boolean;
    fullScreen?: boolean | false;
    initialFocus?: string | null;
}
interface InternalDialogButton {
    text: string;
    classes: string | false;
    click: (event?: Event) => unknown;
    icon: string | false;
    dropdown: boolean;
}
interface NoteSpec {
    text?: string;
    display?: boolean;
}
export declare class Dialog {
    id: string | false;
    classes: string | false;
    title: string;
    body: string;
    restoreActiveElement: boolean;
    height: string;
    width: string;
    canClose: boolean;
    help: (() => void) | false;
    note: NoteSpec;
    blur: boolean;
    buttons: InternalDialogButton[];
    beforeClose: (() => void) | false;
    onClose: (() => void) | false;
    icon: string | false;
    scroll: boolean | false;
    canEscape: boolean;
    dialogEl: HTMLElement;
    backdropEl: HTMLElement;
    dragging: {
        x: number;
        y: number;
    } | false;
    hasBeenMoved: boolean;
    listeners: Record<string, (event: Event) => void>;
    fullScreen: boolean | false;
    initialFocus: string | null;
    previousActiveElement: Element | null;
    firstFocusableEl: Element | null;
    lastFocusableEl: Element | null;
    focusableEls: Element[] | null;
    constructor(options: DialogOptions);
    setButtons(buttons: DialogButtonSpec[]): void;
    open(): void;
    refreshButtons(): void;
    refreshNote(): void;
    centerDialog(): void;
    adjustDialogToScroll(): void;
    moveDialog(x: number, y: number): void;
    onScroll(_event: Event): void;
    onKeydown(event: KeyboardEvent): void;
    bind(): void;
    nextDialogZIndex(): number;
    getFocusableElements(): Element[];
    getInitialFocusElement(): Element | undefined;
    close(): void;
}
export {};
//# sourceMappingURL=dialog.d.ts.map