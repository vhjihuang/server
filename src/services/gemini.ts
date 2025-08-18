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
  private ai: GoogleGenAI;
  private mockService?: MockGeminiService;
  private localService?: SmartNamingService;

  constructor() {
    // 检查使用哪种模式
    this.ai = new GoogleGenAI({})
  }

  /**
   * 调用Gemini API生成命名建议
   */
  async generateNaming(prompt: string, context: RequestContext = { requestId: "unknown" }): Promise<string> {
    

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
      console.log('Gemini api 响应成功:', responseContent)
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
