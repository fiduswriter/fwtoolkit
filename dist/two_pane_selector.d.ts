export interface TwoPaneSelectorOptions<T> {
    dom: HTMLElement;
    availableItems: T[];
    selectedItems?: T[];
    renderItem: (item: T) => string;
    getItemId: (item: T) => string;
    addButtonTitle?: string;
    removeButtonTitle?: string;
    leftTitle?: string;
    rightTitle?: string;
    multiple?: boolean;
    onChange?: (selected: T[]) => void;
}
/**
 * Generic two-pane add/remove selector.
 *
 * The left pane lists available items, the right pane lists selected items.
 * Items in the left pane can be selected and moved to the right pane with the
 * add button. If `removeButtonTitle` is provided, selected right-pane items can
 * be moved back.
 */
export declare class TwoPaneSelector<T> {
    dom: HTMLElement;
    options: TwoPaneSelectorOptions<T>;
    private available;
    private selected;
    constructor(options: TwoPaneSelectorOptions<T>);
    get selectedItems(): T[];
    /**
     * Update the available items and re-render the left pane.
     */
    setAvailableItems(items: T[]): void;
    private render;
    private renderPane;
    private handleItemClick;
    private handleAdd;
    private handleRemove;
    private notifyChange;
}
//# sourceMappingURL=two_pane_selector.d.ts.map