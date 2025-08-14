// API集成测试文件
// 测试完整的API流程，包括不同参数组合和错误场景

const assert = require("assert");
const http = require("http");

// 测试配置
const TEST_PORT = 3002; // 使用不同的端口避免冲突
const BASE_URL = `http://localhost:${TEST_PORT}`;

/**
 * 发送HTTP POST请求的辅助函数
 * @param {string} path - 请求路径
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} - 响应对象
 */
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-request-id': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`JSON解析失败: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 启动测试服务器
 * @returns {Promise<Object>} - 服务器实例
 */
function startTestServer() {
  return new Promise((resolve, reject) => {
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.PORT = TEST_PORT;
    
    // 确保有OpenAI API密钥（可以是测试密钥）
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = 'test-key-for-integration-tests';
    }

    // 动态导入服务器模块
    delete require.cache[require.resolve('../index.js')];
    const app = require('../index.js');
    
    // 等待服务器启动
    setTimeout(() => {
      resolve(app);
    }, 1000);
  });
}

/**
 * 主测试运行器
 */
async function runIntegrationTests() {
  console.log("开始运行API集成测试...\n");

  let server;
  
  try {
    // 启动测试服务器
    console.log("启动测试服务器...");
    server = await startTestServer();
    console.log("✓ 测试服务器启动成功\n");

    // 运行各种测试
    await testValidParameterCombinations();
    await testErrorHandlingScenarios();
    await testResponseValidation();
    await testCompleteAPIFlow();

    console.log("\n所有集成测试通过！");
    
  } catch (error) {
    console.error("集成测试失败:", error.message);
    process.exit(1);
  } finally {
    // 清理：关闭服务器
    if (server) {
      console.log("\n关闭测试服务器...");
      process.exit(0);
    }
  }
}

/**
 * 测试不同参数组合
 */
async function testValidParameterCombinations() {
  console.log("测试不同参数组合...");

  const testCases = [
    {
      name: "函数命名 - camelCase",
      data: {
        description: "获取用户信息",
        type: "function",
        style: "camelCase"
      }
    },
    {
      name: "变量命名 - snake_case",
      data: {
        description: "用户年龄",
        type: "variable",
        style: "snake_case"
      }
    },
    {
      name: "类命名 - PascalCase",
      data: {
        description: "用户管理器",
        type: "class",
        style: "PascalCase"
      }
    },
    {
      name: "布尔值命名 - camelCase",
      data: {
        description: "用户是否激活",
        type: "boolean",
        style: "camelCase"
      }
    },
    {
      name: "常量命名 - UPPER_SNAKE_CASE",
      data: {
        description: "最大重试次数",
        type: "constant",
        style: "UPPER_SNAKE_CASE"
      }
    },
    {
      name: "kebab-case样式",
      data: {
        description: "用户配置",
        type: "variable",
        style: "kebab-case"
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`  测试: ${testCase.name}`);
      
      const response = await makeRequest('/api/generate', testCase.data);
      
      // 验证响应状态码
      assert.strictEqual(response.statusCode, 200, `${testCase.name}: 应该返回200状态码`);
      
      // 验证响应结构
      assert.strictEqual(response.body.success, true, `${testCase.name}: success应该为true`);
      assert(Array.isArray(response.body.data), `${testCase.name}: data应该是数组`);
      assert.strictEqual(response.body.data.length, 5, `${testCase.name}: 应该返回5个命名建议`);
      assert.strictEqual(response.body.count, 5, `${testCase.name}: count应该为5`);
      assert(response.body.requestId, `${testCase.name}: 应该包含requestId`);
      
      // 验证每个命名建议都是字符串且不为空
      response.body.data.forEach((name, index) => {
        assert(typeof name === 'string', `${testCase.name}: 第${index + 1}个建议应该是字符串`);
        assert(name.trim().length > 0, `${testCase.name}: 第${index + 1}个建议不应该为空`);
      });
      
      console.log(`    ✓ ${testCase.name} 测试通过`);
      console.log(`    建议: ${response.body.data.join(', ')}`);
      
    } catch (error) {
      console.error(`    ✗ ${testCase.name} 测试失败:`, error.message);
      throw error;
    }
  }
  
  console.log("✓ 参数组合测试通过\n");
}

/**
 * 测试错误处理场景
 */
async function testErrorHandlingScenarios() {
  console.log("测试错误处理场景...");

  const errorTestCases = [
    {
      name: "缺少description字段",
      data: {
        type: "function",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "缺少type字段",
      data: {
        description: "获取用户信息",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "缺少style字段",
      data: {
        description: "获取用户信息",
        type: "function"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "无效的type值",
      data: {
        description: "获取用户信息",
        type: "invalid_type",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "无效的style值",
      data: {
        description: "获取用户信息",
        type: "function",
        style: "invalid_style"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "description过长",
      data: {
        description: "a".repeat(501), // 超过500字符限制
        type: "function",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "description为空字符串",
      data: {
        description: "",
        type: "function",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    },
    {
      name: "description为非字符串类型",
      data: {
        description: 123,
        type: "function",
        style: "camelCase"
      },
      expectedStatus: 400,
      expectedErrorType: "VALIDATION_ERROR"
    }
  ];

  for (const testCase of errorTestCases) {
    try {
      console.log(`  测试: ${testCase.name}`);
      
      const response = await makeRequest('/api/generate', testCase.data);
      
      // 验证错误响应状态码
      assert.strictEqual(response.statusCode, testCase.expectedStatus, 
        `${testCase.name}: 应该返回${testCase.expectedStatus}状态码`);
      
      // 验证错误响应结构
      assert.strictEqual(response.body.success, false, `${testCase.name}: success应该为false`);
      assert(response.body.error, `${testCase.name}: 应该包含error字段`);
      assert(response.body.timestamp, `${testCase.name}: 应该包含timestamp字段`);
      assert(response.body.requestId, `${testCase.name}: 应该包含requestId字段`);
      
      if (testCase.expectedErrorType) {
        assert.strictEqual(response.body.errorType, testCase.expectedErrorType, 
          `${testCase.name}: errorType应该为${testCase.expectedErrorType}`);
      }
      
      console.log(`    ✓ ${testCase.name} 测试通过`);
      
    } catch (error) {
      console.error(`    ✗ ${testCase.name} 测试失败:`, error.message);
      throw error;
    }
  }
  
  console.log("✓ 错误处理测试通过\n");
}

/**
 * 测试响应验证
 */
async function testResponseValidation() {
  console.log("测试响应验证...");

  const testData = {
    description: "计算总价",
    type: "function",
    style: "camelCase"
  };

  try {
    const response = await makeRequest('/api/generate', testData);
    
    // 验证响应时间戳格式
    const timestamp = new Date(response.body.timestamp);
    assert(!isNaN(timestamp.getTime()), "timestamp应该是有效的ISO日期格式");
    
    // 验证响应时间合理性（应该在最近几秒内）
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
    assert(timeDiff < 10000, "响应时间戳应该在10秒内");
    
    // 验证requestId格式
    assert(typeof response.body.requestId === 'string', "requestId应该是字符串");
    assert(response.body.requestId.length > 0, "requestId不应该为空");
    
    console.log("✓ 响应验证测试通过\n");
    
  } catch (error) {
    console.error("✗ 响应验证测试失败:", error.message);
    throw error;
  }
}

/**
 * 测试完整的API流程
 */
async function testCompleteAPIFlow() {
  console.log("测试完整API流程...");

  const testScenarios = [
    {
      name: "中文描述 - 函数命名",
      description: "删除用户账户",
      type: "function",
      style: "camelCase",
      expectedPatterns: [/^[a-z][a-zA-Z0-9]*$/] // camelCase模式
    },
    {
      name: "英文描述 - 类命名",
      description: "user manager class",
      type: "class",
      style: "PascalCase",
      expectedPatterns: [/^[A-Z][a-zA-Z0-9]*$/] // PascalCase模式
    },
    {
      name: "混合描述 - 常量命名",
      description: "API base URL配置",
      type: "constant",
      style: "UPPER_SNAKE_CASE",
      expectedPatterns: [/^[A-Z][A-Z0-9_]*$/] // UPPER_SNAKE_CASE模式
    }
  ];

  for (const scenario of testScenarios) {
    try {
      console.log(`  测试场景: ${scenario.name}`);
      
      const response = await makeRequest('/api/generate', {
        description: scenario.description,
        type: scenario.type,
        style: scenario.style
      });
      
      assert.strictEqual(response.statusCode, 200, "应该返回成功状态码");
      assert.strictEqual(response.body.success, true, "应该返回成功响应");
      
      // 验证命名建议符合指定的命名规则
      response.body.data.forEach((name, index) => {
        const matchesPattern = scenario.expectedPatterns.some(pattern => pattern.test(name));
        assert(matchesPattern, 
          `第${index + 1}个建议 "${name}" 应该符合${scenario.style}命名规则`);
      });
      
      console.log(`    ✓ ${scenario.name} 流程测试通过`);
      console.log(`    生成的命名: ${response.body.data.join(', ')}`);
      
    } catch (error) {
      console.error(`    ✗ ${scenario.name} 流程测试失败:`, error.message);
      throw error;
    }
  }
  
  console.log("✓ 完整API流程测试通过\n");
}

// 如果直接运行此文件，则执行集成测试
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error("集成测试运行失败:", error);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  makeRequest,
  startTestServer
};