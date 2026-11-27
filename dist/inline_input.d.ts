import type { Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import type { InlineToolItem } from "./inline_tools.js";
export interface InlineInputOptions {
    schema: Schema;
    nodeType: string;
    initialValue?: Record<string, unknown>[];
    placeholder?: string;
    tools?: InlineToolItem[];
}
export declare class InlineInput {
    dom: HTMLElement;
    schema: Schema;
    nodeType: string;
    placeHolder?: string;
    view: EditorView;
    constructor(dom: HTMLElement, options: InlineInputOptions);
    get value(): Record<string, unknown>[] | false;
    check(): boolean;
    private placeholderPlugin;
}
//# sourceMappingURL=inline_input.d.ts.map