/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, isOperationalError } from '../types/errors';
import { ErrorResponse } from '../types/api';
import { logger } from '../services/logger';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 如果响应已经发送，则交给Express默认错误处理器
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.requestId || 'unknown';
  const context = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  };

  // 区分操作性错误和程序错误
  if (isOperationalError(err)) {
    // 操作性错误（预期的错误）- 记录为警告
    logger.warn('操作性错误', {
      ...context,
      error: err.message,
      errorType: (err as AppError).errorType,
      statusCode: (err as AppError).statusCode
    });
  } else {
    // 程序错误（未预期的错误）- 记录为错误
    logger.error('未处理的程序错误', err, context);
  }

  // 生成安全的错误响应
  const errorResponse = generateSafeErrorResponse(err, req);
  const statusCode = isAppError(err) ? err.statusCode : 500;

  res.status(statusCode).json(errorResponse);
};

/**
 * 生成安全的错误响应
 */
function generateSafeErrorResponse(error: Error, req: Request): ErrorResponse {
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  const requestId = req.requestId || 'unknown';

  const baseResponse: ErrorResponse = {
    success: false,
    error: '内部服务器错误，请稍后重试',
    errorType: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId
  };

  // 如果是自定义应用错误
  if (isAppError(error)) {
    return {
      ...baseResponse,
      error: error.message,
      errorType: error.errorType,
      // 如果是验证错误，包含详细信息
      ...(error.errorType === 'VALIDATION_ERROR' && 'details' in error && {
        details: (error as any).details
      })
    };
  }

  // 对于未知错误，在开发环境显示详细信息
  if (isDevelopment) {
    return {
      ...baseResponse,
      error: error.message
    };
  }

  return baseResponse;
}

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: `路径 ${req.originalUrl} 不存在`,
    errorType: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown'
  };

  res.status(404).json(errorResponse);
};

/**
 * 处理未捕获的异常和Promise拒绝
 */
export const setupGlobalErrorHandlers = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('未捕获的异常', err, { 
      requestId: 'global',
      source: 'uncaughtException' 
    });
    
    // 优雅关闭服务器
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('未处理的Promise拒绝', reason, {
      requestId: 'global',
      source: 'unhandledRejection',
      promise: promise.toString()
    });
    
    // 优雅关闭服务器
    process.exit(1);
  });
};