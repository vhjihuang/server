# TypeScript版本命名生成API设计文档

## 概述

本文档描述了命名生成API的TypeScript重写版本的设计。该版本利用TypeScript的类型系统来提供更好的开发体验、更少的运行时错误和更简洁的代码。

## 架构

### 项目结构
```
src/
├── types/           # 类型定义
│   ├── api.ts      # API相关类型
│   ├── errors.ts   # 错误类型
│   └── config.ts   # 配置类型
├── services/        # 业务逻辑服务
│   ├── gemini.ts   # Google Gemini API服务
│   ├── prompt.ts   # Prompt生成服务
│   ├── logger.ts   # 日志服务
│   └── validator.ts # 验证服务
├── middleware/      # Express中间件
│   ├── validation.ts # 请求验证
│   └── errorHandler.ts # 错误处理
├── controllers/     # 控制器
│   └── generate.ts  # 生成命名控制器
└── app.ts          # 应用入口
```

## 组件和接口

### 类型定义

#### API类型 (types/api.ts)
```typescript
// 请求类型
export type NamingType = 'function' | 'variable' | 'class' | 'boolean' | 'constant';
export type NamingStyle = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case' | 'UPPER_SNAKE_CASE';

export interface GenerateRequest {
  description: string;
  type: NamingType;
  style: NamingStyle;
}

// 响应类型
export interface GenerateResponse {
  success: true;
  data: string[];
  count: number;
  requestId: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorType: string;
  timestamp: string;
  requestId: string;
  details?: string[];
}

// 请求上下文类型
export interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp?: string;
}
```

#### 错误类型 (types/errors.ts)
```typescript
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  RESPONSE_PARSING_ERROR = 'RESPONSE_PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_ERROR = 'QUOTA_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: ErrorType,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 服务层

#### Gemini服务 (services/gemini.ts)
```typescript
import { GoogleGenAI } from '@google/genai';
import { AppError, ErrorType } from '../types/errors';
import { RequestContext } from '../types/api';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GOOGLE_API_KEY
    });
  }

  async generateNaming(prompt: string, context: RequestContext = { requestId: 'unknown' }): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // 禁用思考模式以获得更快响应
          },
          temperature: 0.7,
          maxOutputTokens: 150,
        }
      });

      const content = response.text?.trim();
      if (!content) {
        throw new AppError('Gemini API返回空响应', 500, ErrorType.GEMINI_API_ERROR);
      }

      return content;
    } catch (error: any) {
      throw this.handleGeminiError(error);
    }
  }

  private handleGeminiError(error: any): AppError {
    // 错误处理逻辑，针对Gemini API
    if (error.status === 429) {
      return new AppError('API请求频率限制', 429, ErrorType.RATE_LIMIT_ERROR);
    }
    if (error.status === 403) {
      return new AppError('API密钥无效或权限不足', 403, ErrorType.AUTHENTICATION_ERROR);
    }
    return new AppError('Gemini API调用失败', 500, ErrorType.GEMINI_API_ERROR);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "test",
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return !!response.text;
    } catch (error) {
      return false;
    }
  }
}
```

#### 验证服务 (services/validator.ts)
```typescript
import { GenerateRequest, NamingType, NamingStyle } from '../types/api';
import { AppError, ErrorType } from '../types/errors';

export class ValidationService {
  static validateRequest(data: any): GenerateRequest {
    const errors: string[] = [];

    // TypeScript的类型守卫
    if (!this.isValidDescription(data.description)) {
      errors.push('description字段无效');
    }

    if (!this.isValidType(data.type)) {
      errors.push('type字段无效');
    }

    if (!this.isValidStyle(data.style)) {
      errors.push('style字段无效');
    }

    if (errors.length > 0) {
      throw new AppError('请求参数验证失败', 400, ErrorType.VALIDATION_ERROR);
    }

    return data as GenerateRequest;
  }

  private static isValidDescription(desc: any): desc is string {
    return typeof desc === 'string' && desc.trim().length > 0 && desc.length <= 500;
  }

  private static isValidType(type: any): type is NamingType {
    const validTypes: NamingType[] = ['function', 'variable', 'class', 'boolean', 'constant'];
    return validTypes.includes(type);
  }

  private static isValidStyle(style: any): style is NamingStyle {
    const validStyles: NamingStyle[] = ['camelCase', 'snake_case', 'PascalCase', 'kebab-case', 'UPPER_SNAKE_CASE'];
    return validStyles.includes(style);
  }
}
```

### 中间件

#### 验证中间件 (middleware/validation.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../services/validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = ValidationService.validateRequest(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 错误处理中间件 (middleware/errorHandler.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { ErrorResponse } from '../types/api';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const response: ErrorResponse = {
    success: false,
    error: err instanceof AppError ? err.message : '内部服务器错误',
    errorType: err instanceof AppError ? err.errorType : 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string || 'unknown'
  };

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  res.status(statusCode).json(response);
};
```

## 数据模型

### 请求验证流程
1. Express接收请求
2. 验证中间件使用类型守卫验证参数
3. 类型安全的请求对象传递给控制器
4. 控制器调用服务层处理业务逻辑

### 错误处理流程
1. 服务层抛出类型化的错误
2. 错误中间件捕获并分类处理
3. 返回类型安全的错误响应

## 错误处理

### 错误分类
- 使用枚举定义错误类型
- 自定义错误类继承标准Error
- 类型安全的错误响应格式

### 日志记录
- 结构化日志输出
- 类型安全的日志上下文
- 开发/生产环境区分

## 测试策略

### 单元测试
- 使用Jest + TypeScript
- 测试类型定义的正确性
- Mock外部依赖

### 集成测试
- 端到端API测试
- 类型兼容性测试
- 性能基准测试

### 类型测试
```typescript
// 编译时类型检查
const request: GenerateRequest = {
  description: "test",
  type: "function", // 类型安全
  style: "camelCase" // 类型安全
};
```

## 构建和部署

### 开发环境
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "type-check": "tsc --noEmit"
  }
}
```

### 生产构建
- TypeScript编译为ES2020
- 源码映射用于调试
- 优化的JavaScript输出

### Docker配置
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

## 性能考虑

### 编译时优化
- 严格的类型检查减少运行时错误
- 编译器优化输出代码
- Tree-shaking移除未使用代码

### 运行时性能
- 编译后的JavaScript性能与原版相当
- 类型检查在编译时完成，无运行时开销
- 更好的IDE支持提高开发效率

## 迁移策略

### API兼容性
- 保持相同的HTTP接口
- 相同的请求/响应格式
- 相同的错误状态码

### 部署策略
- 蓝绿部署确保零停机
- 渐进式流量切换
- 回滚机制