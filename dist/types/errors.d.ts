export declare enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    OPENAI_API_ERROR = "OPENAI_API_ERROR",
    RESPONSE_PARSING_ERROR = "RESPONSE_PARSING_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    QUOTA_ERROR = "QUOTA_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorType: ErrorType;
    readonly timestamp: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, errorType: ErrorType, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    readonly details: string[];
    constructor(message: string, details?: string[]);
}
export declare class OpenAIError extends AppError {
    readonly originalError?: any | undefined;
    constructor(message: string, statusCode: number, errorType: ErrorType, originalError?: any | undefined);
}
export declare class ResponseParsingError extends AppError {
    readonly rawResponse: string;
    constructor(message: string, rawResponse?: string);
}
export declare class ErrorFactory {
    static createOpenAIError(error: any): OpenAIError;
    static createResponseParsingError(error: Error, rawResponse?: string): ResponseParsingError;
    static createValidationError(errors: string[]): ValidationError;
}
export declare function isAppError(error: any): error is AppError;
export declare function isOperationalError(error: any): boolean;
//# sourceMappingURL=errors.d.ts.map