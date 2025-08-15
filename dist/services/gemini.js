"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const errors_1 = require("../types/errors");
const logger_1 = require("./logger");
class GeminiService {
    constructor(apiKey) {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.apiKey = apiKey;
    }
    async generateNaming(prompt, context = { requestId: 'unknown' }) {
        const startTime = Date.now();
        logger_1.logger.debug('开始调用Gemini API', {
            promptLength: prompt.length,
            ...context
        });
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': this.apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                        topP: 0.8,
                        topK: 10
                    }
                })
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Gemini API请求失败: ${response.status} ${response.statusText} - ${errorData}`);
            }
            const data = await response.json();
            const duration = Date.now() - startTime;
            const responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (!responseContent) {
                throw new Error('Gemini API返回空响应');
            }
            logger_1.logger.info('Gemini API调用成功', {
                duration,
                responseLength: responseContent.length,
                tokensUsed: data.usageMetadata?.totalTokenCount,
                ...context
            });
            return responseContent;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error('Gemini API调用失败', error, {
                duration,
                promptLength: prompt.length,
                ...context
            });
            throw errors_1.ErrorFactory.createOpenAIError(error);
        }
    }
    async healthCheck() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': this.apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: 'test'
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1
                    }
                })
            });
            return response.ok;
        }
        catch (error) {
            logger_1.logger.error('Gemini健康检查失败', error);
            return false;
        }
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=gemini.js.map