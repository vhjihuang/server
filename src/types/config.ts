/**
 * 配置相关类型定义
 */

// 环境类型
export type Environment = 'development' | 'production' | 'test';

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 应用配置接口
export interface AppConfig {
  port: number;
  environment: Environment;
  openaiApiKey: string;
  logLevel: LogLevel;
}

// OpenAI配置接口
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

// 服务器配置接口
export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
  };
}

// 日志配置接口
export interface LogConfig {
  level: LogLevel;
  format: 'json' | 'simple';
  timestamp: boolean;
}

// 配置验证函数
export function validateConfig(config: {
  port?: number | undefined;
  environment?: Environment | undefined;
  openaiApiKey?: string | undefined;
  logLevel?: LogLevel | undefined;
}): AppConfig {
  const errors: string[] = [];

  if (!config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  return {
    port: config.port || 3001,
    environment: config.environment || 'development',
    openaiApiKey: config.openaiApiKey!,
    logLevel: config.logLevel || LogLevel.INFO
  };
}