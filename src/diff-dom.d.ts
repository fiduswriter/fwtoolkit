declare module "diff-dom" {
    export interface DiffDOMOptions {
        valueDiffing?: boolean
        // TODO: add additional options as they become known
        [key: string]: unknown
    }

    export type Diff = unknown

    export class DiffDOM {
        constructor(options?: DiffDOMOptions)
        diff(node1: Node | string, node2: Node | string): Diff[]
        apply(node: Node, diff: Diff[]): void
        undo(node: Node, diff: Diff[]): void
    }
}
