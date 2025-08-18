// src/controllers/generate.ts
import { Request, Response, NextFunction } from "express";
import { GenerateRequest, GenerateResponse, RequestContext } from "../types/api";
import { OpenAIService } from "../services/openai";
import { GeminiService } from "../services/gemini";
import { MockOpenAIService } from "../services/mock-openai";
import { logger } from "../services/logger";
import { SmartNamingService } from "../services/smart-naming";

export class GenerateController {
  private aiService: OpenAIService | GeminiService | MockOpenAIService;
  private smartNamingService: SmartNamingService;

  constructor(
    aiService: OpenAIService | GeminiService | MockOpenAIService,
    smartNamingService: SmartNamingService
  ) {
    this.aiService = aiService;
    this.smartNamingService = smartNamingService;
  }

  /**
   * 生成命名建议（优化版）
   */
  generateNaming = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.requestId;
    
    try {
      const { description = "", type, style }: GenerateRequest = req.validatedBody;

      const context: RequestContext = {
        requestId,
        description: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
        type,
        style,
        userAgent: req.headers["user-agent"],
        ip: req.ip || req.socket?.remoteAddress
      };

      // 调试信息精简
      logger.debug("命名生成请求开始", { 
        requestId,
        type,
        style,
        descLength: description.length 
      });
      logger.info("收到命名生成请求", { requestId });
      const useLocalAI = this.shouldUseLocalAI();
      const suggestions = await this.generateSuggestions(description, context, useLocalAI);

      logger.info("命名生成成功", {
        requestId,
        type,
        style,
        duration: Date.now() - startTime,
        source: useLocalAI ? "local" : "remote"
      });

      res.json(this.buildSuccessResponse(suggestions, requestId));
    } catch (error) {
      logger.error("命名生成失败", error as Error, { 
        requestId,
      });
      next(error);
    }
  };

  /**
   * 判断是否使用本地AI服务
   */
  private shouldUseLocalAI(): boolean {
    return (
      process.env.NODE_ENV === "development" ||
      process.env.USE_LOCAL_NAMING === "true" 
      // || this.smartNamingService.healthCheck() // 异步方法不能在此处使用
    );
  }

  /**
   * 生成命名建议核心逻辑
   */
  private async generateSuggestions(
    description: string,
    context: RequestContext,
    useLocal: boolean
  ): Promise<string[]> {
    try {
      const rawContent = await (useLocal
        ? this.smartNamingService.generateNaming(description, context)
        : this.aiService.generateNaming(description, context));
      
      return this.parseSuggestions(rawContent);
    } catch (error) {
      logger.warn(`${useLocal ? "本地" : "远程"}服务失败，尝试回退`, {
        requestId: context.requestId
      });
      return this.fallbackGenerate(description, context, !useLocal);
    }
  }

  /**
   * 解析建议内容
   */
  private parseSuggestions(raw: string): string[] {
    try {

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return ["defaultName", "fallbackName"];
    }
  }

  /**
   * 回退生成逻辑
   */
  private async fallbackGenerate(
    description: string,
    context: RequestContext,
    useLocal: boolean
  ): Promise<string[]> {
    try {
      const rawContent = await (useLocal
        ? this.smartNamingService.generateNaming(description, context)
        : this.aiService.generateNaming(description, context));
      
      return this.parseSuggestions(rawContent);
    } catch {
      return ["emergencyDefaultName"];
    }
  }

  /**
   * 构建成功响应
   */
  private buildSuccessResponse(
    suggestions: string[],
    requestId: string
  ): GenerateResponse {
    return {
      success: true,
      data: suggestions,
      count: suggestions.length,
      requestId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 健康检查端点（优化版）
   */
  healthCheck = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [aiHealthy, localHealthy] = await Promise.all([
        this.aiService.healthCheck(),
        this.smartNamingService.healthCheck()
      ]);

      res.json({
        success: true,
        status: aiHealthy && localHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          remoteAI: aiHealthy,
          localNaming: localHealthy
        }
      });
    } catch (error) {
      logger.error("健康检查异常", error as Error);
      next(error);
    }
  };
}