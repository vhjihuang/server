"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LoggerService = void 0;
const config_1 = require("../types/config");
const errors_1 = require("../types/errors");
class LoggerService {
    constructor(logLevel = config_1.LogLevel.INFO) {
        this.logLevel = logLevel;
    }
    static getInstance(logLevel) {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService(logLevel);
        }
        return LoggerService.instance;
    }
    shouldLog(level) {
        const levels = [config_1.LogLevel.ERROR, config_1.LogLevel.WARN, config_1.LogLevel.INFO, config_1.LogLevel.DEBUG];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }
    formatLog(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { ...context }),
        };
        return JSON.stringify(entry);
    }
    error(message, error, context) {
        if (!this.shouldLog(config_1.LogLevel.ERROR))
            return;
        const logContext = {
            errorType: errors_1.ErrorType.INTERNAL_ERROR,
            ...context,
        };
        if (error) {
            logContext["error"] = {
                name: error.name,
                message: error.message,
                ...(process.env["NODE_ENV"] === "development" && { stack: error.stack }),
            };
        }
        console.error(this.formatLog(config_1.LogLevel.ERROR, message, logContext));
    }
    warn(message, context) {
        if (!this.shouldLog(config_1.LogLevel.WARN))
            return;
        console.warn(this.formatLog(config_1.LogLevel.WARN, message, context));
    }
    info(message, context) {
        if (!this.shouldLog(config_1.LogLevel.INFO))
            return;
        console.log(this.formatLog(config_1.LogLevel.INFO, message, context));
    }
    debug(message, context) {
        if (!this.shouldLog(config_1.LogLevel.DEBUG))
            return;
        if (process.env["NODE_ENV"] === "development") {
            console.log(this.formatLog(config_1.LogLevel.DEBUG, message, context));
        }
    }
    logOpenAIError(error, context) {
        let errorType = errors_1.ErrorType.OPENAI_API_ERROR;
        if (error.code === "insufficient_quota") {
            errorType = errors_1.ErrorType.QUOTA_ERROR;
        }
        else if (error.code === "rate_limit_exceeded") {
            errorType = errors_1.ErrorType.RATE_LIMIT_ERROR;
        }
        else if (error.code === "invalid_api_key") {
            errorType = errors_1.ErrorType.AUTHENTICATION_ERROR;
        }
        else if (error.name === "AbortError" || error.code === "ECONNABORTED") {
            errorType = errors_1.ErrorType.TIMEOUT_ERROR;
        }
        else if (error.request && !error.response) {
            errorType = errors_1.ErrorType.NETWORK_ERROR;
        }
        this.error("OpenAI API调用失败", error, {
            errorType: errorType,
            ...context,
        });
    }
    logValidationError(message, errors, context) {
        this.warn(message, {
            errorType: errors_1.ErrorType.VALIDATION_ERROR,
            validationErrors: errors,
            ...context,
        });
    }
    logResponseParsingError(message, rawResponse, context) {
        const safeRawResponse = typeof rawResponse === "string" ? rawResponse : String(rawResponse || "");
        this.error(message, undefined, {
            errorType: errors_1.ErrorType.RESPONSE_PARSING_ERROR,
            rawResponseLength: safeRawResponse.length,
            rawResponsePreview: safeRawResponse.substring(0, 100),
            ...context,
        });
    }
}
exports.LoggerService = LoggerService;
exports.logger = LoggerService.getInstance();
//# sourceMappingURL=logger.js.map