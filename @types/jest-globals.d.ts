/**
 * Jest全局类型声明
 * 
 * 这个文件专门为Jest测试框架定义全局类型，
 * 使得测试文件中可以直接使用Jest的全局函数而无需导入。
 * 
 * 包含的全局函数：
 * - describe: 定义测试套件
 * - test/it: 定义测试用例
 * - expect: 断言函数
 * - beforeAll/afterAll: 测试生命周期钩子
 * - beforeEach/afterEach: 每个测试的生命周期钩子
 */

/// <reference types="jest" />

declare global {
  // Jest测试套件定义函数
  const describe: jest.Describe;
  
  // Jest测试用例定义函数
  const test: jest.It;
  const it: jest.It;
  
  // Jest断言函数
  const expect: jest.Expect;
  
  // Jest生命周期钩子函数
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
}

// 确保这个文件被视为模块
export {};