import { DiffDOM } from "diff-dom";
export interface PulldownMenuItem {
    id?: string;
    title: string | ((context: unknown) => string);
    type: "action" | "menu" | "separator";
    order?: number;
    keys?: string;
    icon?: string;
    disabled?: boolean | ((context: unknown) => boolean);
    selected?: boolean | ((context: unknown) => boolean);
    tooltip?: string | ((context: unknown) => string);
    action?: (context: unknown, item: PulldownMenuItem) => void;
    content?: PulldownMenuItem[];
    open?: boolean;
}
export interface PulldownMenuModel {
    content: PulldownMenuItem[];
}
export interface PulldownMenuOptions {
    menu: PulldownMenuModel;
    context?: unknown;
    onClose?: () => void;
}
export declare class PulldownMenu {
    options: PulldownMenuOptions;
    context: unknown;
    dd: DiffDOM;
    container: HTMLElement | null;
    barEl: HTMLElement | null;
    listeners: Record<string, (event: Event) => void>;
    openMenu: PulldownMenuItem | null;
    parentChain: PulldownMenuItem[];
    cursorMenuItem: PulldownMenuItem | null;
    constructor(options: PulldownMenuOptions);
    private addMissingIds;
    render(): string;
    bind(container: HTMLElement): void;
    private bindEvents;
    destroy(): void;
    private onclick;
    private findMenuItemByElement;
    private executeMenuItem;
    private openSubMenu;
    private closeAllMenus;
    private closeOtherMenus;
    private onKeydown;
    private changeCursorMenuItem;
    private checkKeys;
    update(context?: unknown): void;
    private getMenuHTML;
    private getMenuItemHTML;
    private getActionMenuItemHTML;
    private getMenuMenuItemHTML;
    private getAccessKeyHTML;
}
//# sourceMappingURL=pulldown_menu.d.ts.map