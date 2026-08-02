export declare const env: {
    readonly port: number;
    readonly nodeEnv: "production" | "development" | "test";
    readonly corsOrigin: string;
    readonly db: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly name: string;
    };
    readonly lateThreshold: string;
    readonly timezone: string;
};
