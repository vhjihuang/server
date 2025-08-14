// 单元测试文件
// 测试各个模块的独立功能

const assert = require("assert");
const { buildPrompt } = require("../services/promptService");
const { parseAndValidateResponse } = require("../services/responseService");
const { 
  ValidationError, 
  OpenAIError, 
  ResponseParsingError,
  handleOpenAIError,
  handleResponseParsingError,
  handleValidationError,
  generateSafeErrorResponse
} = require("../services/errorService");

/**
 * 单元测试运行器
 */
function runUnitTests() {
  console.log("开始运行单元测试...\n");

  // 测试各个模块
  testPromptService();
  testResponseService();
  testErrorService();
  testNamingRuleValidation();

  console.log("\n所有单元测试通过！");
}

/**
 * 测试Prompt服务
 */
function testPromptService() {
  console.log("测试Prompt服务...");

  // 测试基本功能
  const prompt1 = buildPrompt("获取用户信息", "function", "camelCase");
  assert(prompt1.includes("获取用户信息"), "Prompt应该包含描述");
  assert(prompt1.includes("Function"), "Prompt应该包含类型信息");
  assert(prompt1.includes("camelCase"), "Prompt应该包含样式信息");
  console.log("  ✓ 基本Prompt生成测试通过");

  // 测试不同类型的Prompt生成
  const types = ["function", "variable", "class", "boolean", "constant"];
  types.forEach(type => {
    const prompt = buildPrompt("测试描述", type, "camelCase");
    assert(prompt.includes(type.charAt(0).toUpperCase() + type.slice(1)), 
      `Prompt应该包含${type}类型信息`);
  });
  console.log("  ✓ 不同类型Prompt生成测试通过");

  // 测试不同样式的Prompt生成
  const styles = ["camelCase", "snake_case", "PascalCase", "kebab-case", "UPPER_SNAKE_CASE"];
  styles.forEach(style => {
    const prompt = buildPrompt("测试描述", "function", style);
    assert(prompt.includes(style), `Prompt应该包含${style}样式信息`);
  });
  console.log("  ✓ 不同样式Prompt生成测试通过");

  // 测试特殊字符处理
  const specialDesc = "用户's \"特殊\" 信息 & 数据";
  const prompt2 = buildPrompt(specialDesc, "function", "camelCase");
  assert(prompt2.includes("用户"), "应该正确处理特殊字符");
  console.log("  ✓ 特殊字符处理测试通过");

  console.log("✓ Prompt服务测试通过\n");
}

/**
 * 测试响应服务
 */
function testResponseService() {
  console.log("测试响应服务...");

  // 测试有效响应解析
  const validResponse = '["getUserInfo", "fetchUserData", "retrieveUserDetails", "loadUserProfile", "getUserRecord"]';
  const parsed = parseAndValidateResponse(validResponse);
  assert(Array.isArray(parsed), "解析结果应该是数组");
  assert.strictEqual(parsed.length, 5, "应该返回5个命名建议");
  parsed.forEach((name, index) => {
    assert(typeof name === 'string', `第${index + 1}个建议应该是字符串`);
    assert(name.trim().length > 0, `第${index + 1}个建议不应该为空`);
  });
  console.log("  ✓ 有效响应解析测试通过");

  // 测试各种无效响应
  const invalidCases = [
    { input: null, desc: "null输入" },
    { input: undefined, desc: "undefined输入" },
    { input: "", desc: "空字符串" },
    { input: "   ", desc: "空白字符串" },
    { input: 123, desc: "数字输入" },
    { input: {}, desc: "对象输入" },
    { input: "invalid json", desc: "无效JSON" },
    { input: '{"not": "array"}', desc: "非数组JSON" },
    { input: '["name1", "name2"]', desc: "数组长度不足" },
    { input: '["name1", "name2", "name3", "name4", "name5", "name6"]', desc: "数组长度过多" },
    { input: '[1, 2, 3, 4, 5]', desc: "非字符串元素" },
    { input: '["", "name2", "name3", "name4", "name5"]', desc: "包含空字符串" }
  ];

  invalidCases.forEach(testCase => {
    try {
      parseAndValidateResponse(testCase.input);
      assert(false, `${testCase.desc}应该抛出错误`);
    } catch (error) {
      assert(error instanceof ResponseParsingError, 
        `${testCase.desc}应该抛出ResponseParsingError`);
    }
  });
  console.log("  ✓ 无效响应处理测试通过");

  console.log("✓ 响应服务测试通过\n");
}

/**
 * 测试错误服务
 */
function testErrorService() {
  console.log("测试错误服务...");

  // 测试OpenAI错误处理
  const openaiErrors = [
    { code: 'insufficient_quota', expectedStatus: 402, expectedType: 'QUOTA_ERROR' },
    { code: 'rate_limit_exceeded', expectedStatus: 429, expectedType: 'RATE_LIMIT_ERROR' },
    { code: 'invalid_api_key', expectedStatus: 401, expectedType: 'AUTHENTICATION_ERROR' },
    { name: 'AbortError', expectedStatus: 408, expectedType: 'TIMEOUT_ERROR' },
    { request: {}, expectedStatus: 503, expectedType: 'NETWORK_ERROR' }
  ];

  openaiErrors.forEach(errorCase => {
    const handledError = handleOpenAIError(errorCase);
    assert(handledError instanceof OpenAIError, "应该返回OpenAIError实例");
    assert.strictEqual(handledError.statusCode, errorCase.expectedStatus, 
      `状态码应该为${errorCase.expectedStatus}`);
    assert.strictEqual(handledError.errorType, errorCase.expectedType, 
      `错误类型应该为${errorCase.expectedType}`);
  });
  console.log("  ✓ OpenAI错误处理测试通过");

  // 测试验证错误处理
  const validationErrors = ["字段缺失", "格式错误", "长度超限"];
  const validationError = handleValidationError(validationErrors);
  assert(validationError instanceof ValidationError, "应该返回ValidationError实例");
  assert.strictEqual(validationError.statusCode, 400, "验证错误状态码应该为400");
  assert.deepStrictEqual(validationError.details, validationErrors, "应该包含错误详情");
  console.log("  ✓ 验证错误处理测试通过");

  // 测试响应解析错误处理
  const parseError = new Error("JSON解析失败");
  const responseError = handleResponseParsingError(parseError, "invalid json");
  assert(responseError instanceof ResponseParsingError, "应该返回ResponseParsingError实例");
  assert.strictEqual(responseError.statusCode, 502, "解析错误状态码应该为502");
  console.log("  ✓ 响应解析错误处理测试通过");

  // 测试安全响应生成
  const mockReq = { headers: { 'x-request-id': 'test-123' } };
  
  // 测试应用错误的安全响应
  const appError = new ValidationError("验证失败", ["字段错误"]);
  const safeResponse = generateSafeErrorResponse(appError, mockReq);
  assert.strictEqual(safeResponse.success, false, "响应应该标记为失败");
  assert.strictEqual(safeResponse.requestId, 'test-123', "应该包含请求ID");
  assert.strictEqual(safeResponse.error, "验证失败", "应该包含错误消息");
  console.log("  ✓ 安全响应生成测试通过");

  console.log("✓ 错误服务测试通过\n");
}

/**
 * 测试命名规则验证
 */
function testNamingRuleValidation() {
  console.log("测试命名规则验证...");

  // 定义命名规则模式
  const namingPatterns = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    'kebab-case': /^[a-z][a-z0-9-]*$/,
    UPPER_SNAKE_CASE: /^[A-Z][A-Z0-9_]*$/
  };

  // 测试有效命名示例
  const validExamples = {
    camelCase: ["getUserInfo", "calculateTotal", "isActive", "userName"],
    snake_case: ["get_user_info", "calculate_total", "is_active", "user_name"],
    PascalCase: ["GetUserInfo", "CalculateTotal", "IsActive", "UserName"],
    'kebab-case': ["get-user-info", "calculate-total", "is-active", "user-name"],
    UPPER_SNAKE_CASE: ["GET_USER_INFO", "CALCULATE_TOTAL", "IS_ACTIVE", "USER_NAME"]
  };

  Object.entries(validExamples).forEach(([style, examples]) => {
    const pattern = namingPatterns[style];
    examples.forEach(example => {
      assert(pattern.test(example), 
        `"${example}" 应该符合 ${style} 命名规则`);
    });
  });
  console.log("  ✓ 有效命名规则验证测试通过");

  // 测试无效命名示例
  const invalidExamples = {
    camelCase: ["GetUserInfo", "get_user_info", "get-user-info", "GET_USER_INFO", "123invalid"],
    snake_case: ["getUserInfo", "GetUserInfo", "get-user-info", "GET_USER_INFO", "123invalid"],
    PascalCase: ["getUserInfo", "get_user_info", "get-user-info", "GET_USER_INFO", "123Invalid"],
    'kebab-case': ["getUserInfo", "get_user_info", "GetUserInfo", "GET_USER_INFO", "123invalid"],
    UPPER_SNAKE_CASE: ["getUserInfo", "get_user_info", "GetUserInfo", "get-user-info", "123INVALID"]
  };

  Object.entries(invalidExamples).forEach(([style, examples]) => {
    const pattern = namingPatterns[style];
    examples.forEach(example => {
      assert(!pattern.test(example), 
        `"${example}" 不应该符合 ${style} 命名规则`);
    });
  });
  console.log("  ✓ 无效命名规则验证测试通过");

  console.log("✓ 命名规则验证测试通过\n");
}

// 如果直接运行此文件，则执行单元测试
if (require.main === module) {
  try {
    runUnitTests();
  } catch (error) {
    console.error("单元测试失败:", error.message);
    process.exit(1);
  }
}

module.exports = {
  runUnitTests
};