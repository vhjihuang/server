// src/services/prompt/prompt.ts

import { NamingType, NamingStyle, ProjectContext } from '../types/api'; // 引入 ProjectContext

/**
 * Prompt生成服务
 * 负责根据用户请求和项目上下文构建用于LLM的Prompt
 */
export class PromptService {
  /**
   * 构建智能Prompt
   * @param description 描述要命名的功能或实体
   * @param type 期望的命名类型（e.g., component, hook, function）
   * @param style 期望的命名风格（e.g., camelCase, PascalCase）
   * @param projectContext 当前的项目上下文信息
   * @returns 供LLM使用的Prompt字符串
   */
  static buildPrompt(
    description: string,
    type: NamingType,
    style: NamingStyle,
    projectContext: ProjectContext = {} // 默认空对象，如果未提供上下文
  ): string {
    const typeRules = this.getTypeRules(type);
    const styleRules = this.getStyleRules(style);
    const examples = this.getExamples(type, style); // 保持静态示例，简化实现

    // 构建项目上下文部分，如果提供了信息
    const contextSection = this.buildContextSection(projectContext);

    return `你是一个专业的前端开发命名助手。你的任务是根据提供的功能描述、命名类型、命名风格和项目上下文，生成5个高质量、符合编程规范的命名建议。

描述：${description}

${contextSection}
命名要求：
${typeRules.rules}

命名风格：${styleRules}

以下是${typeRules.name}在${styleRules.split(' - ')[0]}风格下的一些命名示例：
${examples}

请严格遵守以下要求并返回JSON数组格式的命名建议，不要包含任何其他文字或解释：
1. 建议数量必须是5个。
2. 命名必须严格符合指定的“命名风格”。
3. 命名要简洁、清晰、语义明确，易于理解和记忆。
4. 避免使用不必要的缩写，除非是行业内普遍接受的（如 'id', 'API'）。
5. 确保命名是有效的编程标识符，不包含特殊字符或关键字。
6. 命名应体现其功能或表示的实体，并符合前端开发惯例。
7. **确保所有生成的命名都没有拼写错误。**
8. 如果无法生成有效命名，请返回 ["InvalidName", "ErrorName"]。

请严格按照以下JSON数组格式返回：
["建议1", "建议2", "建议3", "建议4", "建议5"]`;
  }

  /**
   * 获取类型规则
   * 细化前端特有类型
   */
  private static getTypeRules(type: NamingType): { name: string; rules: string } {
    const typeRulesMap: Record<NamingType, { name: string; rules: string }> = {
      component: {
        name: 'React/Vue 组件',
        rules: '- 使用名词或名词短语，描述组件表示的UI元素或功能\n- 通常以PascalCase命名文件和组件类/函数\n- 确保命名能清晰表达组件的职责和内容'
      },
      hook: {
        name: 'React/Vue Hook',
        rules: '- 必须以 `use` 开头，描述其提供的可复用逻辑或状态\n- 通常遵循camelCase\n- 命名应简洁地概括Hook的功能'
      },
      state: {
        name: '状态变量',
        rules: '- 描述状态所存储的数据或其布尔值含义\n- 布尔状态常用 `is`, `has`, `can` 等前缀\n- 通常遵循camelCase'
      },
      prop: {
        name: '组件属性 (Prop)',
        rules: '- 描述传递给组件的数据或配置\n- 遵循camelCase\n- 布尔属性也常用 `is`, `has` 等前缀'
      },
      function: {
        name: '函数/方法',
        rules: '- 使用动词开头，描述函数的行为或操作\n- 清楚表达函数的功能和目的，例如 `handle`, `get`, `set`, `update`, `render`\n- 避免使用模糊的词汇，通常遵循camelCase'
      },
      variable: {
        name: '普通变量',
        rules: '- 使用名词，描述变量存储的数据\n- 名称应该清楚表达变量的用途\n- 避免使用单字母变量名，通常遵循camelCase'
      },
      class: {
        name: '类',
        rules: '- 使用名词，代表一个实体或概念\n- 名称应该清楚表达类的职责\n- 通常使用单数形式，遵循PascalCase'
      },
      boolean: {
        name: '布尔值',
        rules: '- 使用 `is`, `has`, `can`, `should` 等前缀\n- 名称应该清楚表达真/假的含义\n- 避免使用否定形式，通常遵循camelCase'
      },
      constant: {
        name: '常量',
        rules: '- 使用名词，描述常量的含义\n- 名称应该清楚表达常量的用途\n- 通常表示配置值、枚举值或固定不变的值，常遵循UPPER_SNAKE_CASE'
      },
      enum: {
        name: '枚举',
        rules: '- 使用单数名词或名词短语，描述枚举的类别\n- 通常遵循PascalCase或UPPER_SNAKE_CASE\n- 枚举成员名也应清晰表达其含义'
      },
      interface: {
        name: '接口/类型定义',
        rules: '- 使用名词或名词短语，描述数据结构或契约\n- 通常以 `I` 或 `T` 前缀（可选）或直接使用PascalCase\n- 遵循PascalCase'
      },
      file: {
        name: '文件名',
        rules: '- 根据文件内容和作用命名\n- 组件文件通常与组件名一致（PascalCase），其他工具文件可使用kebab-case或snake_case\n- 避免过长或难以理解的文件名'
      },
      folder: {
        name: '文件夹名',
        rules: '- 使用名词或复数名词，描述文件夹内包含的内容或模块\n- 通常遵循kebab-case或snake_case\n- 反映模块或功能的逻辑划分'
      }
    };

    return typeRulesMap[type] || { name: '未知类型', rules: '- 尝试根据描述生成命名' }; // 提供一个兜底
  }

  /**
   * 获取风格规则
   */
  private static getStyleRules(style: NamingStyle): string {
    const styleRulesMap: Record<NamingStyle, string> = {
      camelCase: 'camelCase - 第一个单词小写，后续单词首字母大写，例如：getUserInfo, newProduct',
      snake_case: 'snake_case - 单词之间用下划线连接，全部小写，例如：get_user_info, new_product',
      PascalCase: 'PascalCase - 每个单词首字母大写，例如：GetUserInfo, NewProduct',
      'kebab-case': 'kebab-case - 单词之间用连字符连接，全部小写，例如：get-user-info, new-product',
      UPPER_SNAKE_CASE: 'UPPER_SNAKE_CASE - 单词之间用下划线连接，全部大写，例如：GET_USER_INFO, NEW_PRODUCT'
    };

    return styleRulesMap[style];
  }

  /**
   * 获取示例
   * 这里保持静态示例，未来可以考虑根据历史数据或更复杂逻辑动态生成
   */
  private static getExamples(type: NamingType, style: NamingStyle): string {
    const exampleMap: Record<NamingType, Record<NamingStyle, string[]>> = {
      component: {
        camelCase: ['userProfile', 'productCard', 'authModal'],
        snake_case: ['user_profile', 'product_card', 'auth_modal'],
        PascalCase: ['UserProfile', 'ProductCard', 'AuthModal'],
        'kebab-case': ['user-profile', 'product-card', 'auth-modal'],
        UPPER_SNAKE_CASE: ['USER_PROFILE', 'PRODUCT_CARD', 'AUTH_MODAL']
      },
      hook: {
        camelCase: ['useAuth', 'useDebounce', 'useFormValidation'],
        snake_case: ['use_auth', 'use_debounce', 'use_form_validation'],
        PascalCase: ['UseAuth', 'UseDebounce', 'UseFormValidation'], // Hook通常还是camelCase，这里只是为了演示所有风格的生成
        'kebab-case': ['use-auth', 'use-debounce', 'use-form-validation'],
        UPPER_SNAKE_CASE: ['USE_AUTH', 'USE_DEBOUNCE', 'USE_FORM_VALIDATION']
      },
      state: {
        camelCase: ['isLoading', 'count', 'formData'],
        snake_case: ['is_loading', 'count_val', 'form_data'],
        PascalCase: ['IsLoading', 'Count', 'FormData'],
        'kebab-case': ['is-loading', 'count', 'form-data'],
        UPPER_SNAKE_CASE: ['IS_LOADING', 'COUNT', 'FORM_DATA']
      },
      prop: {
        camelCase: ['isActive', 'itemCount', 'onSave'],
        snake_case: ['is_active', 'item_count', 'on_save'],
        PascalCase: ['IsActive', 'ItemCount', 'OnSave'],
        'kebab-case': ['is-active', 'item-count', 'on-save'],
        UPPER_SNAKE_CASE: ['IS_ACTIVE', 'ITEM_COUNT', 'ON_SAVE']
      },
      function: {
        camelCase: ['getUserData', 'calculateTotal', 'handleLogin'],
        snake_case: ['get_user_data', 'calculate_total', 'handle_login'],
        PascalCase: ['GetUserData', 'CalculateTotal', 'HandleLogin'],
        'kebab-case': ['get-user-data', 'calculate-total', 'handle-login'],
        UPPER_SNAKE_CASE: ['GET_USER_DATA', 'CALCULATE_TOTAL', 'HANDLE_LOGIN']
      },
      variable: {
        camelCase: ['userName', 'totalAmount', 'selectedId'],
        snake_case: ['user_name', 'total_amount', 'selected_id'],
        PascalCase: ['UserName', 'TotalAmount', 'SelectedId'],
        'kebab-case': ['user-name', 'total-amount', 'selected-id'],
        UPPER_SNAKE_CASE: ['USER_NAME', 'TOTAL_AMOUNT', 'SELECTED_ID']
      },
      class: {
        camelCase: ['userManager', 'dataProcessor', 'authService'],
        snake_case: ['user_manager', 'data_processor', 'auth_service'],
        PascalCase: ['UserManager', 'DataProcessor', 'AuthService'],
        'kebab-case': ['user-manager', 'data-processor', 'auth-service'],
        UPPER_SNAKE_CASE: ['USER_MANAGER', 'DATA_PROCESSOR', 'AUTH_SERVICE']
      },
      boolean: {
        camelCase: ['isValid', 'hasPermission', 'isReady'],
        snake_case: ['is_valid', 'has_permission', 'is_ready'],
        PascalCase: ['IsValid', 'HasPermission', 'IsReady'],
        'kebab-case': ['is-valid', 'has-permission', 'is-ready'],
        UPPER_SNAKE_CASE: ['IS_VALID', 'HAS_PERMISSION', 'IS_READY']
      },
      constant: {
        camelCase: ['maxRetries', 'defaultTimeout', 'API_VERSION'],
        snake_case: ['max_retries', 'default_timeout', 'api_version'],
        PascalCase: ['MaxRetries', 'DefaultTimeout', 'ApiVersion'],
        'kebab-case': ['max-retries', 'default-timeout', 'api-version'],
        UPPER_SNAKE_CASE: ['MAX_RETRIES', 'DEFAULT_TIMEOUT', 'API_VERSION']
      },
      enum: {
        camelCase: ['UserRole', 'OrderStatus'],
        snake_case: ['user_role', 'order_status'],
        PascalCase: ['UserRole', 'OrderStatus'],
        'kebab-case': ['user-role', 'order-status'],
        UPPER_SNAKE_CASE: ['USER_ROLE', 'ORDER_STATUS']
      },
      interface: {
        camelCase: ['UserData', 'ProductInfo', 'IAuthResult'],
        snake_case: ['user_data', 'product_info', 'i_auth_result'],
        PascalCase: ['UserData', 'ProductInfo', 'IAuthResult'],
        'kebab-case': ['user-data', 'product-info', 'i-auth-result'],
        UPPER_SNAKE_CASE: ['USER_DATA', 'PRODUCT_INFO', 'I_AUTH_RESULT']
      },
      file: {
        camelCase: ['index', 'authService', 'productCard'],
        snake_case: ['index', 'auth_service', 'product_card'],
        PascalCase: ['Index', 'AuthService', 'ProductCard'],
        'kebab-case': ['index', 'auth-service', 'product-card'],
        UPPER_SNAKE_CASE: ['INDEX', 'AUTH_SERVICE', 'PRODUCT_CARD']
      },
      folder: {
        camelCase: ['components', 'utils', 'auth'],
        snake_case: ['components', 'utils', 'auth'],
        PascalCase: ['Components', 'Utils', 'Auth'],
        'kebab-case': ['components', 'utils', 'auth'],
        UPPER_SNAKE_CASE: ['COMPONENTS', 'UTILS', 'AUTH']
      }
    };

    const examples = exampleMap[type]?.[style] || []; // 使用可选链操作符
    return examples.map(example => `"${example}"`).join(', ') || '无可用示例。';
  }

  /**
   * 构建项目上下文部分
   */
  private static buildContextSection(context: ProjectContext): string {
    const parts: string[] = [];

    if (context.filePath) {
      parts.push(`- 当前文件路径：${context.filePath}`);
    }
    if (context.siblingFiles && context.siblingFiles.length > 0) {
      parts.push(`- 同级文件：${context.siblingFiles.join(', ')}`);
    }
    if (context.moduleName) {
      parts.push(`- 所属模块：${context.moduleName}`);
    }
    if (context.projectType) {
        parts.push(`- 项目类型：${context.projectType}`);
    }
    if (context.existingNames && context.existingNames.length > 0) {
        parts.push(`- 项目中已存在的类似命名：${context.existingNames.join(', ')}`);
    }
    if (context.techStack && context.techStack.length > 0) {
        parts.push(`- 相关技术栈：${context.techStack.join(', ')}`);
    }

    if (parts.length > 0) {
      return `项目上下文信息（供参考）：\n${parts.join('\n')}\n`;
    }
    return '';
  }
}