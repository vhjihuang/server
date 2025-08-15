/**
 * 类型安全的验证服务
 */

import { GenerateRequest, NamingType, NamingStyle } from '../types/api';
import { AppError, ErrorType } from '../types/errors';

export class ValidationService {
  /**
   * 验证生成请求参数
   */
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

  /**
   * 验证环境变量
   */
  static validateEnvironment(): void {
    const errors: string[] = [];

    const port = process.env['PORT'];
    if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
      errors.push('PORT 必须是1-65535之间的数字');
    }

    if (errors.length > 0) {
      throw new AppError(`环境变量验证失败: ${errors.join(', ')}`, 500, ErrorType.INTERNAL_ERROR);
    }
  }

  /**
   * 验证AI响应格式（支持Gemini和OpenAI）
   */
  static validateAIResponse(response: string): string[] {
    if (!response || typeof response !== 'string') {
      throw new AppError('AI API返回的响应无效', 502, ErrorType.RESPONSE_PARSING_ERROR);
    }

    if (response.trim().length === 0) {
      throw new AppError('AI API返回的响应为空', 502, ErrorType.RESPONSE_PARSING_ERROR);
    }

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      throw new AppError('AI API返回的响应不是有效的JSON格式', 502, ErrorType.RESPONSE_PARSING_ERROR);
    }

    if (!Array.isArray(parsedResponse)) {
      throw new AppError('AI API返回的响应不是数组格式', 502, ErrorType.RESPONSE_PARSING_ERROR);
    }

    if (parsedResponse.length !== 5) {
      throw new AppError(`期望返回5个命名建议，但实际返回了${parsedResponse.length}个`, 502, ErrorType.RESPONSE_PARSING_ERROR);
    }

    // 验证每个元素都是非空字符串
    for (let i = 0; i < parsedResponse.length; i++) {
      if (typeof parsedResponse[i] !== 'string') {
        throw new AppError(`第${i + 1}个命名建议不是字符串类型`, 502, ErrorType.RESPONSE_PARSING_ERROR);
      }
      
      if (parsedResponse[i].trim().length === 0) {
        throw new AppError(`第${i + 1}个命名建议为空`, 502, ErrorType.RESPONSE_PARSING_ERROR);
      }
    }

    // 返回清理后的数组
    return parsedResponse.map((name: string) => name.trim());
  }
}