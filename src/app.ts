/**
 * TypeScript版本命名生成API应用入口
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入类型和服务
import { AppConfig, validateConfig } from './types/config';
import { OpenAIService } from './services/openai';
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
  private openaiService: OpenAIService;
  private generateController: GenerateController;

  constructor() {
    this.app = express();
    this.config = this.loadConfig();
    this.openaiService = new OpenAIService(this.config.openaiApiKey);
    this.generateController = new GenerateController(this.openaiService);
    
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
        openaiApiKey: process.env['OPENAI_API_KEY']!,
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