/**
 * Prompt生成服务
 */

import { NamingType, NamingStyle } from '../types/api';

export class PromptService {
  /**
   * 构建智能Prompt
   */
  static buildPrompt(description: string, type: NamingType, style: NamingStyle): string {
    const typeRules = this.getTypeRules(type);
    const styleRules = this.getStyleRules(style);
    const examples = this.getExamples(type, style);

    return `你是一个专业的程序员命名助手。请根据以下要求生成5个${typeRules.name}命名建议：

描述：${description}

命名要求：
${typeRules.rules}

命名风格：${styleRules}

示例格式：
${examples}

请严格按照以下JSON数组格式返回5个命名建议，不要包含任何其他文字：
["建议1", "建议2", "建议3", "建议4", "建议5"]

要求：
1. 命名必须符合${style}风格
2. 命名要简洁明了，易于理解
3. 避免使用缩写，除非是广泛认知的缩写
4. 确保命名在编程中是有效的标识符
5. 返回的必须是有效的JSON数组格式`;
  }

  /**
   * 获取类型规则
   */
  private static getTypeRules(type: NamingType): { name: string; rules: string } {
    const typeRulesMap: Record<NamingType, { name: string; rules: string }> = {
      function: {
        name: '函数',
        rules: '- 使用动词开头，描述函数的行为\n- 清楚表达函数的功能和目的\n- 避免使用模糊的词汇'
      },
      variable: {
        name: '变量',
        rules: '- 使用名词，描述变量存储的数据\n- 名称应该清楚表达变量的用途\n- 避免使用单字母变量名'
      },
      class: {
        name: '类',
        rules: '- 使用名词，代表一个实体或概念\n- 名称应该清楚表达类的职责\n- 通常使用单数形式'
      },
      boolean: {
        name: '布尔值',
        rules: '- 使用is/has/can/should等前缀\n- 名称应该清楚表达真/假的含义\n- 避免使用否定形式'
      },
      constant: {
        name: '常量',
        rules: '- 使用名词，描述常量的含义\n- 名称应该清楚表达常量的用途\n- 通常表示配置值或固定值'
      }
    };

    return typeRulesMap[type];
  }

  /**
   * 获取风格规则
   */
  private static getStyleRules(style: NamingStyle): string {
    const styleRulesMap: Record<NamingStyle, string> = {
      camelCase: 'camelCase - 第一个单词小写，后续单词首字母大写，如：getUserInfo',
      snake_case: 'snake_case - 单词之间用下划线连接，全部小写，如：get_user_info',
      PascalCase: 'PascalCase - 每个单词首字母大写，如：GetUserInfo',
      'kebab-case': 'kebab-case - 单词之间用连字符连接，全部小写，如：get-user-info',
      UPPER_SNAKE_CASE: 'UPPER_SNAKE_CASE - 单词之间用下划线连接，全部大写，如：GET_USER_INFO'
    };

    return styleRulesMap[style];
  }

  /**
   * 获取示例
   */
  private static getExamples(type: NamingType, style: NamingStyle): string {
    const exampleMap: Record<NamingType, Record<NamingStyle, string[]>> = {
      function: {
        camelCase: ['getUserData', 'calculateTotal', 'validateInput'],
        snake_case: ['get_user_data', 'calculate_total', 'validate_input'],
        PascalCase: ['GetUserData', 'CalculateTotal', 'ValidateInput'],
        'kebab-case': ['get-user-data', 'calculate-total', 'validate-input'],
        UPPER_SNAKE_CASE: ['GET_USER_DATA', 'CALCULATE_TOTAL', 'VALIDATE_INPUT']
      },
      variable: {
        camelCase: ['userName', 'totalAmount', 'isActive'],
        snake_case: ['user_name', 'total_amount', 'is_active'],
        PascalCase: ['UserName', 'TotalAmount', 'IsActive'],
        'kebab-case': ['user-name', 'total-amount', 'is-active'],
        UPPER_SNAKE_CASE: ['USER_NAME', 'TOTAL_AMOUNT', 'IS_ACTIVE']
      },
      class: {
        camelCase: ['userManager', 'dataProcessor', 'configHandler'],
        snake_case: ['user_manager', 'data_processor', 'config_handler'],
        PascalCase: ['UserManager', 'DataProcessor', 'ConfigHandler'],
        'kebab-case': ['user-manager', 'data-processor', 'config-handler'],
        UPPER_SNAKE_CASE: ['USER_MANAGER', 'DATA_PROCESSOR', 'CONFIG_HANDLER']
      },
      boolean: {
        camelCase: ['isValid', 'hasPermission', 'canEdit'],
        snake_case: ['is_valid', 'has_permission', 'can_edit'],
        PascalCase: ['IsValid', 'HasPermission', 'CanEdit'],
        'kebab-case': ['is-valid', 'has-permission', 'can-edit'],
        UPPER_SNAKE_CASE: ['IS_VALID', 'HAS_PERMISSION', 'CAN_EDIT']
      },
      constant: {
        camelCase: ['maxRetries', 'defaultTimeout', 'apiVersion'],
        snake_case: ['max_retries', 'default_timeout', 'api_version'],
        PascalCase: ['MaxRetries', 'DefaultTimeout', 'ApiVersion'],
        'kebab-case': ['max-retries', 'default-timeout', 'api-version'],
        UPPER_SNAKE_CASE: ['MAX_RETRIES', 'DEFAULT_TIMEOUT', 'API_VERSION']
      }
    };

    const examples = exampleMap[type][style];
    return examples.map(example => `"${example}"`).join(', ');
  }
}