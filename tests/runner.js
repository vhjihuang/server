// 测试运行器
// 统一执行所有测试套件

const { runUnitTests } = require('./unit.test');
const { runIntegrationTests } = require('./integration.test');

/**
 * 主测试运行器
 */
async function runAllTests() {
  console.log("=".repeat(60));
  console.log("开始运行完整测试套件");
  console.log("=".repeat(60));
  console.log();

  try {
    // 1. 运行单元测试
    console.log("第一阶段: 单元测试");
    console.log("-".repeat(40));
    runUnitTests();
    console.log();

    // 2. 运行原有的API测试
    console.log("第二阶段: API模块测试");
    console.log("-".repeat(40));
    const { runTests } = require('./api.test');
    runTests();
    console.log();

    // 3. 运行集成测试（需要启动服务器）
    console.log("第三阶段: 集成测试");
    console.log("-".repeat(40));
    
    // 检查是否有OpenAI API密钥
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key-for-integration-tests') {
      console.log("⚠️  警告: 未检测到有效的OpenAI API密钥");
      console.log("   集成测试将使用模拟响应或可能失败");
      console.log("   要运行完整集成测试，请设置 OPENAI_API_KEY 环境变量");
      console.log();
    }

    await runIntegrationTests();

    // 测试完成总结
    console.log();
    console.log("=".repeat(60));
    console.log("🎉 所有测试套件执行完成！");
    console.log("=".repeat(60));
    console.log();
    console.log("测试覆盖范围:");
    console.log("✅ 单元测试 - 各模块独立功能");
    console.log("✅ API模块测试 - 核心服务逻辑");
    console.log("✅ 集成测试 - 完整API流程");
    console.log("✅ 错误处理测试 - 各种异常场景");
    console.log("✅ 参数验证测试 - 输入验证逻辑");
    console.log("✅ 响应格式测试 - 输出格式验证");
    console.log();

  } catch (error) {
    console.error();
    console.error("❌ 测试套件执行失败:");
    console.error(error.message);
    console.error();
    console.error("请检查错误信息并修复问题后重新运行测试");
    process.exit(1);
  }
}

/**
 * 运行快速测试（仅单元测试和API模块测试）
 */
function runQuickTests() {
  console.log("=".repeat(60));
  console.log("运行快速测试套件（跳过集成测试）");
  console.log("=".repeat(60));
  console.log();

  try {
    // 1. 运行单元测试
    console.log("第一阶段: 单元测试");
    console.log("-".repeat(40));
    runUnitTests();
    console.log();

    // 2. 运行原有的API测试
    console.log("第二阶段: API模块测试");
    console.log("-".repeat(40));
    const { runTests } = require('./api.test');
    runTests();
    console.log();

    console.log("=".repeat(60));
    console.log("🎉 快速测试套件执行完成！");
    console.log("=".repeat(60));

  } catch (error) {
    console.error();
    console.error("❌ 快速测试套件执行失败:");
    console.error(error.message);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'quick') {
  runQuickTests();
} else if (command === 'unit') {
  console.log("运行单元测试...");
  runUnitTests();
} else if (command === 'integration') {
  console.log("运行集成测试...");
  runIntegrationTests().catch(error => {
    console.error("集成测试失败:", error.message);
    process.exit(1);
  });
} else {
  // 默认运行所有测试
  runAllTests();
}

module.exports = {
  runAllTests,
  runQuickTests
};