export declare const shortFileTitle: (title: string, path: string) => string;
export declare const longFilePath: (title: string, path: string, prefix?: string) => string;
export declare const cleanPath: (title: string, path: string) => string;
export declare const moveFile: (fileId: number, title: string, path: string, moveUrl: string) => Promise<string>;
export declare const moveFileWithFunction: (fileId: number, title: string, path: string, moveFunction: (id: number, title: string, path: string) => Promise<unknown>) => Promise<string>;
//# sourceMappingURL=tools.d.ts.map