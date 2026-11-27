export interface DialogTab {
    id?: string;
    title: string;
    description?: string;
    template: () => string;
}
export interface DialogTabsOptions {
    containerId?: string;
    onShow?: (index: number) => void;
}
/**
 * Reusable tab switcher for dialog content.
 *
 * Renders a `.fw-tabs-nav` list plus `.fw-tab-content.fw-tabs-panel` panels and
 * handles switching between them.
 */
export declare class DialogTabs {
    tabs: DialogTab[];
    options: DialogTabsOptions;
    constructor(tabs: DialogTab[], options?: DialogTabsOptions);
    /**
     * Generate the tab HTML. The caller is responsible for wrapping it in a
     * container element if needed.
     */
    render(): string;
    /**
     * Wire click handlers on the tab links inside `container` and show the
     * first tab. Call this after the rendered HTML has been inserted into the
     * DOM.
     */
    bind(container: HTMLElement): void;
    /**
     * Show the tab at the given index and hide all others.
     */
    showTab(index: number, container?: HTMLElement): void;
    private tabId;
    private findContainer;
}
//# sourceMappingURL=dialog_tabs.d.ts.map