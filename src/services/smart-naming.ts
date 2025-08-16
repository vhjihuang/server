/**
 * 增强版智能命名服务 - 内置语义分析（优化版）
 */

import nlp from 'compromise';
import natural from 'natural';
import * as fs from 'fs/promises';
import path from 'path';
import { NamingType, NamingStyle, RequestContext } from "../types/api"; // 假设这些类型已定义
import { logger } from "./logger"; // 假设 logger 已定义
import {
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  startCase, // 用于 PascalCase
  sortBy,    // 用于排序 Map 转换后的数组
  take       // 用于取前N个元素
} from 'lodash'; // 导入 Lodash 函数

// ========================
// 辅助工具类和常量
// ========================

// 可配置的停用词
const STOP_WORDS = new Set([
  '的', '是', '在', '有', '和', '或',
  '函数', '方法', '变量', '类', '布尔', '常量',
  'a', 'an', 'the', 'and', 'or', 'is', 'in', 'on', 'at', 'with', 'for' // 增加英文停用词
]);

// 常见的动作词映射，可扩展
const ACTION_WORD_MAP: Record<string, string[]> = {
  '获取|取得|拿到|得到|取': ['get', 'fetch', 'retrieve'],
  '设置|配置|更新|修改': ['set', 'update', 'configure'],
  '创建|新建|建立': ['create', 'new', 'build'],
  '删除|移除|清除': ['delete', 'remove', 'clear'],
  '计算|统计': ['calculate', 'compute'],
  '校验|验证': ['validate', 'check'],
  '处理|操作': ['handle', 'process'],
};

// 常见的实体词映射，可扩展
const ENTITY_WORD_MAP: Record<string, string[]> = {
  '用户|客户|会员': ['user', 'customer', 'member'],
  '数据|信息': ['data', 'info', 'details'],
  '配置|设置': ['config', 'settings', 'options'],
  '文件|文档': ['file', 'document', 'doc'],
  '列表|数组': ['list', 'array'],
  '项|元素': ['item', 'element'],
};

/**
 * 字符串工具类 - 使用 Lodash 优化
 */
class StringUtils {
  static capitalize(str: string): string {
    if (!str) return '';
    return capitalize(str);
  }

  static toCamelCase(name: string): string {
    if (!name) return '';
    return camelCase(name);
  }

  static toPascalCase(name: string): string {
    if (!name) return '';
    // 先转 camelCase，再用 startCase 转换并移除空格，得到 PascalCase
    return startCase(camelCase(name)).replace(/\s/g, '');
  }

  static toSnakeCase(name: string): string {
    if (!name) return '';
    return snakeCase(name);
  }

  static toKebabCase(name: string): string {
    if (!name) return '';
    return kebabCase(name);
  }
}

// ========================
// 语义分析模块
// ========================

interface SemanticAnalysisResult {
  verbs: string[];
  nouns: string[];
}

class SemanticAnalyzer {
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * 对文本进行语义分析，提取动词和名词
   * @param text 待分析文本
   * @returns 包含动词和名词的 SemanticAnalysisResult
   */
  analyze(text: string): SemanticAnalysisResult {
    const doc = nlp(text);

    // 1. 使用 compromise 提取词性
    const compromiseVerbs = doc.verbs().out('array') as string[];
    const compromiseNouns = doc.nouns().out('array') as string[];

    // 2. 使用 natural.WordTokenizer 分词并过滤停用词
    const naturalTokens = this.tokenizer.tokenize(text) || [];
    const filteredTokens = naturalTokens.filter(t =>
      t.length > 1 && !STOP_WORDS.has(t.toLowerCase())
    );

    // 3. 基于预定义模式提取动作词
    const extractedActionWords = this.extractWordsByPatterns(text, ACTION_WORD_MAP);

    // 4. 基于预定义模式提取实体词
    const extractedEntities = this.extractWordsByPatterns(text, ENTITY_WORD_MAP);

    return {
      verbs: [...new Set([...compromiseVerbs, ...extractedActionWords])],
      nouns: [...new Set([...compromiseNouns, ...filteredTokens, ...extractedEntities])],
    };
  }

  /**
   * 辅助方法：根据模式从文本中提取词语
   */
  private extractWordsByPatterns(text: string, patterns: Record<string, string[]>): string[] {
    const words = new Set<string>();
    const lowerText = text.toLowerCase();
    for (const pattern in patterns) {
      // 检查是否是对象自身的属性，而不是原型链上的
      if (Object.prototype.hasOwnProperty.call(patterns, pattern)) {
        // 使用 RegExp 构造函数，支持动态字符串作为模式
        const regex = new RegExp(pattern, 'i'); // 不区分大小写
        if (regex.test(lowerText)) {
          const patternValues = patterns[pattern];
          // 确保 patternValues 是一个数组，以安全地调用 forEach
          if (Array.isArray(patternValues)) {
            patternValues.forEach(w => words.add(w));
          } else {
            logger.warn(`patterns[${pattern}] 的值不是数组，已跳过。`, { value: patternValues });
          }
        }
      }
    }
    return Array.from(words);
  }
}

// ========================
// 项目代码分析模块
// ========================

interface ProjectCodeAnalysisResult {
  projectVerbs: Map<string, number>;
  projectNouns: Map<string, number>;
}

class ProjectCodeAnalyzer {
  private fileExtensions = ['.ts', '.js', '.tsx', '.jsx']; // 支持更多前端文件类型

  /**
   * 分析项目代码，提取常用动词和名词
   * @param projectRoot 项目根目录
   * @returns 包含项目常用动词和名词的 ProjectCodeAnalysisResult
   */
  async analyze(projectRoot: string): Promise<ProjectCodeAnalysisResult> {
    const projectVerbs = new Map<string, number>();
    const projectNouns = new Map<string, number>();

    try {
      const files = await fs.readdir(projectRoot, { withFileTypes: true }); // 使用 withFileTypes 优化
      for (const dirent of files) {
        if (dirent.isFile() && this.fileExtensions.includes(path.extname(dirent.name))) {
          const filePath = path.join(projectRoot, dirent.name);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            this.extractCodePatterns(content, projectVerbs, projectNouns);
          } catch (fileError: any) {
            logger.warn(`读取或分析文件失败: ${filePath}`, { error: fileError.message });
          }
        }
      }
    } catch (dirError: any) {
      logger.error('读取项目目录失败，无法进行代码分析', dirError, { projectRoot });
    }
    return { projectVerbs, projectNouns };
  }

  /**
   * 从代码内容中提取函数名和变量名模式
   */
  private extractCodePatterns(
    code: string,
    projectVerbs: Map<string, number>,
    projectNouns: Map<string, number>
  ): void {
    // 捕获函数声明和表达式：function name() {...}, const name = function() {...}, const name = () => {...}
    const functionNameRegex = /(?:function\s+([a-zA-Z_]\w*)|(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:function|\()|(?:class\s+([a-zA-Z_]\w*)))/g;
    let match;
    while ((match = functionNameRegex.exec(code)) !== null) {
      const name = match[1] || match[2] || match[3]; // 捕获组可能在不同位置
      if (name) {
        // 尝试从函数名中提取动词 (例如: `getUserData` -> `get`)
        const verbMatch = name.match(/^([a-z]+[A-Z]?)/); // 匹配开头的单词直到第一个大写字母或末尾
        if (verbMatch && verbMatch[1]) {
          const verb = verbMatch[1].toLowerCase();
          projectVerbs.set(verb, (projectVerbs.get(verb) || 0) + 1);
        }
      }
    }

    // 捕获变量名 (更精确地排除函数/类声明)
    const variableNameRegex = /\b(?:const|let|var)\s+([a-zA-Z_]\w*)(?!\s*=\s*(?:function|\(|\{|class))/g;
    while ((match = variableNameRegex.exec(code)) !== null) {
      const name = match[1];
      if (name) {
        // 将驼峰命名转换为以空格分隔的小写单词 (例如: `userName` -> `user name`)
        // 注意：这里没有使用 Lodash 的 camelCase，因为我们要的是 `user name` 这种格式，
        // 而非 `userName`，所以保持原有的正则替换。
        const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
        projectNouns.set(words, (projectNouns.get(words) || 0) + 1);
      }
    }
  }
}

// ========================
// 命名生成引擎
// ========================

class NamingGenerator {
  /**
   * 生成命名建议
   * @param verbs 从提示中提取的动词
   * @param nouns 从提示中提取的名词
   * @param projectVerbs 项目中常见的动词
   * @param projectNouns 项目中常见的名词
   * @param type 期望的命名类型
   * @param style 期望的命名风格
   * @returns 命名建议列表
   */
  generate(
    verbs: string[],
    nouns: string[],
    projectVerbs: Map<string, number>,
    projectNouns: Map<string, number>,
    type: NamingType,
    style: NamingStyle
  ): string[] {
    const suggestions = new Set<string>();

    // 1. 基础动词-名词组合
    verbs.forEach(verb => {
      nouns.forEach(noun => {
        suggestions.add(`${verb}${StringUtils.capitalize(noun)}`);
        // 添加常见后缀
        ['Data', 'Info', 'List', 'Item', 'Id', 'Count', 'Status'].forEach(suffix =>
          suggestions.add(`${verb}${StringUtils.capitalize(noun)}${suffix}`)
        );
      });
    });

    // 2. 基于项目上下文的组合 (优先级较高)
    // 融合项目中最常用的动词和提示中的名词 (使用 Lodash 排序和切片)
    const topProjectVerbs = take(
      sortBy(
        Array.from(projectVerbs.entries()), // 将 Map 转换为 [key, value] 对的数组
        ([_key, count]) => -count // 按 count 降序排序
      ).map(([key]) => key), // 只保留 key
      3 // 取前3个
    );

    topProjectVerbs.forEach(pVerb => {
      nouns.forEach(noun => {
        suggestions.add(`${pVerb}${StringUtils.capitalize(noun)}`);
      });
    });

    // 融合提示中的动词和项目中最常用的名词 (使用 Lodash 排序和切片)
    const topProjectNouns = take(
      sortBy(
        Array.from(projectNouns.entries()),
        ([_key, count]) => -count
      ).map(([key]) => key),
      3
    );

    verbs.forEach(verb => {
      topProjectNouns.forEach(pNoun => {
        suggestions.add(`${verb}${StringUtils.capitalize(pNoun.replace(/\s+/g, ''))}`); // 移除空格再大写
      });
    });


    // 3. 类型特定规则
    switch (type) {
      case 'function':
        nouns.forEach(noun => {
          suggestions.add(`handle${StringUtils.capitalize(noun)}`);
          suggestions.add(`process${StringUtils.capitalize(noun)}`);
          suggestions.add(`do${StringUtils.capitalize(noun)}`);
        });
        break;
      case 'boolean':
        nouns.forEach(noun => {
          suggestions.add(`is${StringUtils.capitalize(noun)}`);
          suggestions.add(`has${StringUtils.capitalize(noun)}`);
          suggestions.add(`can${StringUtils.capitalize(noun)}`);
        });
        break;
      case 'class':
        nouns.forEach(noun => {
          suggestions.add(`${StringUtils.capitalize(noun)}Manager`);
          suggestions.add(`${StringUtils.capitalize(noun)}Service`);
          suggestions.add(`${StringUtils.capitalize(noun)}Config`);
        });
        break;
      case 'constant':
        // 常量通常全大写，这里先生成驼峰再转换
        nouns.forEach(noun => {
          suggestions.add(`${StringUtils.toSnakeCase(`${noun}_CONST`).toUpperCase()}`);
        });
        break;
      default: // variable
        // 变量名通常直接使用名词或名词+修饰
        nouns.forEach(noun => {
          suggestions.add(noun); // 原始名词
          suggestions.add(`${noun}List`);
          suggestions.add(`${noun}Count`);
        });
        break;
    }

    // 4. 应用命名风格并去重、截取
    return Array.from(suggestions)
      .map(name => this.convertToStyle(name, style))
      .filter((name, index, self) => self.indexOf(name) === index) // 再次去重，因为风格转换可能导致重复
      .slice(0, 10); // 返回前10个
  }

  /**
   * 检测命名类型
   */
  private detectNamingType(text: string): NamingType {
    const lowerText = text.toLowerCase();
    if (/function|方法|函数|处理|执行|操作/.test(lowerText)) return 'function';
    if (/class|类|服务|管理器|构造器/.test(lowerText)) return 'class';
    if (/boolean|布尔|是否|开启|启用|状态/.test(lowerText)) return 'boolean';
    if (/constant|常量|枚举|不变/.test(lowerText)) return 'constant';
    return 'variable';
  }

  /**
   * 检测命名风格
   */
  private detectNamingStyle(text: string): NamingStyle {
    const lowerText = text.toLowerCase();
    if (/snake_case|下划线命名/.test(lowerText)) return 'snake_case';
    if (/PascalCase|帕斯卡命名/.test(lowerText)) return 'PascalCase';
    if (/kebab-case|短横线命名/.test(lowerText)) return 'kebab-case';
    // 默认或检测到驼峰
    if (/camelCase|驼峰命名/.test(lowerText) || !/[-_]/.test(text)) return 'camelCase';
    return 'camelCase'; // 默认值
  }

  /**
   * 将名称转换为指定风格
   */
  private convertToStyle(name: string, style: NamingStyle): string {
    switch (style) {
      case 'snake_case':
        return StringUtils.toSnakeCase(name);
      case 'PascalCase':
        return StringUtils.toPascalCase(name);
      case 'kebab-case':
        return StringUtils.toKebabCase(name);
      default: // camelCase
        return StringUtils.toCamelCase(name);
    }
  }
}


// ========================
// SmartNamingService 主类
// ========================

export class SmartNamingService {
  private semanticAnalyzer: SemanticAnalyzer;
  private projectCodeAnalyzer: ProjectCodeAnalyzer;
  private namingGenerator: NamingGenerator;

  private projectVerbs = new Map<string, number>();
  private projectNouns = new Map<string, number>();
  private projectAnalyzed = false;
  private projectRoot: string | undefined;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot;
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.projectCodeAnalyzer = new ProjectCodeAnalyzer();
    this.namingGenerator = new NamingGenerator();
  }

  /**
   * 生成智能命名建议
   * @param prompt 用户输入的命名提示
   * @param context 请求上下文信息
   * @returns 命名建议列表的 JSON 字符串形式
   */
  async generateNaming(
    prompt: string,
    context: RequestContext = { requestId: "unknown" }
  ): Promise<string> { // <--- **重要：将返回类型从 Promise<string[]> 更改为 Promise<string>**
    const startTime = Date.now();
    try {
      // 首次调用或项目根目录改变时分析项目代码
      if (!this.projectAnalyzed && this.projectRoot) {
        logger.info("开始分析项目代码...", { ...context });
        const { projectVerbs, projectNouns } = await this.projectCodeAnalyzer.analyze(this.projectRoot);
        this.projectVerbs = projectVerbs;
        this.projectNouns = projectNouns;
        this.projectAnalyzed = true;
        logger.info("项目代码分析完成", {
          projectVerbsCount: projectVerbs.size,
          projectNounsCount: projectNouns.size,
          ...context
        });
      }

      const { verbs, nouns } = this.semanticAnalyzer.analyze(prompt);
      const detectedNamingType = this.namingGenerator['detectNamingType'](prompt); // 访问私有方法
      const detectedNamingStyle = this.namingGenerator['detectNamingStyle'](prompt); // 访问私有方法

      const suggestions = this.namingGenerator.generate(
        verbs,
        nouns,
        this.projectVerbs,
        this.projectNouns,
        detectedNamingType,
        detectedNamingStyle
      );

      // 将建议列表转换为 JSON 字符串返回
      const responseJson = JSON.stringify(suggestions); // <--- **重要：将 suggestions 转换为 JSON 字符串**

      logger.info("智能命名生成成功", {
        duration: Date.now() - startTime,
        prompt,
        detectedNamingType,
        detectedNamingStyle,
        extractedVerbs: verbs,
        extractedNouns: nouns,
        suggestionsCount: suggestions.length,
        responseJsonLength: responseJson.length, // 记录 JSON 字符串长度
        ...context,
      });

      return responseJson; // 返回 JSON 字符串
    } catch (error: any) {
      logger.error("智能命名生成失败", error, { ...context, prompt });
      // 错误时也返回一个 JSON 字符串，例如一个包含降级建议的空数组或默认数组
      return JSON.stringify(['fallbackName', 'errorName']); // <--- **重要：错误时也返回 JSON 字符串**
    }
  }

  async healthCheck(): Promise<boolean> {
    logger.info("SmartNamingService 健康检查：本地服务始终视为健康");
    return true;
  }
  /**
   * 重置项目代码分析状态，以便下次调用时重新分析
   */
  public resetProjectAnalysis(): void {
    this.projectAnalyzed = false;
    this.projectVerbs.clear();
    this.projectNouns.clear();
  }
}