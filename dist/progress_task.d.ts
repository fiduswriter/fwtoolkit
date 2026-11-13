export type ProgressTaskType = "info" | "success" | "warning" | "error";
export interface ProgressTaskSpec {
    title: string;
    message?: string;
    percentage?: number | null;
    cancelable?: boolean;
    onCancel?: () => void;
    /** Automatically close the task when it reaches 100%. `true` uses a default
     * delay of 2000 ms; a number sets a custom delay in ms. Set to `false` to
     * keep the task open indefinitely. Defaults to `true`.
     */
    autoClose?: boolean | number;
    /** Show a manual close/dismiss button even when the task is not cancelable.
     * Defaults to `true`.
     */
    dismissable?: boolean;
}
export declare class ProgressTask {
    private readonly id;
    private readonly alertType;
    private readonly title;
    private message;
    private percentage;
    private readonly cancelable;
    private readonly onCancel?;
    private readonly dismissable;
    private readonly autoClose;
    private closeTimeout;
    private done;
    private closed;
    private item;
    constructor(alertType: ProgressTaskType, { title, message, percentage, cancelable, onCancel, autoClose, dismissable }: ProgressTaskSpec);
    open(): void;
    update(percentage: number | null, message?: string): void;
    setMessage(message: string): void;
    private markDone;
    close(): void;
    isClosed(): boolean;
}
export declare const addProgress: (alertType: ProgressTaskType, title: string, options?: Omit<ProgressTaskSpec, "title">) => ProgressTask;
//# sourceMappingURL=progress_task.d.ts.map