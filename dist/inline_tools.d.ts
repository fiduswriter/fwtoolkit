import type { EditorState, Transaction } from "prosemirror-state";
import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
type Command = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean;
export interface InlineToolItem {
    command: Command;
    dom: HTMLElement;
}
export declare const icon: (text: string, name: string) => HTMLElement;
export declare const InlineTools: (tools: InlineToolItem[]) => Plugin;
export {};
//# sourceMappingURL=inline_tools.d.ts.map