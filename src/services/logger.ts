/**
 * 类型安全的日志服务
 */

import { LogLevel } from "../types/config";
import { ErrorType } from "../types/errors";
import { LogContext } from "../types/api";

// 日志条目接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

// 日志服务类
export class LoggerService {
  private static instance: LoggerService;
  private logLevel: LogLevel;

  private constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  static getInstance(logLevel?: LogLevel): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(logLevel);
    }
    return LoggerService.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, any>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { ...context }),
    };
    return JSON.stringify(entry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logContext: Record<string, any> = {
      errorType: ErrorType.INTERNAL_ERROR,
      ...context,
    };

    if (error) {
      logContext["error"] = {
        name: error.name,
        message: error.message,
        ...(process.env["NODE_ENV"] === "development" && { stack: error.stack }),
      };
    }

    console.error(this.formatLog(LogLevel.ERROR, message, logContext));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatLog(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatLog(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    if (process.env["NODE_ENV"] === "development") {
      console.log(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  // 专门的错误类型日志方法
  logOpenAIError(error: any, context?: LogContext): void {
    let errorType = ErrorType.OPENAI_API_ERROR;

    if (error.code === "insufficient_quota") {
      errorType = ErrorType.QUOTA_ERROR;
    } else if (error.code === "rate_limit_exceeded") {
      errorType = ErrorType.RATE_LIMIT_ERROR;
    } else if (error.code === "invalid_api_key") {
      errorType = ErrorType.AUTHENTICATION_ERROR;
    } else if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.request && !error.response) {
      errorType = ErrorType.NETWORK_ERROR;
    }

    this.error("OpenAI API调用失败", error, {
      errorType: errorType,
      ...context,
    });
  }

  logGeminiError(error: any, context?: LogContext): void {
    let errorType = ErrorType.GEMINI_API_ERROR;

    if (error.status === 429) {
      errorType = ErrorType.RATE_LIMIT_ERROR;
    } else if (error.status === 403) {
      errorType = ErrorType.AUTHENTICATION_ERROR;
    } else if (error.status === 402) {
      errorType = ErrorType.QUOTA_ERROR;
    } else if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorType = ErrorType.NETWORK_ERROR;
    }

    this.error("Gemini API调用失败", error, {
      errorType: errorType,
      ...context,
    });
  }

  logValidationError(message: string, errors: string[], context?: LogContext): void {
    this.warn(message, {
      errorType: ErrorType.VALIDATION_ERROR,
      validationErrors: errors,
      ...context,
    });
  }

  logResponseParsingError(message: string, rawResponse: string, context?: LogContext): void {
    const safeRawResponse = typeof rawResponse === "string" ? rawResponse : String(rawResponse || "");

    this.error(message, undefined, {
      errorType: ErrorType.RESPONSE_PARSING_ERROR,
      rawResponseLength: safeRawResponse.length,
      rawResponsePreview: safeRawResponse.substring(0, 100),
      ...context,
    });
  }
}

// 导出单例实例
export const logger = LoggerService.getInstance();
