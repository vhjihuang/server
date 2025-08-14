"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const api_1 = require("../types/api");
const errors_1 = require("../types/errors");
class ValidationService {
    static validateGenerateRequest(data) {
        const errors = [];
        if (!data.description) {
            errors.push('description 字段是必需的');
        }
        else if (!(0, api_1.isValidDescription)(data.description)) {
            if (typeof data.description !== 'string') {
                errors.push('description 必须是字符串类型');
            }
            else if (data.description.trim().length === 0) {
                errors.push('description 不能为空');
            }
            else if (data.description.length > 500) {
                errors.push('description 长度不能超过500个字符');
            }
        }
        if (!data.type) {
            errors.push('type 字段是必需的');
        }
        else if (typeof data.type !== 'string') {
            errors.push('type 必须是字符串类型');
        }
        else if (!(0, api_1.isNamingType)(data.type.toLowerCase())) {
            errors.push('type 必须是以下值之一: function, variable, class, boolean, constant');
        }
        if (!data.style) {
            errors.push('style 字段是必需的');
        }
        else if (typeof data.style !== 'string') {
            errors.push('style 必须是字符串类型');
        }
        else if (!(0, api_1.isNamingStyle)(data.style)) {
            errors.push('style 必须是以下值之一: camelCase, snake_case, PascalCase, kebab-case, UPPER_SNAKE_CASE');
        }
        if (errors.length > 0) {
            throw new errors_1.ValidationError('请求参数验证失败', errors);
        }
        return {
            description: data.description.trim(),
            type: data.type.toLowerCase(),
            style: data.style
        };
    }
    static validateEnvironment() {
        const errors = [];
        if (!process.env['OPENAI_API_KEY']) {
            errors.push('OPENAI_API_KEY 环境变量未设置');
        }
        const port = process.env['PORT'];
        if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
            errors.push('PORT 必须是1-65535之间的数字');
        }
        if (errors.length > 0) {
            throw new Error(`环境变量验证失败: ${errors.join(', ')}`);
        }
    }
    static validateOpenAIResponse(response) {
        if (!response || typeof response !== 'string') {
            throw new Error('OpenAI API返回的响应无效');
        }
        if (response.trim().length === 0) {
            throw new Error('OpenAI API返回的响应为空');
        }
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(response);
        }
        catch (error) {
            throw new Error('OpenAI API返回的响应不是有效的JSON格式');
        }
        if (!Array.isArray(parsedResponse)) {
            throw new Error('OpenAI API返回的响应不是数组格式');
        }
        if (parsedResponse.length !== 5) {
            throw new Error(`期望返回5个命名建议，但实际返回了${parsedResponse.length}个`);
        }
        for (let i = 0; i < parsedResponse.length; i++) {
            if (typeof parsedResponse[i] !== 'string') {
                throw new Error(`第${i + 1}个命名建议不是字符串类型`);
            }
            if (parsedResponse[i].trim().length === 0) {
                throw new Error(`第${i + 1}个命名建议为空`);
            }
        }
        return parsedResponse.map((name) => name.trim());
    }
}
exports.ValidationService = ValidationService;
//# sourceMappingURL=validator.js.map