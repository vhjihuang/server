"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOpenAIService = void 0;
const logger_1 = require("./logger");
class MockOpenAIService {
    async generateNaming(prompt, context = { requestId: "unknown" }) {
        const startTime = Date.now();
        logger_1.logger.debug("开始模拟OpenAI API调用", {
            promptLength: prompt.length,
            ...context,
        });
        await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
        const mockResponse = this.generateMockResponse(prompt, context);
        const duration = Date.now() - startTime;
        logger_1.logger.info("模拟OpenAI API调用成功", {
            duration,
            responseLength: mockResponse.length,
            tokensUsed: Math.floor(Math.random() * 100) + 50,
            ...context,
        });
        return mockResponse;
    }
    generateMockResponse(_prompt, context) {
        const { type, style, description } = context;
        const suggestions = this.getMockSuggestions(description || "", type, style);
        return JSON.stringify(suggestions);
    }
    getMockSuggestions(description, type, style) {
        const baseNames = this.generateBaseNames(description, type);
        if (!style) {
            return baseNames.slice(0, 5);
        }
        return baseNames.map((name) => this.applyNamingStyle(name, style)).slice(0, 5);
    }
    generateBaseNames(description, type) {
        const keywords = this.extractKeywords(description);
        const suggestions = [];
        const firstKeyword = keywords[0] || "item";
        switch (type) {
            case "function":
                suggestions.push(`get_${firstKeyword}`, `fetch_${firstKeyword}`, `retrieve_${firstKeyword}`, `load_${firstKeyword}`, `obtain_${firstKeyword}`, `acquire_${firstKeyword}`, `collect_${firstKeyword}`);
                break;
            case "variable":
                suggestions.push(firstKeyword, `${firstKeyword}_data`, `${firstKeyword}_info`, `${firstKeyword}_details`, `${firstKeyword}_record`, `current_${firstKeyword}`, `selected_${firstKeyword}`);
                break;
            case "class":
                suggestions.push(`${firstKeyword}_manager`, `${firstKeyword}_service`, `${firstKeyword}_controller`, `${firstKeyword}_handler`, `${firstKeyword}_processor`, `${firstKeyword}_builder`, `${firstKeyword}_factory`);
                break;
            case "boolean":
                suggestions.push(`is_${firstKeyword}`, `has_${firstKeyword}`, `can_${firstKeyword}`, `should_${firstKeyword}`, `${firstKeyword}_enabled`, `${firstKeyword}_active`, `${firstKeyword}_valid`);
                break;
            case "constant":
                suggestions.push(`${firstKeyword.toUpperCase()}_CONFIG`, `DEFAULT_${firstKeyword.toUpperCase()}`, `MAX_${firstKeyword.toUpperCase()}`, `MIN_${firstKeyword.toUpperCase()}`, `${firstKeyword.toUpperCase()}_LIMIT`, `${firstKeyword.toUpperCase()}_VALUE`, `${firstKeyword.toUpperCase()}_SETTING`);
                break;
            default:
                suggestions.push(firstKeyword, `${firstKeyword}_item`, `${firstKeyword}_object`, `${firstKeyword}_element`, `${firstKeyword}_component`);
        }
        return suggestions;
    }
    extractKeywords(description) {
        const cleanDesc = description
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        const chineseToEnglish = {
            用户: "user",
            数据: "data",
            信息: "info",
            获取: "get",
            删除: "delete",
            更新: "update",
            创建: "create",
            查询: "query",
            搜索: "search",
            配置: "config",
            设置: "setting",
            管理: "manage",
            处理: "process",
            验证: "validate",
            检查: "check",
            计算: "calculate",
            生成: "generate",
            构建: "build",
            解析: "parse",
            格式化: "format",
            转换: "convert",
        };
        let keywords = [];
        for (const [chinese, english] of Object.entries(chineseToEnglish)) {
            if (cleanDesc.includes(chinese)) {
                keywords.push(english);
            }
        }
        const englishWords = cleanDesc.match(/[a-zA-Z]+/g) || [];
        keywords.push(...englishWords.map((word) => word.toLowerCase()));
        if (keywords.length === 0) {
            keywords = ["item", "data", "value"];
        }
        return [...new Set(keywords)];
    }
    applyNamingStyle(name, style) {
        switch (style) {
            case "camelCase":
                return this.toCamelCase(name);
            case "snake_case":
                return this.toSnakeCase(name);
            case "PascalCase":
                return this.toPascalCase(name);
            case "kebab-case":
                return this.toKebabCase(name);
            case "UPPER_SNAKE_CASE":
                return this.toUpperSnakeCase(name);
            default:
                return name;
        }
    }
    toCamelCase(str) {
        const result = str
            .toLowerCase()
            .replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase());
        return result.charAt(0).toLowerCase() + result.slice(1);
    }
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, "_$1")
            .replace(/[-\s]+/g, "_")
            .toLowerCase()
            .replace(/^_/, "");
    }
    toPascalCase(str) {
        return this.capitalize(this.toCamelCase(str));
    }
    toKebabCase(str) {
        return this.toSnakeCase(str).replace(/_/g, "-");
    }
    toUpperSnakeCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    async healthCheck() {
        logger_1.logger.info("模拟OpenAI健康检查", { status: "healthy" });
        return true;
    }
}
exports.MockOpenAIService = MockOpenAIService;
//# sourceMappingURL=mock-openai.js.map