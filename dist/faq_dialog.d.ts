import { Dialog } from "./dialog.js";
export interface FAQQuestion extends Array<string | {
    hasImage?: boolean;
}> {
    0: string;
    1: string;
}
export interface FAQDialogOptions {
    title?: string;
    questions?: FAQQuestion[];
}
export declare class faqDialog {
    faqDialog: Dialog;
    constructor({ title, questions }?: FAQDialogOptions);
    open(): void;
}
//# sourceMappingURL=faq_dialog.d.ts.map