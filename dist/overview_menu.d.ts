import { DiffDOM } from "diff-dom";
export interface OverviewMenuDropdownOption {
    title: string;
    action?: (overview: unknown) => void;
    [key: string]: unknown;
}
export interface OverviewMenuBaseItem {
    id?: string;
    title?: string;
    keys?: string;
    action?: (overview: unknown) => void;
    [key: string]: unknown;
}
export interface OverviewMenuDropdownItem extends OverviewMenuBaseItem {
    type: "dropdown";
    open?: boolean;
    selectedIndex?: number;
    content: OverviewMenuDropdownOption[];
}
export interface OverviewMenuSelectActionDropdownItem extends OverviewMenuBaseItem {
    type: "select-action-dropdown";
    open?: boolean;
    checked?: boolean;
    content: OverviewMenuDropdownOption[];
    checkAction?: (overview: unknown) => void;
    uncheckAction?: (overview: unknown) => void;
}
export interface OverviewMenuTextItem extends OverviewMenuBaseItem {
    type: "text";
    action?: (overview: unknown) => void;
}
export interface OverviewMenuButtonItem extends OverviewMenuBaseItem {
    type: "button";
    action?: (overview: unknown) => void;
    icon?: string;
}
export interface OverviewMenuSearchItem extends OverviewMenuBaseItem {
    type: "search";
    placeholder?: string;
    icon?: string;
    input?: (overview: unknown, value: string) => void;
}
export type OverviewMenuItem = OverviewMenuDropdownItem | OverviewMenuSelectActionDropdownItem | OverviewMenuTextItem | OverviewMenuButtonItem | OverviewMenuSearchItem;
export interface OverviewMenuModel {
    content: OverviewMenuItem[];
}
export declare class OverviewMenuView {
    overview: unknown;
    model: OverviewMenuModel;
    dd: DiffDOM;
    openedMenu: number | false;
    listeners: Record<string, (event: Event) => void>;
    keyboardShortcuts: Map<string, OverviewMenuItem>;
    menuEl: HTMLElement | null;
    constructor(overview: unknown, model: () => OverviewMenuModel);
    init(): void;
    addMissingIds(menu: {
        content: Array<{
            id?: string;
            type?: string;
            content?: unknown[];
        }>;
    }): void;
    bindEvents(): void;
    setupKeyboardShortcuts(): void;
    onKeydown(event: KeyboardEvent): void;
    onFocus(event: FocusEvent): void;
    findMenuItemFromElement(element: Element): OverviewMenuItem | null;
    focusMenuItem(menuItem: OverviewMenuItem): void;
    oninput(event: InputEvent): void;
    onclick(event: MouseEvent): void | false | true;
    update(): void;
    getMenuHTML(): string;
    getAccessKeyHTML(title: string, accessKey: string | undefined): string;
    getMenuItemHTML(menuItem: OverviewMenuItem): string;
    getSelectionActionDropdownHTML(menuItem: OverviewMenuSelectActionDropdownItem): string;
    getDropdownHTML(menuItem: OverviewMenuDropdownItem): string;
    getDropdownListHTML(menuItem: OverviewMenuDropdownItem | OverviewMenuSelectActionDropdownItem): string;
    getDropdownOptionHTML(menuOption: OverviewMenuDropdownOption, index: number): string;
    getButtonHTML(menuItem: OverviewMenuButtonItem): string;
    announceForScreenReader(message: string): void;
    getTextHTML(menuItem: OverviewMenuTextItem): string;
    getSearchHTML(menuItem: OverviewMenuSearchItem): string;
    destroy(): void;
}
//# sourceMappingURL=overview_menu.d.ts.map