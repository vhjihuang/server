/**
 * Mock Gemini API服务 - 用于网络受限环境
 */

import { RequestContext } from "../types/api";
import { logger } from "./logger";

export class MockGeminiService {
  constructor(apiKey?: string) {
    logger.info("使用Mock Gemini服务", { apiKey: apiKey ? "已设置" : "未设置" });
  }

  /**
   * 生成模拟的命名建议
   */
  private generateMockSuggestions(prompt: string): string[] {
    // 解析prompt中的命名类型和风格
    let type = "variable";
    let style = "camelCase";

    if (prompt.includes("function") || prompt.includes("函数")) {
      type = "function";
    } else if (prompt.includes("class") || prompt.includes("类")) {
      type = "class";
    } else if (prompt.includes("boolean") || prompt.includes("布尔")) {
      type = "boolean";
    } else if (prompt.includes("constant") || prompt.includes("常量")) {
      type = "constant";
    }

    if (prompt.includes("snake_case")) {
      style = "snake_case";
    } else if (prompt.includes("PascalCase")) {
      style = "PascalCase";
    } else if (prompt.includes("kebab-case")) {
      style = "kebab-case";
    } else if (prompt.includes("UPPER_SNAKE_CASE")) {
      style = "UPPER_SNAKE_CASE";
    }

    // 根据类型和风格生成相应的建议
    const baseSuggestions = this.getBaseSuggestions(type, prompt);
    return baseSuggestions.map((suggestion) => this.formatByStyle(suggestion, style));
  }

  private getBaseSuggestions(type: string, prompt: string): string[] {
    const description = prompt.toLowerCase();

    if (type === "function") {
      if (description.includes("获取") || description.includes("get")) {
        return ["getUserInfo", "fetchUserData", "retrieveUserDetails", "loadUserProfile", "getUserById"];
      } else if (description.includes("设置") || description.includes("set")) {
        return ["setUserInfo", "updateUserData", "configureUser", "saveUserProfile", "modifyUserDetails"];
      } else {
        return ["processData", "handleRequest", "executeTask", "performAction", "runOperation"];
      }
    } else if (type === "class") {
      if (description.includes("处理") || description.includes("processor")) {
        return ["DataProcessor", "RequestHandler", "TaskManager", "ServiceProvider", "OperationController"];
      } else {
        return ["UserManager", "DataService", "ConfigHandler", "ApiClient", "SystemController"];
      }
    } else if (type === "boolean") {
      return ["isValid", "hasPermission", "canAccess", "isEnabled", "shouldProcess"];
    } else if (type === "constant") {
      return ["MAX_RETRY_COUNT", "DEFAULT_TIMEOUT", "API_VERSION", "CONFIG_PATH", "ERROR_CODES"];
    } else {
      // variable
      if (description.includes("用户") || description.includes("user")) {
        return ["userName", "userInfo", "userData", "userProfile", "userId"];
      } else {
        return ["dataValue", "configOption", "resultSet", "itemList", "statusCode"];
      }
    }
  }

  private formatByStyle(suggestion: string, style: string): string {
    switch (style) {
      case "snake_case":
        return suggestion
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");
      case "PascalCase":
        return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      case "kebab-case":
        return suggestion
          .replace(/([A-Z])/g, "-$1")
          .toLowerCase()
          .replace(/^-/, "");
      case "UPPER_SNAKE_CASE":
        return suggestion
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()
          .replace(/^_/, "");
      default: // camelCase
        return suggestion.charAt(0).toLowerCase() + suggestion.slice(1);
    }
  }

  /**
   * 模拟调用Gemini API生成命名建议
   */
  async generateNaming(prompt: string, context: RequestContext = { requestId: "unknown" }): Promise<string> {
    const startTime = Date.now();

    logger.debug("开始调用Mock Gemini API", {
      promptLength: prompt.length,
      ...context,
    });

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    try {
      // 从prompt中提取信息来生成相关的命名建议
      const suggestions = this.generateMockSuggestions(prompt);
      const response = JSON.stringify(suggestions);

      const duration = Date.now() - startTime;

      logger.info("Mock Gemini API调用成功", {
        duration,
        responseLength: response.length,
        suggestionsCount: suggestions.length,
        ...context,
      });

      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error("Mock Gemini API调用失败", error, {
        duration,
        promptLength: prompt.length,
        ...context,
      });

      // 添加默认返回值以满足 TypeScript 类型检查
      return JSON.stringify([]);
    }
  }

  /**
   * 健康检查 - 模拟版本总是返回true
   */
  async healthCheck(): Promise<boolean> {
    logger.info("Mock Gemini健康检查");
    // 模拟一点延迟
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}
