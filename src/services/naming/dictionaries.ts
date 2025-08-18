/**
 * 前端智能命名专用词典
 * 包含React/Vue/Svelte等框架的命名约定
 */

// ========================
// 通用停用词表 (中英文+前端特定)
// ========================
export const FRONTEND_STOP_WORDS = new Set([
  // 中文停用词
  '的', '是', '在', '和', '或', '了', '我', '这', '那', '个',
  
  // 英文停用词
  'a', 'an', 'the', 'and', 'or', 'is', 'in', 'on', 'at', 'with',
  
  // 前端开发停用词
  'component', 'function', 'variable', 'props', 'state', 
  'type', 'interface', 'return', 'const', 'let', 'var',
  'import', 'export', 'default', 'from'
]);

// ========================
// 前端动作词映射 (中英对照+框架特定)
// ========================
export const FRONTEND_ACTION_MAP: Record<string, string[]> = {
  // 通用CRUD
  '获取|取得|fetch|get': ['get', 'fetch', 'load', 'retrieve'],
  '提交|保存|submit|save': ['submit', 'save', 'store', 'persist'],
  
  // React专用
  '处理|handle': ['handle', 'on'], // handleClick, onSubmit
  '使用|use': ['use'], // useState, useEffect
  
  // Vue专用
  '计算|computed': ['computed', 'use'], // computedProp, useStore
  '监听|watch': ['watch', 'on'], // watchEffect, onMounted
  
  // 状态管理
  '更新|update': ['update', 'set', 'mutate'], // setState, updateStore
  '重置|reset': ['reset', 'clear'] // resetForm, clearCache
};

// ========================
// 前端实体词映射 (中英对照+组件类型)
// ========================
export const FRONTEND_ENTITY_MAP: Record<string, string[]> = {
  // 通用UI元素
  '按钮|button': ['button', 'btn'],
  '表单|form': ['form', 'input'],
  '列表|list': ['list', 'table', 'grid'],
  
  // 组件类型
  '页面|page': ['page', 'view', 'screen'],
  '弹窗|modal': ['modal', 'dialog', 'popup'],
  '卡片|card': ['card', 'panel', 'tile'],
  
  // 状态相关
  '状态|state': ['state', 'status', 'data'],
  '配置|config': ['config', 'settings', 'options']
};

// ========================
// 框架推荐约定 (按框架分类)
// 修改了名称以匹配 idnex.ts 中的导入
// ========================
export const FRAMEWORK_CONVENTIONS = {
  react: {
    component: ['', 'View', 'Container', 'Component'],
    hook: ['use'], // hook 通常只有前缀，后缀概念不强
    store: ['Store', 'Reducer', 'Context']
  },
  vue: {
    component: ['', 'View', 'Container', 'Component'],
    composable: ['use', 'Composable', 'Util', 'Helper'], // composable 也可以有 use 前缀
    store: ['Store', 'Service', 'Repository']
  },
  svelte: {
    component: ['', 'View', 'Container'],
    store: ['Store', 'Service']
  }
} as const; // 使用 as const 确保类型推断为只读字面量类型

// ========================
// 文件名转换规则
// ========================
/**
 * 安全的文件名格式转换工具
 */
export const FILENAME_CONVENTIONS = {
  /**
   * 转换为kebab-case (例: "MyComponent" → "my-component")
   * @param name 输入名称
   * @returns 转换后的kebab-case字符串
   */
  kebab: (name: string): string => {
    if (!name) return ''
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  },

  /**
   * 转换为PascalCase (例: "my-component" → "MyComponent")
   * @param name 输入名称
   * @returns 转换后的PascalCase字符串
   */
  pascal: (name: string): string => {
    if (!name) return ''
    return name
      .split(/[-\s_]/)
      .filter(Boolean) // 过滤空字符串
      .map(s => s[0]?.toUpperCase() + s.slice(1).toLowerCase())
      .join('')
  },

  /**
   * 转换为snake_case (例: "myComponent" → "my_component")
   */
  snake: (name: string): string => {
    if (!name) return ''
    return name
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
  },

  /**
   * 转换为camelCase (小驼峰命名) (例: "My Component" → "myComponent")
   * @param name 输入名称
   * @returns 转换后的camelCase字符串
   */
  camel: (name: string): string => { // <-- 新增 camel 方法
    if (!name) return '';
    const pascal = FILENAME_CONVENTIONS.pascal(name);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  },

  /**
   * 转换为flatcase (扁平小写命名，移除所有非字母数字字符) (例: "My Component" → "mycomponent")
   * @param name 输入名称
   * @returns 转换后的flatcase字符串
   */
  flatcase: (name: string): string => { // <-- 新增 flatcase 方法
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
} as const // 使用 as const 确保类型推断为只读字面量类型

// ========================
// 常用前缀组合 (保持不变)
// ========================
export const COMMON_PREFIXES = [
  'is', 'has', 'can', 'should', 
  'on', 'handle', 'trigger',
  'format', 'parse', 'validate'
];

// ========================
// 智能后缀推荐表 (保持不变)
// ========================
export const SMART_SUFFIXES = [
  'Data', 'Model', 'Entity',
  'View', 'Layout', 'Wrapper',
  'Manager', 'Controller', 'Adapter'
];