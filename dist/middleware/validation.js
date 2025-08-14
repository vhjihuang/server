"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.validateGenerateRequest = exports.generateRequestId = void 0;
const validator_1 = require("../services/validator");
const logger_1 = require("../services/logger");
const generateRequestId = (req, _res, next) => {
    req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    next();
};
exports.generateRequestId = generateRequestId;
const validateGenerateRequest = (req, _res, next) => {
    try {
        logger_1.logger.debug('开始验证请求参数', {
            requestId: req.requestId,
            hasDescription: !!req.body.description,
            hasType: !!req.body.type,
            hasStyle: !!req.body.style,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
        });
        req.validatedBody = validator_1.ValidationService.validateGenerateRequest(req.body);
        logger_1.logger.debug('请求参数验证通过', {
            requestId: req.requestId,
            descriptionLength: req.validatedBody.description.length,
            type: req.validatedBody.type,
            style: req.validatedBody.style
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateGenerateRequest = validateGenerateRequest;
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    logger_1.logger.info('收到API请求', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
    });
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.logger.info('API请求完成', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration
        });
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=validation.js.map