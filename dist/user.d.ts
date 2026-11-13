export declare const setLanguage: (_config: unknown, language: string) => Promise<unknown>;
interface AvatarUser {
    username?: string;
    name?: string;
    avatar?: string;
}
/** A template for the default round avatar view. */
export declare const avatarTemplate: ({ user }: {
    user: AvatarUser;
}) => string;
export {};
//# sourceMappingURL=user.d.ts.map