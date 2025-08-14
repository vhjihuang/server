/**
 * 服务层测试
 */

/// <reference path="../@types/jest-globals.d.ts" />

import { ValidationService } from "../src/services/validator";
import { PromptService } from "../src/services/prompt";
import { ValidationError } from "../src/types/errors";

describe("ValidationService", () => {
  describe("validateGenerateRequest", () => {
    test("should validate correct request", () => {
      const validRequest = {
        description: "get user data",
        type: "function",
        style: "camelCase",
      };

      const result = ValidationService.validateGenerateRequest(validRequest);

      expect(result.description).toBe("get user data");
      expect(result.type).toBe("function");
      expect(result.style).toBe("camelCase");
    });

    test("should throw ValidationError for missing description", () => {
      const invalidRequest = {
        type: "function",
        style: "camelCase",
      };

      expect(() => {
        ValidationService.validateGenerateRequest(invalidRequest);
      }).toThrow(ValidationError);
    });

    test("should throw ValidationError for invalid type", () => {
      const invalidRequest = {
        description: "test",
        type: "invalid_type",
        style: "camelCase",
      };

      expect(() => {
        ValidationService.validateGenerateRequest(invalidRequest);
      }).toThrow(ValidationError);
    });

    test("should throw ValidationError for invalid style", () => {
      const invalidRequest = {
        description: "test",
        type: "function",
        style: "invalid_style",
      };

      expect(() => {
        ValidationService.validateGenerateRequest(invalidRequest);
      }).toThrow(ValidationError);
    });

    test("should throw ValidationError for description too long", () => {
      const invalidRequest = {
        description: "a".repeat(501),
        type: "function",
        style: "camelCase",
      };

      expect(() => {
        ValidationService.validateGenerateRequest(invalidRequest);
      }).toThrow(ValidationError);
    });
  });

  describe("validateOpenAIResponse", () => {
    test("should validate correct JSON array response", () => {
      const validResponse = '["name1", "name2", "name3", "name4", "name5"]';
      const result = ValidationService.validateOpenAIResponse(validResponse);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result).toEqual(["name1", "name2", "name3", "name4", "name5"]);
    });

    test("should throw error for invalid JSON", () => {
      const invalidResponse = "invalid json";

      expect(() => {
        ValidationService.validateOpenAIResponse(invalidResponse);
      }).toThrow("OpenAI API返回的响应不是有效的JSON格式");
    });

    test("should throw error for non-array response", () => {
      const invalidResponse = '{"not": "array"}';

      expect(() => {
        ValidationService.validateOpenAIResponse(invalidResponse);
      }).toThrow("OpenAI API返回的响应不是数组格式");
    });

    test("should throw error for wrong array length", () => {
      const invalidResponse = '["name1", "name2", "name3"]';

      expect(() => {
        ValidationService.validateOpenAIResponse(invalidResponse);
      }).toThrow("期望返回5个命名建议，但实际返回了3个");
    });

    test("should throw error for non-string elements", () => {
      const invalidResponse = '["name1", 123, "name3", "name4", "name5"]';

      expect(() => {
        ValidationService.validateOpenAIResponse(invalidResponse);
      }).toThrow("第2个命名建议不是字符串类型");
    });

    test("should throw error for empty string elements", () => {
      const invalidResponse = '["name1", "", "name3", "name4", "name5"]';

      expect(() => {
        ValidationService.validateOpenAIResponse(invalidResponse);
      }).toThrow("第2个命名建议为空");
    });
  });
});

describe("PromptService", () => {
  describe("buildPrompt", () => {
    test("should build prompt for function with camelCase", () => {
      const prompt = PromptService.buildPrompt("get user data", "function", "camelCase");

      expect(prompt).toContain("get user data");
      expect(prompt).toContain("函数");
      expect(prompt).toContain("camelCase");
      expect(prompt).toContain("getUserData");
      expect(prompt).toContain("JSON数组格式");
    });

    test("should build prompt for variable with snake_case", () => {
      const prompt = PromptService.buildPrompt("user name", "variable", "snake_case");

      expect(prompt).toContain("user name");
      expect(prompt).toContain("变量");
      expect(prompt).toContain("snake_case");
      expect(prompt).toContain("user_name");
    });

    test("should build prompt for class with PascalCase", () => {
      const prompt = PromptService.buildPrompt("user manager", "class", "PascalCase");

      expect(prompt).toContain("user manager");
      expect(prompt).toContain("类");
      expect(prompt).toContain("PascalCase");
      expect(prompt).toContain("UserManager");
    });

    test("should build prompt for boolean with camelCase", () => {
      const prompt = PromptService.buildPrompt("user is active", "boolean", "camelCase");

      expect(prompt).toContain("user is active");
      expect(prompt).toContain("布尔值");
      expect(prompt).toContain("camelCase");
      expect(prompt).toContain("isValid");
    });

    test("should build prompt for constant with UPPER_SNAKE_CASE", () => {
      const prompt = PromptService.buildPrompt("max retry count", "constant", "UPPER_SNAKE_CASE");

      expect(prompt).toContain("max retry count");
      expect(prompt).toContain("常量");
      expect(prompt).toContain("UPPER_SNAKE_CASE");
      expect(prompt).toContain("MAX_RETRIES");
    });

    test("should include all required sections", () => {
      const prompt = PromptService.buildPrompt("test", "function", "camelCase");

      expect(prompt).toContain("描述：");
      expect(prompt).toContain("命名要求：");
      expect(prompt).toContain("命名风格：");
      expect(prompt).toContain("示例格式：");
      expect(prompt).toContain("要求：");
      expect(prompt).toContain('["建议1", "建议2", "建议3", "建议4", "建议5"]');
    });
  });
});
