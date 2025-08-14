"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.ResponseParsingError = exports.OpenAIError = exports.ValidationError = exports.AppError = exports.ErrorType = void 0;
exports.isAppError = isAppError;
exports.isOperationalError = isOperationalError;
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["OPENAI_API_ERROR"] = "OPENAI_API_ERROR";
    ErrorType["RESPONSE_PARSING_ERROR"] = "RESPONSE_PARSING_ERROR";
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorType["QUOTA_ERROR"] = "QUOTA_ERROR";
    ErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
class AppError extends Error {
    constructor(message, statusCode, errorType, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.name = this.constructor.name;
        this.timestamp = new Date().toISOString();
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, ErrorType.VALIDATION_ERROR);
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
class OpenAIError extends AppError {
    constructor(message, statusCode, errorType, originalError) {
        super(message, statusCode, errorType);
        this.originalError = originalError;
    }
}
exports.OpenAIError = OpenAIError;
class ResponseParsingError extends AppError {
    constructor(message, rawResponse = '') {
        super(message, 502, ErrorType.RESPONSE_PARSING_ERROR);
        this.rawResponse = rawResponse;
    }
}
exports.ResponseParsingError = ResponseParsingError;
class ErrorFactory {
    static createOpenAIError(error) {
        let message = 'OpenAI API调用失败';
        let statusCode = 500;
        let errorType = ErrorType.OPENAI_API_ERROR;
        if (error.code === 'insufficient_quota') {
            message = 'API配额不足，请稍后重试或联系管理员';
            statusCode = 402;
            errorType = ErrorType.QUOTA_ERROR;
        }
        else if (error.code === 'rate_limit_exceeded') {
            message = '请求频率过高，请稍后重试';
            statusCode = 429;
            errorType = ErrorType.RATE_LIMIT_ERROR;
        }
        else if (error.code === 'invalid_api_key') {
            message = '服务配置错误，请联系管理员';
            statusCode = 401;
            errorType = ErrorType.AUTHENTICATION_ERROR;
        }
        else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            message = '请求超时，请稍后重试';
            statusCode = 408;
            errorType = ErrorType.TIMEOUT_ERROR;
        }
        else if (error.request && !error.response) {
            message = '网络连接错误，请检查网络连接后重试';
            statusCode = 503;
            errorType = ErrorType.NETWORK_ERROR;
        }
        return new OpenAIError(message, statusCode, errorType, error);
    }
    static createResponseParsingError(error, rawResponse = '') {
        let message = '响应解析失败，请稍后重试';
        if (error.message.includes('JSON格式')) {
            message = '服务返回格式错误，请稍后重试';
        }
        else if (error.message.includes('数组格式')) {
            message = '服务返回数据格式错误，请稍后重试';
        }
        else if (error.message.includes('期望返回5个')) {
            message = '服务返回数据不完整，请稍后重试';
        }
        return new ResponseParsingError(message, rawResponse);
    }
    static createValidationError(errors) {
        return new ValidationError('请求参数验证失败', errors);
    }
}
exports.ErrorFactory = ErrorFactory;
function isAppError(error) {
    return error instanceof AppError;
}
function isOperationalError(error) {
    return isAppError(error) && error.isOperational;
}
//# sourceMappingURL=errors.js.map