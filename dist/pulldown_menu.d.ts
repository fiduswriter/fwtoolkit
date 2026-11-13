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
    /**
     * Flip menus that reach past the bottom of the viewport upward, so
     * their items stay reachable on small screens.
     *
     * The anchor is the list item for a submenu and the menu header for a
     * top-level menu; the menu flips only when it overflows the viewport
     * bottom and there is more room above the anchor than below it. Menus
     * of a bar at the very top of the window therefore never flip, while
     * submenus opened near the bottom do.
     */
    private adjustOpenMenus;
    private getMenuHTML;
    private getMenuItemHTML;
    private getActionMenuItemHTML;
    private getMenuMenuItemHTML;
    private getAccessKeyHTML;
}
//# sourceMappingURL=pulldown_menu.d.ts.map