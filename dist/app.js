"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./types/config");
const openai_1 = require("./services/openai");
const gemini_1 = require("./services/gemini");
const mock_openai_1 = require("./services/mock-openai");
const generate_1 = require("./controllers/generate");
const validator_1 = require("./services/validator");
const logger_1 = require("./services/logger");
const validation_1 = require("./middleware/validation");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config = this.loadConfig();
        if (process.env['USE_MOCK_OPENAI'] === 'true') {
            this.openaiService = new mock_openai_1.MockOpenAIService();
        }
        else if (this.config.geminiApiKey && this.config.geminiApiKey !== 'your-gemini-api-key-here') {
            this.openaiService = new gemini_1.GeminiService(this.config.geminiApiKey);
        }
        else if (this.config.openaiApiKey && this.config.openaiApiKey !== 'your-openai-api-key-here') {
            this.openaiService = new openai_1.OpenAIService(this.config.openaiApiKey);
        }
        else {
            this.openaiService = new mock_openai_1.MockOpenAIService();
        }
        this.generateController = new generate_1.GenerateController(this.openaiService);
        this.setupGlobalHandlers();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    loadConfig() {
        try {
            validator_1.ValidationService.validateEnvironment();
            const config = (0, config_1.validateConfig)({
                port: process.env['PORT'] ? parseInt(process.env['PORT'], 10) : undefined,
                environment: process.env['NODE_ENV'],
                openaiApiKey: process.env['OPENAI_API_KEY'],
                geminiApiKey: process.env['GEMINI_API_KEY'],
                logLevel: process.env['LOG_LEVEL']
            });
            logger_1.logger.info('配置加载成功', {
                requestId: 'startup',
                port: config.port,
                environment: config.environment,
                logLevel: config.logLevel
            });
            return config;
        }
        catch (error) {
            console.error('配置加载失败:', error.message);
            process.exit(1);
        }
    }
    setupGlobalHandlers() {
        (0, errorHandler_1.setupGlobalErrorHandlers)();
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)({
            origin: process.env['CORS_ORIGIN'] || true,
            credentials: true
        }));
        this.app.use(express_1.default.json({ limit: '1mb' }));
        this.app.use(validation_1.generateRequestId);
        this.app.use(validation_1.requestLogger);
    }
    setupRoutes() {
        this.app.get('/health', this.generateController.healthCheck);
        this.app.post('/api/generate', validation_1.validateGenerateRequest, this.generateController.generateNaming);
        this.app.get('/', (_req, res) => {
            res.json({
                name: 'Naming Generation API (TypeScript)',
                version: '1.0.0',
                description: '智能命名生成API - TypeScript版本',
                endpoints: {
                    generate: 'POST /api/generate',
                    health: 'GET /health'
                },
                timestamp: new Date().toISOString()
            });
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    start() {
        this.app.listen(this.config.port, '0.0.0.0', () => {
            logger_1.logger.info('命名生成API服务器已启动 (TypeScript版本)', {
                requestId: 'startup',
                port: this.config.port,
                environment: this.config.environment,
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
            });
        });
    }
    getApp() {
        return this.app;
    }
}
if (require.main === module) {
    const app = new App();
    app.start();
}
exports.default = App;
//# sourceMappingURL=app.js.map