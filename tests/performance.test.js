// 性能测试文件
// 测试API的性能和并发处理能力

const assert = require("assert");
const { makeRequest } = require('./integration.test');

/**
 * 性能测试运行器
 */
async function runPerformanceTests() {
  console.log("开始运行性能测试...\n");

  try {
    await testResponseTime();
    await testConcurrentRequests();
    await testMemoryUsage();

    console.log("\n所有性能测试完成！");
  } catch (error) {
    console.error("性能测试失败:", error.message);
    throw error;
  }
}

/**
 * 测试响应时间
 */
async function testResponseTime() {
  console.log("测试API响应时间...");

  const testData = {
    description: "获取用户信息",
    type: "function",
    style: "camelCase"
  };

  const iterations = 5;
  const responseTimes = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest('/api/generate', testData);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      responseTimes.push(responseTime);
      
      assert.strictEqual(response.statusCode, 200, "请求应该成功");
      console.log(`  第${i + 1}次请求: ${responseTime}ms`);
      
    } catch (error) {
      console.error(`  第${i + 1}次请求失败:`, error.message);
      throw error;
    }
  }

  // 计算统计信息
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  console.log(`  平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  最快响应时间: ${minResponseTime}ms`);
  console.log(`  最慢响应时间: ${maxResponseTime}ms`);

  // 性能断言（根据实际情况调整阈值）
  assert(avgResponseTime < 10000, "平均响应时间应该小于10秒");
  assert(maxResponseTime < 15000, "最大响应时间应该小于15秒");

  console.log("✓ 响应时间测试通过\n");
}

/**
 * 测试并发请求处理
 */
async function testConcurrentRequests() {
  console.log("测试并发请求处理...");

  const testData = {
    description: "计算总价",
    type: "function",
    style: "camelCase"
  };

  const concurrentCount = 3; // 并发请求数量
  const promises = [];

  console.log(`  发送${concurrentCount}个并发请求...`);

  const startTime = Date.now();

  // 创建并发请求
  for (let i = 0; i < concurrentCount; i++) {
    const promise = makeRequest('/api/generate', {
      ...testData,
      description: `${testData.description} ${i + 1}`
    }).then(response => {
      return {
        index: i + 1,
        statusCode: response.statusCode,
        success: response.body.success,
        dataLength: response.body.data ? response.body.data.length : 0
      };
    });
    
    promises.push(promise);
  }

  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`  所有请求完成时间: ${totalTime}ms`);

    // 验证所有请求都成功
    results.forEach(result => {
      assert.strictEqual(result.statusCode, 200, 
        `请求${result.index}应该返回200状态码`);
      assert.strictEqual(result.success, true, 
        `请求${result.index}应该成功`);
      assert.strictEqual(result.dataLength, 5, 
        `请求${result.index}应该返回5个建议`);
      
      console.log(`    请求${result.index}: 成功`);
    });

    console.log("✓ 并发请求测试通过\n");

  } catch (error) {
    console.error("  并发请求测试失败:", error.message);
    throw error;
  }
}

/**
 * 测试内存使用情况
 */
async function testMemoryUsage() {
  console.log("测试内存使用情况...");

  // 获取初始内存使用情况
  const initialMemory = process.memoryUsage();
  console.log("  初始内存使用:");
  console.log(`    RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

  const testData = {
    description: "处理大量数据",
    type: "function",
    style: "camelCase"
  };

  // 执行多次请求来观察内存变化
  const requestCount = 10;
  console.log(`  执行${requestCount}次请求...`);

  for (let i = 0; i < requestCount; i++) {
    try {
      await makeRequest('/api/generate', {
        ...testData,
        description: `${testData.description} ${i + 1}`
      });
    } catch (error) {
      console.error(`  第${i + 1}次请求失败:`, error.message);
    }
  }

  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }

  // 获取最终内存使用情况
  const finalMemory = process.memoryUsage();
  console.log("  最终内存使用:");
  console.log(`    RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

  // 计算内存增长
  const rssGrowth = (finalMemory.rss - initialMemory.rss) / 1024 / 1024;
  const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

  console.log("  内存变化:");
  console.log(`    RSS增长: ${rssGrowth.toFixed(2)} MB`);
  console.log(`    Heap增长: ${heapGrowth.toFixed(2)} MB`);

  // 内存泄漏检查（根据实际情况调整阈值）
  assert(rssGrowth < 100, "RSS内存增长应该小于100MB");
  assert(heapGrowth < 50, "Heap内存增长应该小于50MB");

  console.log("✓ 内存使用测试通过\n");
}

// 如果直接运行此文件，则执行性能测试
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error("性能测试运行失败:", error);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests
};