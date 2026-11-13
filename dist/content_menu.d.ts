export type ContentMenuItemTitle = string | ((page: unknown) => string);
export interface ContentMenuBaseItem {
    type?: "header" | "separator" | "action";
    title?: ContentMenuItemTitle;
    tooltip?: string;
    action?: (page: unknown) => void;
    disabled?: (page: unknown) => boolean;
    selected?: boolean;
    order?: number;
    icon?: string;
}
export interface ContentMenuHeaderItem extends ContentMenuBaseItem {
    type: "header";
    title: ContentMenuItemTitle;
}
export interface ContentMenuSeparatorItem extends ContentMenuBaseItem {
    type: "separator";
}
export interface ContentMenuActionItem extends ContentMenuBaseItem {
    type?: "action";
    title: ContentMenuItemTitle;
    action: (page: unknown) => void;
}
export type ContentMenuItem = ContentMenuHeaderItem | ContentMenuSeparatorItem | ContentMenuActionItem;
export interface ContentMenuInit {
    content: ContentMenuItem[];
}
export interface ContentMenuPosition {
    X: number;
    Y: number;
}
export interface ContentMenuOptions {
    id?: string | false;
    page?: unknown | false;
    classes?: string | false;
    menu?: ContentMenuInit;
    height?: number | false;
    width?: number | false;
    onClose?: (() => void) | false;
    scroll?: boolean | false;
    dialogEl?: HTMLElement | false;
    backdropEl?: HTMLElement | false;
    menuPos?: ContentMenuPosition | false;
}
export declare class ContentMenu {
    id: string | false;
    page: unknown | false;
    classes: string | false;
    menu: ContentMenuInit;
    height: string;
    width: string;
    onClose: (() => void) | false;
    scroll: boolean | false;
    dialogEl: HTMLElement;
    backdropEl: HTMLElement;
    menuPos: ContentMenuPosition | false;
    focusedIndex: number;
    previouslyFocusedElement: Element | null;
    constructor({ id, page, classes, menu, height, width, onClose, scroll, dialogEl, backdropEl, menuPos }?: ContentMenuOptions);
    open(): void;
    renderColumnsHtml(columns: number): string;
    checkAndAddColumns(): void;
    renderSingleColumnHtml(): string;
    centerDialog(): void;
    positionDialog(): void;
    bind(): void;
    getHighestDialogZIndex(): number;
    close(): void;
    onclick(event: MouseEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    focusFirstMenuItem(): void;
    focusMenuItem(index: number): void;
}
//# sourceMappingURL=content_menu.d.ts.map