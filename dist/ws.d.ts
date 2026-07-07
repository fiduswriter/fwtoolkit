export interface WebSocketMessage {
    type?: string;
    s?: number;
    c?: number;
    base?: string;
    from?: number;
    [key: string]: unknown;
}
export type GetMessage = () => WebSocketMessage | false;
export interface WebSocketConnectorOptions {
    base?: string;
    path?: string;
    appLoaded?: () => boolean;
    anythingToSend?: () => boolean;
    messagesElement?: () => HTMLElement | false | null;
    initialMessage?: () => WebSocketMessage;
    resubScribed?: () => void;
    restartMessage?: () => WebSocketMessage;
    warningNotAllSent?: string;
    infoDisconnected?: string;
    receiveData?: (data: WebSocketMessage) => void;
    failedAuth?: () => void;
}
interface MessageTracker {
    server: number;
    client: number;
    lastTen: WebSocketMessage[];
}
export declare class WebSocketConnector {
    base: string;
    path: string;
    appLoaded: () => boolean;
    anythingToSend: () => boolean;
    messagesElement: () => HTMLElement | false | null;
    initialMessage: () => WebSocketMessage;
    resubScribed: () => void;
    restartMessage: () => WebSocketMessage;
    warningNotAllSent: string;
    infoDisconnected: string;
    receiveData: (data: WebSocketMessage) => void;
    failedAuth: () => void;
    messages: MessageTracker;
    messagesToSend: GetMessage[];
    oldMessages: GetMessage[];
    online: boolean;
    connected: boolean;
    connectionCount: number;
    recentlySent: boolean;
    listeners: Record<string, (event: Event) => void>;
    ws: WebSocket | undefined;
    pingTimer: number | false;
    pongTimer: number | false;
    constructor({ base, // needs to be specified
    path, // needs to be specified
    appLoaded, // required argument
    anythingToSend, // required argument
    messagesElement, // element in which to show connection messages
    initialMessage, resubScribed, // Cleanup when the client connects a second or subsequent time
    restartMessage, // Too many messages have been lost and we need to restart
    warningNotAllSent, // Info to show while disconnected WITH unsaved data
    infoDisconnected, // Info to show while disconnected WITHOUT unsaved data
    receiveData, failedAuth }?: WebSocketConnectorOptions);
    init(): void;
    goOffline(): void;
    goOnline(): void;
    close(): void;
    createWSConnection(): void;
    waitForWS(): Promise<void>;
    onmessage(event: MessageEvent): void;
    onclose(): void;
    open(): void;
    subscribed(): void;
    /** Sends data to server or keeps it in a list if currently offline. */
    send(getData: GetMessage, timer?: number): void;
    setRecentlySentTimer(timer: number): void;
    resend_messages(from: number): Promise<void>;
    receive(data: WebSocketMessage): void;
    heartbeat(): void;
}
export {};
//# sourceMappingURL=ws.d.ts.map