/**
 * Google Gemini API服务
 */

import { GoogleGenAI } from "@google/genai";
import { ErrorFactory, AppError, ErrorType } from "../types/errors";
import { RequestContext } from "../types/api";
import { logger } from "./logger";
import { MockGeminiService } from "./mock-gemini";
import { SmartNamingService } from "./smart-naming";

export class GeminiService {
  private ai?: GoogleGenAI;
  private mockService?: MockGeminiService;
  private localService?: SmartNamingService;
  private mode: "real" | "mock" | "local";

  constructor(apiKey?: string) {
    // 检查使用哪种模式
    if (process.env["USE_LOCAL_NAMING"] === "true") {
      this.mode = "local";
      logger.info("使用本地命名生成服务");
      this.localService = new SmartNamingService();
    } else if (process.env["USE_MOCK_GEMINI"] === "true") {
      this.mode = "mock";
      logger.info("使用Mock Gemini服务");
      this.mockService = new MockGeminiService(apiKey);
    } else {
      this.mode = "real";
      // 如果提供了apiKey参数，使用它；否则GoogleGenAI会自动从环境变量GEMINI_API_KEY读取
      if (apiKey) {
        this.ai = new GoogleGenAI({
          apiKey: apiKey,
        });
      } else {
        // 让GoogleGenAI自动从环境变量读取API密钥
        this.ai = new GoogleGenAI({});
      }
    }
  }

  /**
   * 调用Gemini API生成命名建议
   */
  async generateNaming(prompt: string, context: RequestContext = { requestId: "unknown" }): Promise<string> {
    // 根据模式选择服务
    if (this.mode === "local" && this.localService) {
      return await this.localService.generateNaming(prompt, context);
    }

    if (this.mode === "mock" && this.mockService) {
      return await this.mockService.generateNaming(prompt, context);
    }

    // 使用真实的Gemini API
    if (!this.ai) {
      throw new AppError("Gemini服务未正确初始化", 500, ErrorType.INTERNAL_ERROR);
    }

    const startTime = Date.now();

    logger.debug("开始调用Gemini API", {
      promptLength: prompt.length,
      ...context,
    });

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
        },
      });

      const duration = Date.now() - startTime;
      const responseContent = response.text?.trim();

      if (!responseContent) {
        throw new AppError("Gemini API返回空响应", 500, ErrorType.GEMINI_API_ERROR);
      }

      logger.info("Gemini API调用成功", {
        duration,
        responseLength: responseContent.length,
        ...context,
      });

      return responseContent;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error("Gemini API调用失败", error, {
        duration,
        promptLength: prompt.length,
        ...context,
      });

      throw ErrorFactory.createGeminiError(error);
    }
  }

  /**
   * 健康检查 - 验证API密钥是否有效
   */
  async healthCheck(): Promise<boolean> {
    // 根据模式进行健康检查
    if (this.mode === "local" && this.localService) {
      return await this.localService.healthCheck();
    }

    if (this.mode === "mock") {
      return true;
    }

    if (!this.ai) {
      return false;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "test",
        config: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return !!response.text;
    } catch (error) {
      logger.error("Gemini健康检查失败", error as Error);
      return false;
    }
  }
}
