/**
 * 前端智能命名服务类型定义
 * 完全基于前端开发模式设计
 */

// ========================
// 核心命名类型
// ========================
export type FrontendNamingType =
  | 'component'    // 组件 (React/Vue/Svelte)
  | 'hook'         // Hook (React)
  | 'composable'   // 组合式函数 (Vue)
  | 'store'        // 状态管理 (Pinia/Redux)
  | 'util'         // 工具函数
  | 'type'         // 类型定义
  | 'service'      // 服务层
  | 'directive'    // 指令 (Vue)
  | 'enum'         // 枚举类型
  | 'constant'     // 常量
  | 'page'         // 页面组件
  | 'layout';      // 布局组件

export type NamingStyle =
  | 'camelCase'    // 变量/函数
  | 'PascalCase'   // 组件/类
  | 'kebab-case'   // 文件命名/HTML属性
  | 'CONSTANT_CASE' // 常量
  | 'snake_case'   // 配置文件
  | 'flatcase';    // 扁平小写命名 (例如: MyComponent -> mycomponent)

// ========================
// 框架特定配置
// ========================
export type FrontendFramework = 
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'solid'
  | null; // 无框架

export interface FrameworkConventions {
  componentSuffix?: string[]; // 如["View", "Container"]，改为数组以匹配 dictionaries.ts
  hookPrefix?: string[];      // React默认["use"]，改为数组
  storePattern?: string[];    // 如["use*Store"]，改为数组
  // 可以根据需要添加更多项目级别的命名模式，例如：
  // commonVerbs?: string[]; // 项目中常用的动词
  // commonNouns?: string[]; // 项目中常用的名词
}

// ========================
// 分析结果类型
// ========================
export interface SemanticAnalysisResult {
  /** 原始输入文本 */
  originalText: string;
  
  /** 提取的动作词 (如: fetch, handle, validate) */
  verbs: string[];
  
  /** 提取的实体名词 (如: user, form, list) */
  nouns: string[];
  
  /** 提取的形容词列表 */
  adjectives: string[];
  
  /** 词性标注结果 */
  posTags?: Record<string, string[]>;
  
  /** 命名实体识别结果 */
  namedEntities?: Record<string, string[]>;
  
  /** 语义关系 */
  relationships?: Record<string, string[]>;
  
  /** 框架建议模式 */
  frameworkHints: FrameworkConventions;
  
  /** 语义角色 */
  semanticRoles: Record<string, string[]>;
}

// ========================
// 项目上下文
// ========================
export interface ProjectContext {
  /** 项目根目录 (用于分析现有代码) */
  rootPath?: string;
  
  /** 主要使用框架 */
  framework?: FrontendFramework;
  
  /** 项目中已存在的命名模式 */
  existingPatterns?: {
    components?: string[];
    hooks?: string[];
    stores?: string[];
    // 可以扩展更多类型，例如：
    // utils?: string[];
    // pages?: string[];
  };
}

// ========================
// 生成配置
// ========================
export interface NamingGenerationConfig {
  /** 生成数量 (默认5) */
  count?: number;
  
  /** 是否包含备用建议 */
  includeFallbacks?: boolean;
  
  /** 风格严格模式。 如果为 true，则生成的命名将严格遵守所选风格和框架约定。 */
  strictStyle?: boolean;
  
  /** 自定义转换器 */
  customFormatter?: (name: string, type: FrontendNamingType) => string;

  /** 期望的最终命名风格。如果指定，引擎将尝试将生成结果转换为此风格。 */
  targetStyle?: NamingStyle; 

  /** 如果为 true，则强制生成的命名严格遵守 targetStyle，即使可能牺牲一些语义准确性。 */
  enforceTargetStyle?: boolean; 
}

export interface TextAnalysisOptions {
  stemming?: boolean;
  lowercase?: boolean;
  stopWords?: Set<string>;
}

// ========================
// 服务接口
// ========================
export interface INamingService {
  generateNames(
    description: string,
    type: FrontendNamingType,
    config?: NamingGenerationConfig
  ): Promise<{
    suggestions: string[];
    debugInfo?: {
      analyzedVerbs: string[];
      analyzedNouns: string[];
      usedPatterns: string[];
      appliedStyle: NamingStyle; // 新增类型，用于 debugInfo
    };
  }>;
  
  analyzeProjectConventions(
    context: ProjectContext
  ): Promise<FrameworkConventions>;
}