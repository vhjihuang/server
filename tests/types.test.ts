/**
 * 类型定义测试
 */

/// <reference path="../@types/jest-globals.d.ts" />

import { GenerateRequest, GenerateResponse, isNamingType, isNamingStyle, isValidDescription } from "../src/types/api";

import { ErrorType, AppError, ValidationError, OpenAIError, ResponseParsingError, isAppError, isOperationalError } from "../src/types/errors";
describe("API Types", () => {
  describe("Type Guards", () => {
    test("isNamingType should validate naming types correctly", () => {
      expect(isNamingType("function")).toBe(true);
      expect(isNamingType("variable")).toBe(true);
      expect(isNamingType("class")).toBe(true);
      expect(isNamingType("boolean")).toBe(true);
      expect(isNamingType("constant")).toBe(true);
      expect(isNamingType("invalid")).toBe(false);
      expect(isNamingType(123)).toBe(false);
      expect(isNamingType(null)).toBe(false);
    });

    test("isNamingStyle should validate naming styles correctly", () => {
      expect(isNamingStyle("camelCase")).toBe(true);
      expect(isNamingStyle("snake_case")).toBe(true);
      expect(isNamingStyle("PascalCase")).toBe(true);
      expect(isNamingStyle("kebab-case")).toBe(true);
      expect(isNamingStyle("UPPER_SNAKE_CASE")).toBe(true);
      expect(isNamingStyle("invalid")).toBe(false);
      expect(isNamingStyle(123)).toBe(false);
    });

    test("isValidDescription should validate descriptions correctly", () => {
      expect(isValidDescription("valid description")).toBe(true);
      expect(isValidDescription("a")).toBe(true);
      expect(isValidDescription("a".repeat(500))).toBe(true);
      expect(isValidDescription("")).toBe(false);
      expect(isValidDescription("   ")).toBe(false);
      expect(isValidDescription("a".repeat(501))).toBe(false);
      expect(isValidDescription(123)).toBe(false);
      expect(isValidDescription(null)).toBe(false);
    });
  });

  describe("Interface Compliance", () => {
    test("GenerateRequest should have correct structure", () => {
      const request: GenerateRequest = {
        description: "test description",
        type: "function",
        style: "camelCase",
      };

      expect(typeof request.description).toBe("string");
      expect(isNamingType(request.type)).toBe(true);
      expect(isNamingStyle(request.style)).toBe(true);
    });

    test("GenerateResponse should have correct structure", () => {
      const response: GenerateResponse = {
        success: true,
        data: ["name1", "name2", "name3", "name4", "name5"],
        count: 5,
        requestId: "test-123",
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(5);
      expect(typeof response.requestId).toBe("string");
      expect(typeof response.timestamp).toBe("string");
    });
  });
});

describe("Error Types", () => {
  describe("Error Classes", () => {
    test("AppError should have correct properties", () => {
      const error = new AppError("test message", 400, ErrorType.VALIDATION_ERROR);

      expect(error.message).toBe("test message");
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(error instanceof Error).toBe(true);
    });

    test("ValidationError should extend AppError correctly", () => {
      const details = ["field1 is required", "field2 is invalid"];
      const error = new ValidationError("validation failed", details);

      expect(error instanceof AppError).toBe(true);
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.details).toEqual(details);
    });

    test("OpenAIError should extend AppError correctly", () => {
      const originalError = new Error("API error");
      const error = new OpenAIError("OpenAI failed", 500, ErrorType.OPENAI_API_ERROR, originalError);

      expect(error instanceof AppError).toBe(true);
      expect(error.statusCode).toBe(500);
      expect(error.errorType).toBe(ErrorType.OPENAI_API_ERROR);
      expect(error.originalError).toBe(originalError);
    });

    test("ResponseParsingError should extend AppError correctly", () => {
      const rawResponse = "invalid json";
      const error = new ResponseParsingError("parsing failed", rawResponse);

      expect(error instanceof AppError).toBe(true);
      expect(error.statusCode).toBe(502);
      expect(error.errorType).toBe(ErrorType.RESPONSE_PARSING_ERROR);
      expect(error.rawResponse).toBe(rawResponse);
    });
  });

  describe("Error Type Guards", () => {
    test("isAppError should identify AppError instances", () => {
      const appError = new AppError("test", 400, ErrorType.VALIDATION_ERROR);
      const standardError = new Error("test");

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(standardError)).toBe(false);
      expect(isAppError("not an error")).toBe(false);
    });

    test("isOperationalError should identify operational errors", () => {
      const operationalError = new AppError("test", 400, ErrorType.VALIDATION_ERROR, true);
      const programError = new AppError("test", 500, ErrorType.INTERNAL_ERROR, false);
      const standardError = new Error("test");

      expect(isOperationalError(operationalError)).toBe(true);
      expect(isOperationalError(programError)).toBe(false);
      expect(isOperationalError(standardError)).toBe(false);
    });
  });
});
