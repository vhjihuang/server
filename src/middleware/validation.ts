/**
 * 请求验证中间件
 */

import { Request, Response, NextFunction } from "express";
import { ValidationService } from "../services/validator";
import { logger } from "../services/logger";

// 扩展Request类型以包含验证后的数据
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      validatedBody?: any;
    }
  }
}

/**
 * 生成请求ID中间件
 */
export const generateRequestId = (req: Request, _res: Response, next: NextFunction): void => {
  req.requestId = (req.headers["x-request-id"] as string) || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
};

/**
 * 验证生成命名请求参数
 */
export const validateGenerateRequest = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    logger.debug("开始验证请求参数", {
      requestId: req.requestId,
      hasDescription: !!req.body.description,
      hasType: !!req.body.type,
      hasStyle: !!req.body.style,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.socket?.remoteAddress,
    });

    // 使用验证服务验证请求
    req.validatedBody = ValidationService.validateRequest(req.body);

    logger.debug("请求参数验证通过", {
      requestId: req.requestId,
      descriptionLength: req.validatedBody.description.length,
      type: req.validatedBody.type,
      style: req.validatedBody.style,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 请求日志中间件
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // 记录请求开始
  logger.info("收到API请求", {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
    ip: req.ip || req.socket?.remoteAddress,
  });

  // 监听响应完成
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("API请求完成", {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
};
