/**
 * Jest测试设置文件
 */

// 设置测试环境变量
process.env['NODE_ENV'] = 'test';
process.env['OPENAI_API_KEY'] = 'test-key-for-unit-tests';
process.env['PORT'] = '3002';
process.env['LOG_LEVEL'] = 'error'; // 减少测试时的日志输出

// 全局测试超时
jest.setTimeout(30000);