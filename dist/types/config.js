"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.validateConfig = validateConfig;
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
function validateConfig(config) {
    const errors = [];
    if (config.port && (config.port < 1 || config.port > 65535)) {
        errors.push('PORT must be between 1 and 65535');
    }
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
    return {
        port: config.port || 3001,
        environment: config.environment || 'development',
        openaiApiKey: config.openaiApiKey || 'mock-key',
        geminiApiKey: config.geminiApiKey || 'mock-key',
        logLevel: config.logLevel || LogLevel.INFO
    };
}
//# sourceMappingURL=config.js.map