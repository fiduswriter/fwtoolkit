import { Dialog } from "./dialog.js";
export interface DropdownSelectOptions {
    onChange?: (value: string | false) => void;
    width?: number | string | false;
    value?: string | false;
    button?: HTMLElement | false;
}
export interface DropdownSelectAPI {
    setValue: (newValue: string | false) => void;
    getValue: () => string | false;
    enable: () => void;
    disable: () => void;
}
/** Creates a styled select with a contentmenu from a select tag.
 * @param select The select-tag which is to be replaced.
 * @param options
 */
export declare const dropdownSelect: (selectDOM: HTMLSelectElement, { onChange, width, value, button }?: DropdownSelectOptions) => DropdownSelectAPI | undefined;
/** Checks or unchecks a checkable label. This is used for example for bibliography categories when editing bibliography items.
 * @param label The node who's parent has to be checked or unchecked.
 */
export declare const setCheckableLabel: (labelEl: HTMLElement) => void;
/** Cover the page signaling to the user to wait.
 */
export declare const activateWait: (full?: boolean, message?: string) => void;
/** Remove the wait cover.
 */
export declare const deactivateWait: () => void;
/** Show a message to the user.
 * @param alertType The type of message that is shown (error, warning, info or success).
 * @param alertMsg The message text.
 */
export declare const addAlert: (alertType: "error" | "warning" | "info" | "success", alertMsg: string) => void;
export interface DialogButtonSpec {
    type?: "close" | "cancel" | "ok";
    text?: string;
    classes?: string;
    click?: (event?: Event) => void;
    icon?: string;
    dropdown?: boolean;
}
export declare const showSystemMessage: (message: string, buttons?: DialogButtonSpec[]) => Dialog;
/** Turn milliseconds since epoch (UTC) into a local date string.
 * @param milliseconds Number of milliseconds since epoch (1/1/1970 midnight, UTC).
 * @param type 'full' for full date (default), 'sortable-date' for sortable date, 'minutes' for minute accuracy
 */
type DateType = "sortable-date" | "minutes" | "full";
export declare const localizeDate: (milliseconds: number, type?: DateType) => string;
/**
 * Turn string literals into single line, removing spaces at start of line
 */
export declare const noSpaceTmp: (strings: TemplateStringsArray, ...values: unknown[]) => string;
export declare const escapeText: (text: string) => string;
/**
 * Return an inline info-icon with a hover tooltip containing the given HTML.
 * Use only with trusted HTML content.
 *
 * @param html - The tooltip content (HTML string)
 * @returns HTML for the info tooltip
 */
export declare const infoTooltip: (html: string) => string;
export declare const unescapeText: (text: string) => string;
/**
 * Return a cancel promise if you need to cancel a promise chain. Import as
 * ES6 promises are not (yet) cancelable.
 */
export declare const cancelPromise: () => Promise<never>;
export declare const findTarget: (event: Event, selector: string, el?: {
    target?: Element | null;
}) => boolean;
export declare const whenReady: () => Promise<void>;
export declare const setDocTitle: (title: string, app: {
    name: string;
}) => void;
export declare const langName: (code: string) => string;
/** Enable ISO date picker on a text input by overlaying a native date picker.
 * The text input displays ISO format (YYYY-MM-DD) while using the native picker for selection.
 * @param inputEl - The text input element to enhance
 * @param minToday - If true, sets min date to today (default: false)
 */
export declare const enableDatePicker: (inputEl: HTMLInputElement, minToday?: boolean) => void;
export {};
//# sourceMappingURL=basic.d.ts.map