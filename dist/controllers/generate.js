"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateController = void 0;
const prompt_1 = require("../services/prompt");
const validator_1 = require("../services/validator");
const errors_1 = require("../types/errors");
const logger_1 = require("../services/logger");
class GenerateController {
    constructor(openaiService) {
        this.generateNaming = async (req, res, next) => {
            const startTime = Date.now();
            const requestId = req.requestId;
            try {
                const { description, type, style } = req.validatedBody;
                const context = {
                    requestId,
                    description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
                    type,
                    style,
                    userAgent: req.headers['user-agent'] || undefined,
                    ip: req.ip || req.socket?.remoteAddress || undefined
                };
                const prompt = prompt_1.PromptService.buildPrompt(description, type, style);
                const apiResponse = await this.openaiService.generateNaming(prompt, context);
                let namingSuggestions;
                try {
                    namingSuggestions = validator_1.ValidationService.validateOpenAIResponse(apiResponse);
                }
                catch (error) {
                    throw errors_1.ErrorFactory.createResponseParsingError(error, apiResponse);
                }
                const duration = Date.now() - startTime;
                logger_1.logger.info('API请求处理成功', {
                    ...context,
                    duration,
                    suggestionsCount: namingSuggestions.length
                });
                const response = {
                    success: true,
                    data: namingSuggestions,
                    count: namingSuggestions.length,
                    requestId,
                    timestamp: new Date().toISOString()
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.healthCheck = async (_req, res, next) => {
            try {
                const isHealthy = await this.openaiService.healthCheck();
                res.json({
                    success: true,
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    timestamp: new Date().toISOString(),
                    services: {
                        openai: isHealthy ? 'ok' : 'error'
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.openaiService = openaiService;
    }
}
exports.GenerateController = GenerateController;
//# sourceMappingURL=generate.js.map