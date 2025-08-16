/**
 * 生成命名控制器
 */

import { Request, Response, NextFunction } from "express";
import { GenerateRequest, GenerateResponse, RequestContext } from "../types/api";
import { OpenAIService } from "../services/openai";
import { GeminiService } from "../services/gemini";
import { MockOpenAIService } from "../services/mock-openai";
import { PromptService } from "../services/prompt";
import { ValidationService } from "../services/validator";

import { logger } from "../services/logger";
import { SmartNamingService } from "../services/smart-naming";

export class GenerateController {
  private openaiService: OpenAIService | GeminiService | MockOpenAIService;
  private smartNamingService: SmartNamingService;

  constructor(openaiService: OpenAIService | GeminiService | MockOpenAIService) {
    this.openaiService = openaiService;
    this.smartNamingService = new SmartNamingService();
  }

  /**
   * 生成命名建议
   */
  generateNaming = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.requestId;

    try {
      // 获取验证后的请求数据
      const { description, type, style }: GenerateRequest = req.validatedBody;

      const context: RequestContext = {
        requestId,
        description: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
        type,
        style,
        userAgent: req.headers["user-agent"] || undefined,
        ip: req.ip || req.socket?.remoteAddress || undefined,
      };

      let namingSuggestions: string[];

      try {
        // 构建智能prompt
        const prompt = PromptService.buildPrompt(description, type, style);
        // 调用OpenAI API
        const apiResponse = await this.openaiService.generateNaming(prompt, context);

        // 解析和验证响应
        namingSuggestions = ValidationService.validateAIResponse(apiResponse);
      } catch (aiError) {
        // AI服务失败时回退到智能本地算法
        logger.warn("AI服务失败，回退到智能本地算法", { error: (aiError as Error).message, ...context });

        try {
          const localResponse = await this.smartNamingService.generateNaming(description, context);
          namingSuggestions = JSON.parse(localResponse);
        } catch (localError) {
          // 智能本地算法也失败时使用默认建议
          logger.error("智能本地算法失败，使用默认建议", localError as Error, context);
          namingSuggestions = ["defaultName", "fallbackName", "backupName", "alternativeName", "reserveName"];
        }
      }

      const duration = Date.now() - startTime;

      // 记录成功日志
      logger.info("API请求处理成功", {
        ...context,
        duration,
        suggestionsCount: namingSuggestions.length,
      });

      // 返回成功响应
      const response: GenerateResponse = {
        success: true,
        data: namingSuggestions,
        count: namingSuggestions.length,
        requestId,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      // 将错误传递给全局错误处理中间件
      next(error);
    }
  };

  /**
   * 健康检查端点
   */
  healthCheck = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isHealthy = await this.openaiService.healthCheck();

      res.json({
        success: true,
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          openai: isHealthy ? "ok" : "error",
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
