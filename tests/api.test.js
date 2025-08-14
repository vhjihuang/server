// API测试文件
// 注意：这是一个基本的测试框架，实际项目中建议使用Jest或Mocha等专业测试框架

const assert = require("assert");
const { buildPrompt } = require("../services/promptService");
const { parseAndValidateResponse } = require("../services/responseService");
const { 
  AppError, 
  ValidationError, 
  OpenAIError, 
  ResponseParsingError,
  handleOpenAIError,
  handleResponseParsingError,
  handleValidationError,
  generateSafeErrorResponse
} = require("../services/errorService");

/**
 * 简单的测试运行器
 */
function runTests() {
  console.log("开始运行测试...\n");

  // 测试Prompt生成
  testPromptGeneration();

  // 测试响应解析
  testResponseParsing();
  
  // 测试错误处理
  testErrorHandling();
  
  // 测试错误分类
  testErrorClassification();
  
  // 测试安全响应生成
  testSafeErrorResponse();

  console.log("\n所有测试通过！");
}

/**
 * 测试Prompt生成功能
 */
function testPromptGeneration() {
  console.log("测试Prompt生成功能...");

  // 测试基本功能
  const prompt = buildPrompt("用户数据获取", "function", "camelCase");
  assert(prompt.includes("用户数据获取"), "Prompt应该包含用户描述");
  assert(prompt.includes("Function"), "Prompt应该包含类型规则");
  assert(prompt.includes("camelCase"), "Prompt应该包含风格规则");

  console.log("✓ Prompt生成测试通过");
}

/**
 * 测试响应解析功能
 */
function testResponseParsing() {
  console.log("测试响应解析功能...");

  // 测试有效响应
  const validResponse = '["getUserData", "fetchUserInfo", "retrieveUserDetails", "loadUserProfile", "getUserRecord"]';
  const parsed = parseAndValidateResponse(validResponse);
  assert(Array.isArray(parsed), "解析结果应该是数组");
  assert(parsed.length === 5, "应该返回5个命名建议");

  // 测试无效JSON - 现在应该抛出ResponseParsingError
  try {
    parseAndValidateResponse("invalid json");
    assert(false, "应该抛出JSON解析错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
    assert(error.message.includes("格式错误"), "应该包含格式错误信息");
  }

  // 测试数组长度错误
  try {
    parseAndValidateResponse('["name1", "name2", "name3"]');
    assert(false, "应该抛出数组长度错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
    assert(error.message.includes("不完整"), "应该包含数据不完整信息");
  }

  // 测试null输入
  try {
    parseAndValidateResponse(null);
    assert(false, "应该抛出null输入错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
  }

  // 测试undefined输入
  try {
    parseAndValidateResponse(undefined);
    assert(false, "应该抛出undefined输入错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
  }

  // 测试空字符串输入
  try {
    parseAndValidateResponse("");
    assert(false, "应该抛出空字符串错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
  }

  // 测试非字符串输入
  try {
    parseAndValidateResponse(123);
    assert(false, "应该抛出非字符串输入错误");
  } catch (error) {
    assert(error instanceof ResponseParsingError, "应该是ResponseParsingError类型");
  }

  console.log("✓ 响应解析测试通过");
}

/**
 * 测试错误处理功能
 */
function testErrorHandling() {
  console.log("测试错误处理功能...");
  
  // 测试OpenAI API错误处理
  const quotaError = { code: 'insufficient_quota', message: 'Quota exceeded' };
  const handledQuotaError = handleOpenAIError(quotaError);
  assert(handledQuotaError instanceof OpenAIError, "应该返回OpenAIError实例");
  assert(handledQuotaError.statusCode === 402, "配额错误应该返回402状态码");
  assert(handledQuotaError.message.includes("配额不足"), "应该包含用户友好的错误信息");
  
  const rateLimitError = { code: 'rate_limit_exceeded', message: 'Rate limit exceeded' };
  const handledRateLimitError = handleOpenAIError(rateLimitError);
  assert(handledRateLimitError.statusCode === 429, "频率限制错误应该返回429状态码");
  
  const authError = { code: 'invalid_api_key', message: 'Invalid API key' };
  const handledAuthError = handleOpenAIError(authError);
  assert(handledAuthError.statusCode === 401, "认证错误应该返回401状态码");
  
  const timeoutError = { name: 'AbortError', message: 'Request timeout' };
  const handledTimeoutError = handleOpenAIError(timeoutError);
  assert(handledTimeoutError.statusCode === 408, "超时错误应该返回408状态码");
  
  const networkError = { request: {}, message: 'Network error' };
  const handledNetworkError = handleOpenAIError(networkError);
  assert(handledNetworkError.statusCode === 503, "网络错误应该返回503状态码");
  
  console.log("✓ 错误处理测试通过");
}

/**
 * 测试错误分类功能
 */
function testErrorClassification() {
  console.log("测试错误分类功能...");
  
  // 测试验证错误
  const validationErrors = ["字段缺失", "格式错误"];
  const validationError = handleValidationError(validationErrors);
  assert(validationError instanceof ValidationError, "应该返回ValidationError实例");
  assert(validationError.statusCode === 400, "验证错误应该返回400状态码");
  assert(validationError.details.length === 2, "应该包含验证错误详情");
  
  // 测试响应解析错误
  const parseError = new Error("JSON解析失败");
  const responseError = handleResponseParsingError(parseError, "invalid json");
  assert(responseError instanceof ResponseParsingError, "应该返回ResponseParsingError实例");
  assert(responseError.statusCode === 502, "解析错误应该返回502状态码");
  
  console.log("✓ 错误分类测试通过");
}

/**
 * 测试安全响应生成功能
 */
function testSafeErrorResponse() {
  console.log("测试安全响应生成功能...");
  
  // 模拟请求对象
  const mockReq = {
    headers: { 'x-request-id': 'test-123' }
  };
  
  // 测试应用错误的安全响应
  const appError = new ValidationError("验证失败", ["字段错误"]);
  const safeResponse = generateSafeErrorResponse(appError, mockReq);
  assert(safeResponse.success === false, "响应应该标记为失败");
  assert(safeResponse.requestId === 'test-123', "应该包含请求ID");
  assert(safeResponse.error === "验证失败", "应该包含错误消息");
  assert(safeResponse.details.length === 1, "应该包含验证错误详情");
  
  // 测试未知错误的安全响应（生产环境）
  process.env.NODE_ENV = 'production';
  const unknownError = new Error("数据库连接失败");
  const prodResponse = generateSafeErrorResponse(unknownError, mockReq);
  assert(prodResponse.error === "内部服务器错误，请稍后重试", "生产环境不应泄露敏感错误信息");
  
  // 测试未知错误的安全响应（开发环境）
  process.env.NODE_ENV = 'development';
  const devResponse = generateSafeErrorResponse(unknownError, mockReq);
  assert(devResponse.error === "数据库连接失败", "开发环境应该显示详细错误信息");
  
  console.log("✓ 安全响应生成测试通过");
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  try {
    runTests();
  } catch (error) {
    console.error("测试失败:", error.message);
    process.exit(1);
  }
}

module.exports = {
  runTests,
};
