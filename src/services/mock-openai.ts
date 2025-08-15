/**
 * 模拟OpenAI服务 - 用于开发和测试
 */

import { RequestContext } from "../types/api";
import { logger } from "./logger";

export class MockOpenAIService {
  /**
   * 模拟OpenAI API调用，生成命名建议
   */
  async generateNaming(prompt: string, context: RequestContext = { requestId: "unknown" }): Promise<string> {
    const startTime = Date.now();

    logger.debug("开始模拟OpenAI API调用", {
      promptLength: prompt.length,
      ...context,
    });

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    // 根据prompt内容生成相应的模拟响应
    const mockResponse = this.generateMockResponse(prompt, context);

    const duration = Date.now() - startTime;

    logger.info("模拟OpenAI API调用成功", {
      duration,
      responseLength: mockResponse.length,
      tokensUsed: Math.floor(Math.random() * 100) + 50, // 模拟token使用
      ...context,
    });

    return mockResponse;
  }

  /**
   * 根据prompt生成模拟响应
   */
  private generateMockResponse(_prompt: string, context: RequestContext): string {
    const { type, style, description } = context;

    // 根据不同的类型和风格生成相应的命名建议
    const suggestions = this.getMockSuggestions(description || "", type as any, style as any);

    return JSON.stringify(suggestions);
  }

  /**
   * 获取模拟的命名建议
   */
  private getMockSuggestions(description: string, type?: string, style?: string): string[] {
    const baseNames = this.generateBaseNames(description, type);

    if (!style) {
      return baseNames.slice(0, 5);
    }

    return baseNames.map((name) => this.applyNamingStyle(name, style)).slice(0, 5);
  }

  /**
   * 根据描述和类型生成基础命名
   */
  private generateBaseNames(description: string, type?: string): string[] {
    const keywords = this.extractKeywords(description);
    const suggestions: string[] = [];

    // 确保至少有一个关键词
    const firstKeyword = keywords[0] || "item";

    // 根据类型生成不同的命名模式
    switch (type) {
      case "function":
        suggestions.push(`get_${firstKeyword}`, `fetch_${firstKeyword}`, `retrieve_${firstKeyword}`, `load_${firstKeyword}`, `obtain_${firstKeyword}`, `acquire_${firstKeyword}`, `collect_${firstKeyword}`);
        break;

      case "variable":
        suggestions.push(firstKeyword, `${firstKeyword}_data`, `${firstKeyword}_info`, `${firstKeyword}_details`, `${firstKeyword}_record`, `current_${firstKeyword}`, `selected_${firstKeyword}`);
        break;

      case "class":
        suggestions.push(`${firstKeyword}_manager`, `${firstKeyword}_service`, `${firstKeyword}_controller`, `${firstKeyword}_handler`, `${firstKeyword}_processor`, `${firstKeyword}_builder`, `${firstKeyword}_factory`);
        break;

      case "boolean":
        suggestions.push(`is_${firstKeyword}`, `has_${firstKeyword}`, `can_${firstKeyword}`, `should_${firstKeyword}`, `${firstKeyword}_enabled`, `${firstKeyword}_active`, `${firstKeyword}_valid`);
        break;

      case "constant":
        suggestions.push(
          `${firstKeyword.toUpperCase()}_CONFIG`,
          `DEFAULT_${firstKeyword.toUpperCase()}`,
          `MAX_${firstKeyword.toUpperCase()}`,
          `MIN_${firstKeyword.toUpperCase()}`,
          `${firstKeyword.toUpperCase()}_LIMIT`,
          `${firstKeyword.toUpperCase()}_VALUE`,
          `${firstKeyword.toUpperCase()}_SETTING`
        );
        break;

      default:
        suggestions.push(firstKeyword, `${firstKeyword}_item`, `${firstKeyword}_object`, `${firstKeyword}_element`, `${firstKeyword}_component`);
    }

    return suggestions;
  }

  /**
   * 从描述中提取关键词
   */
  private extractKeywords(description: string): string[] {
    // 简单的关键词提取逻辑
    const cleanDesc = description
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, "") // 移除特殊字符
      .replace(/\s+/g, " ") // 合并空格
      .trim();

    // 中文关键词映射
    const chineseToEnglish: Record<string, string> = {
      用户: "user",
      数据: "data",
      信息: "info",
      获取: "get",
      删除: "delete",
      更新: "update",
      创建: "create",
      查询: "query",
      搜索: "search",
      配置: "config",
      设置: "setting",
      管理: "manage",
      处理: "process",
      验证: "validate",
      检查: "check",
      计算: "calculate",
      生成: "generate",
      构建: "build",
      解析: "parse",
      格式化: "format",
      转换: "convert",
    };

    let keywords: string[] = [];

    // 提取中文关键词并转换
    for (const [chinese, english] of Object.entries(chineseToEnglish)) {
      if (cleanDesc.includes(chinese)) {
        keywords.push(english);
      }
    }

    // 提取英文单词
    const englishWords = cleanDesc.match(/[a-zA-Z]+/g) || [];
    keywords.push(...englishWords.map((word) => word.toLowerCase()));

    // 如果没有找到关键词，使用默认值
    if (keywords.length === 0) {
      keywords = ["item", "data", "value"];
    }

    return [...new Set(keywords)]; // 去重
  }

  /**
   * 应用命名风格
   */
  private applyNamingStyle(name: string, style: string): string {
    switch (style) {
      case "camelCase":
        return this.toCamelCase(name);
      case "snake_case":
        return this.toSnakeCase(name);
      case "PascalCase":
        return this.toPascalCase(name);
      case "kebab-case":
        return this.toKebabCase(name);
      case "UPPER_SNAKE_CASE":
        return this.toUpperSnakeCase(name);
      default:
        return name;
    }
  }

  /**
   * 转换为camelCase
   */
  private toCamelCase(str: string): string {
    // 处理包含下划线、连字符或空格的字符串
    const result = str
      .toLowerCase() // 先全部转为小写
      .replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase()); // 分隔符后的字符大写

    // 确保首字母小写
    return result.charAt(0).toLowerCase() + result.slice(1);
  }

  /**
   * 转换为snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, "_$1")
      .replace(/[-\s]+/g, "_")
      .toLowerCase()
      .replace(/^_/, "");
  }

  /**
   * 转换为PascalCase
   */
  private toPascalCase(str: string): string {
    return this.capitalize(this.toCamelCase(str));
  }

  /**
   * 转换为kebab-case
   */
  private toKebabCase(str: string): string {
    return this.toSnakeCase(str).replace(/_/g, "-");
  }

  /**
   * 转换为UPPER_SNAKE_CASE
   */
  private toUpperSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 健康检查 - 模拟版本总是返回健康
   */
  async healthCheck(): Promise<boolean> {
    logger.info("模拟OpenAI健康检查", { status: "healthy" });
    return true;
  }
}
