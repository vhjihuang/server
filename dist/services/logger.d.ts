import { LogLevel } from "../types/config";
import { LogContext } from "../types/api";
export declare class LoggerService {
    private static instance;
    private logLevel;
    private constructor();
    static getInstance(logLevel?: LogLevel): LoggerService;
    private shouldLog;
    private formatLog;
    error(message: string, error?: Error, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    logOpenAIError(error: any, context?: LogContext): void;
    logValidationError(message: string, errors: string[], context?: LogContext): void;
    logResponseParsingError(message: string, rawResponse: string, context?: LogContext): void;
}
export declare const logger: LoggerService;
//# sourceMappingURL=logger.d.ts.map