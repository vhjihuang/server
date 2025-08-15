"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGlobalErrorHandlers = exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../types/errors");
const logger_1 = require("../services/logger");
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const requestId = req.requestId || 'unknown';
    const context = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket?.remoteAddress
    };
    if ((0, errors_1.isOperationalError)(err)) {
        logger_1.logger.warn('操作性错误', {
            ...context,
            error: err.message,
            errorType: err.errorType,
            statusCode: err.statusCode
        });
    }
    else {
        logger_1.logger.error('未处理的程序错误', err, context);
    }
    const errorResponse = generateSafeErrorResponse(err, req);
    const statusCode = (0, errors_1.isAppError)(err) ? err.statusCode : 500;
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
function generateSafeErrorResponse(error, req) {
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    const requestId = req.requestId || 'unknown';
    const baseResponse = {
        success: false,
        error: '内部服务器错误，请稍后重试',
        errorType: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId
    };
    if ((0, errors_1.isAppError)(error)) {
        return {
            ...baseResponse,
            error: error.message,
            errorType: error.errorType,
            ...(error.errorType === 'VALIDATION_ERROR' && 'details' in error && {
                details: error.details
            })
        };
    }
    if (isDevelopment) {
        return {
            ...baseResponse,
            error: error.message
        };
    }
    return baseResponse;
}
const notFoundHandler = (req, res) => {
    const errorResponse = {
        success: false,
        error: `路径 ${req.originalUrl} 不存在`,
        errorType: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown'
    };
    res.status(404).json(errorResponse);
};
exports.notFoundHandler = notFoundHandler;
const setupGlobalErrorHandlers = () => {
    process.on('uncaughtException', (err) => {
        logger_1.logger.error('未捕获的异常', err, {
            requestId: 'global',
            source: 'uncaughtException'
        });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('未处理的Promise拒绝', reason, {
            requestId: 'global',
            source: 'unhandledRejection',
            promise: promise.toString()
        });
        process.exit(1);
    });
};
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
//# sourceMappingURL=errorHandler.js.map