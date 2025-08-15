/**
 * 错误类型定义
 */

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  RESPONSE_PARSING_ERROR = 'RESPONSE_PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_ERROR = 'QUOTA_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// 自定义应用错误类
export class AppError extends Error {
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorType: ErrorType,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(message: string, public readonly details: string[] = []) {
    super(message, 400, ErrorType.VALIDATION_ERROR);
  }
}

// OpenAI API错误类
export class OpenAIError extends AppError {
  constructor(
    message: string, 
    statusCode: number,
    errorType: ErrorType,
    public readonly originalError?: any
  ) {
    super(message, statusCode, errorType);
  }
}

// 响应解析错误类
export class ResponseParsingError extends AppError {
  constructor(message: string, public readonly rawResponse: string = '') {
    super(message, 502, ErrorType.RESPONSE_PARSING_ERROR);
  }
}

// 错误工厂函数
export class ErrorFactory {
  static createOpenAIError(error: any): OpenAIError {
    let message = 'OpenAI API调用失败';
    let statusCode = 500;
    let errorType = ErrorType.OPENAI_API_ERROR;

    if (error.code === 'insufficient_quota') {
      message = 'API配额不足，请稍后重试或联系管理员';
      statusCode = 402;
      errorType = ErrorType.QUOTA_ERROR;
    } else if (error.code === 'rate_limit_exceeded') {
      message = '请求频率过高，请稍后重试';
      statusCode = 429;
      errorType = ErrorType.RATE_LIMIT_ERROR;
    } else if (error.code === 'invalid_api_key') {
      message = '服务配置错误，请联系管理员';
      statusCode = 401;
      errorType = ErrorType.AUTHENTICATION_ERROR;
    } else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
      statusCode = 408;
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.request && !error.response) {
      message = '网络连接错误，请检查网络连接后重试';
      statusCode = 503;
      errorType = ErrorType.NETWORK_ERROR;
    }

    return new OpenAIError(message, statusCode, errorType, error);
  }

  static createGeminiError(error: any): AppError {
    let message = 'Gemini API调用失败';
    let statusCode = 500;
    let errorType = ErrorType.GEMINI_API_ERROR;

    if (error.status === 429) {
      message = 'API请求频率限制，请稍后重试';
      statusCode = 429;
      errorType = ErrorType.RATE_LIMIT_ERROR;
    } else if (error.status === 403) {
      message = 'API密钥无效或权限不足';
      statusCode = 403;
      errorType = ErrorType.AUTHENTICATION_ERROR;
    } else if (error.status === 402) {
      message = 'API配额不足，请稍后重试或联系管理员';
      statusCode = 402;
      errorType = ErrorType.QUOTA_ERROR;
    } else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
      statusCode = 408;
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = '网络连接错误，请检查网络连接后重试';
      statusCode = 503;
      errorType = ErrorType.NETWORK_ERROR;
    }

    return new AppError(message, statusCode, errorType);
  }

  static createResponseParsingError(error: Error, rawResponse: string = ''): ResponseParsingError {
    let message = '响应解析失败，请稍后重试';

    if (error.message.includes('JSON格式')) {
      message = '服务返回格式错误，请稍后重试';
    } else if (error.message.includes('数组格式')) {
      message = '服务返回数据格式错误，请稍后重试';
    } else if (error.message.includes('期望返回5个')) {
      message = '服务返回数据不完整，请稍后重试';
    }

    return new ResponseParsingError(message, rawResponse);
  }

  static createValidationError(errors: string[]): ValidationError {
    return new ValidationError('请求参数验证失败', errors);
  }
}

// 类型守卫
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: any): boolean {
  return isAppError(error) && error.isOperational;
}