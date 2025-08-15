export type Environment = 'development' | 'production' | 'test';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export interface AppConfig {
    port: number;
    environment: Environment;
    openaiApiKey: string;
    geminiApiKey: string;
    logLevel: LogLevel;
}
export interface OpenAIConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
}
export interface ServerConfig {
    port: number;
    host: string;
    cors: {
        origin: string | string[] | boolean;
        credentials: boolean;
    };
}
export interface LogConfig {
    level: LogLevel;
    format: 'json' | 'simple';
    timestamp: boolean;
}
export declare function validateConfig(config: {
    port?: number | undefined;
    environment?: Environment | undefined;
    openaiApiKey?: string | undefined;
    geminiApiKey?: string | undefined;
    logLevel?: LogLevel | undefined;
}): AppConfig;
//# sourceMappingURL=config.d.ts.map