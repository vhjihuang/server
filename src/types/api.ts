/**
 * API相关类型定义
 */

// 命名类型枚举
export const NAMING_TYPES = ['function', 'variable', 'class', 'boolean', 'constant', 'component', 'hook', 'state', 'prop', 'file', 'folder', 'enum', 'interface'] as const;
export type NamingType = typeof NAMING_TYPES[number];

// 命名风格枚举
export const NAMING_STYLES = ['camelCase', 'snake_case', 'PascalCase', 'kebab-case', 'UPPER_SNAKE_CASE'] as const;
export type NamingStyle = typeof NAMING_STYLES[number];

// 请求接口
export interface GenerateRequest {
  description: string;
  type: NamingType;
  style: NamingStyle;
}

// 成功响应接口
export interface GenerateResponse {
  success: true;
  data: string[];
  count: number;
  requestId: string;
  timestamp: string;
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: string;
  errorType: string;
  timestamp: string;
  requestId: string;
  details?: string[];
}

// API响应联合类型
export type ApiResponse = GenerateResponse | ErrorResponse;

// 请求上下文接口
export interface RequestContext {
  requestId: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
  description?: string | undefined;
  type?: NamingType | undefined;
  style?: NamingStyle | undefined;
  // 允许任意额外属性
  [key: string]: any;
}

// 项目上下文接口
export interface ProjectContext {
  filePath?: string;
  siblingFiles?: string[];
  moduleName?: string;
  projectType?: string;
  existingNames?: string[];
  techStack?: string[];
}

// 日志上下文接口（更宽松的类型）
export interface LogContext {
  requestId?: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
  description?: string | undefined;
  type?: NamingType | undefined;
  style?: NamingStyle | undefined;
  // 允许任意额外属性
  [key: string]: any;
}

// 类型守卫函数
export function isNamingType(value: any): value is NamingType {
  return NAMING_TYPES.includes(value);
}

export function isNamingStyle(value: any): value is NamingStyle {
  return NAMING_STYLES.includes(value);
}

export function isValidDescription(value: any): value is string {
  return typeof value === 'string' && 
         value.trim().length > 0 && 
         value.length <= 500;
}

export const FRONTEND_NAMING_TYPES = [
  'function',
  'variable',
  'class',
  'component',
  'hook',
  'type',
  'interface',
  'enum'
] as const;

export type FrontendNamingType = typeof FRONTEND_NAMING_TYPES[number];


export interface LocalNamingOptions {
  style: NamingStyle;
  context?: {
    variables?: string[];
    fileType?: 'ts' | 'js' | 'jsx' | 'tsx';
  };
}