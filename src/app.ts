/**
 * TypeScript版本命名生成API应用入口
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入类型和服务
import { AppConfig, validateConfig } from './types/config';
import { OpenAIService } from './services/openai';
import { GeminiService } from './services/gemini';
import { MockOpenAIService } from './services/mock-openai';
import { SmartNamingService } from './services/smart-naming';
import { GenerateController } from './controllers/generate';
import { ValidationService } from './services/validator';
import { logger } from './services/logger';

// 导入中间件
import { 
  generateRequestId, 
  validateGenerateRequest, 
  requestLogger 
} from './middleware/validation';
import { 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers 
} from './middleware/errorHandler';

// 加载环境变量
dotenv.config();

class App {
  private app: express.Application;
  private config: AppConfig;
  private aiService: OpenAIService | GeminiService | MockOpenAIService; 
  private smartNamingService: SmartNamingService;
  private generateController: GenerateController;

  constructor() {
    this.app = express();
    this.config = this.loadConfig();
    
    // 初始化 SmartNamingService
    this.smartNamingService = new SmartNamingService(process.cwd());
    
    // 智能选择AI服务：优先本地，然后Gemini，然后OpenAI，最后模拟服务
    if (process.env['USE_LOCAL_NAMING'] === 'true') { // 首先检查是否使用本地命名服务
      this.aiService = new MockOpenAIService(); // 当使用本地服务时，仍然需要一个备用的远程AI服务
      logger.info('使用本地命名服务 (SmartNamingService) 和模拟OpenAI服务作为备用');
    } else if (process.env['USE_MOCK_OPENAI'] === 'true') {
      this.aiService = new MockOpenAIService();
      logger.info('使用模拟OpenAI服务');
    } else if (this.config.geminiApiKey && this.config.geminiApiKey !== 'your-gemini-api-key-here') {
      this.aiService = new GeminiService(); // 实例化 GeminiService
      logger.info('使用Gemini API服务');
    } else if (this.config.openaiApiKey && this.config.openaiApiKey !== 'your-openai-api-key-here') {
      this.aiService = new OpenAIService(this.config.openaiApiKey); // 实例化 OpenAI Service
      logger.info('使用OpenAI API服务');
    } else {
      this.aiService = new MockOpenAIService();
      logger.warn('未检测到有效API密钥，回退到模拟OpenAI服务');
    }
    
    // 将选择的 AI 服务和 SmartNamingService 传递给 GenerateController
    this.generateController = new GenerateController(this.aiService, this.smartNamingService);
    
    this.setupGlobalHandlers();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 加载和验证配置
   */
  private loadConfig(): AppConfig {
    try {
      // 验证环境变量
      ValidationService.validateEnvironment();

      // 创建配置对象
      const config = validateConfig({
        port: process.env['PORT'] ? parseInt(process.env['PORT'], 10) : undefined,
        environment: process.env['NODE_ENV'] as any,
        openaiApiKey: process.env['OPENAI_API_KEY'],
        geminiApiKey: process.env['GEMINI_API_KEY'],
        logLevel: process.env['LOG_LEVEL'] as any
      });

      logger.info('配置加载成功', {
        requestId: 'startup',
        port: config.port,
        environment: config.environment,
        logLevel: config.logLevel
      });

      return config;
    } catch (error) {
      console.error('配置加载失败:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalHandlers(): void {
    setupGlobalErrorHandlers();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // CORS配置
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN'] || true,
      credentials: true
    }));

    // 解析JSON请求体
    this.app.use(express.json({ limit: '1mb' }));

    // 生成请求ID
    this.app.use(generateRequestId);

    // 请求日志
    this.app.use(requestLogger);
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查端点
    this.app.get('/health', this.generateController.healthCheck);

    // 生成命名API端点
    this.app.post('/api/generate', 
      validateGenerateRequest,
      this.generateController.generateNaming
    );

    // 根路径信息
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

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 404处理
    this.app.use(notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler);
  }

  /**
   * 启动服务器
   */
  public start(): void {
    this.app.listen(this.config.port, '0.0.0.0', () => {
      logger.info('命名生成API服务器已启动 (TypeScript版本)', {
        requestId: 'startup',
        port: this.config.port,
        environment: this.config.environment,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 获取Express应用实例（用于测试）
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  const app = new App();
  app.start();
}

export default App;