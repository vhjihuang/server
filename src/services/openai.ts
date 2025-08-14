/**
 * OpenAI API服务
 */

import OpenAI from 'openai';
import { ErrorFactory } from '../types/errors';
import { RequestContext } from '../types/api';
import { logger } from './logger';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * 调用OpenAI API生成命名建议
   */
  async generateNaming(prompt: string, context: RequestContext = { requestId: 'unknown' }): Promise<string> {
    const startTime = Date.now();

    logger.debug('开始调用OpenAI API', {
      promptLength: prompt.length,
      ...context
    });

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }, {
        timeout: 30000 // 30秒超时
      });

      const duration = Date.now() - startTime;
      const responseContent = response.choices[0]?.message?.content?.trim() || '';

      logger.info('OpenAI API调用成功', {
        duration,
        responseLength: responseContent.length,
        tokensUsed: response.usage?.total_tokens,
        ...context
      });

      return responseContent;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.logOpenAIError(error, {
        duration,
        promptLength: prompt.length,
        ...context
      });

      throw ErrorFactory.createOpenAIError(error);
    }
  }

  /**
   * 健康检查 - 验证API密钥是否有效
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      logger.error('OpenAI健康检查失败', error as Error);
      return false;
    }
  }
}