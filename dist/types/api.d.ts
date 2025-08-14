export declare const NAMING_TYPES: readonly ["function", "variable", "class", "boolean", "constant"];
export type NamingType = typeof NAMING_TYPES[number];
export declare const NAMING_STYLES: readonly ["camelCase", "snake_case", "PascalCase", "kebab-case", "UPPER_SNAKE_CASE"];
export type NamingStyle = typeof NAMING_STYLES[number];
export interface GenerateRequest {
    description: string;
    type: NamingType;
    style: NamingStyle;
}
export interface GenerateResponse {
    success: true;
    data: string[];
    count: number;
    requestId: string;
    timestamp: string;
}
export interface ErrorResponse {
    success: false;
    error: string;
    errorType: string;
    timestamp: string;
    requestId: string;
    details?: string[];
}
export type ApiResponse = GenerateResponse | ErrorResponse;
export interface RequestContext {
    requestId: string;
    userAgent?: string | undefined;
    ip?: string | undefined;
    description?: string | undefined;
    type?: NamingType | undefined;
    style?: NamingStyle | undefined;
    [key: string]: any;
}
export interface LogContext {
    requestId?: string;
    userAgent?: string | undefined;
    ip?: string | undefined;
    description?: string | undefined;
    type?: NamingType | undefined;
    style?: NamingStyle | undefined;
    [key: string]: any;
}
export declare function isNamingType(value: any): value is NamingType;
export declare function isNamingStyle(value: any): value is NamingStyle;
export declare function isValidDescription(value: any): value is string;
//# sourceMappingURL=api.d.ts.map