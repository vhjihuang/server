"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const errors_1 = require("../types/errors");
const logger_1 = require("./logger");
class OpenAIService {
    constructor(apiKey) {
        this.client = new openai_1.default({ apiKey });
    }
    async generateNaming(prompt, context = { requestId: 'unknown' }) {
        const startTime = Date.now();
        logger_1.logger.debug('开始调用OpenAI API', {
            promptLength: prompt.length,
            ...context
        });
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            }, {
                timeout: 30000
            });
            const duration = Date.now() - startTime;
            const responseContent = response.choices[0]?.message?.content?.trim() || '';
            logger_1.logger.info('OpenAI API调用成功', {
                duration,
                responseLength: responseContent.length,
                tokensUsed: response.usage?.total_tokens,
                ...context
            });
            return responseContent;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.logOpenAIError(error, {
                duration,
                promptLength: prompt.length,
                ...context
            });
            throw errors_1.ErrorFactory.createOpenAIError(error);
        }
    }
    async healthCheck() {
        try {
            await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: "test" }],
                max_tokens: 1
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('OpenAI健康检查失败', error);
            return false;
        }
    }
}
exports.OpenAIService = OpenAIService;
//# sourceMappingURL=openai.js.map