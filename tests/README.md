# 测试文档

本目录包含了命名生成API的完整测试套件，涵盖单元测试、集成测试和性能测试。

## 测试文件结构

```
tests/
├── README.md              # 测试文档（本文件）
├── runner.js              # 测试运行器
├── unit.test.js           # 单元测试
├── api.test.js            # API模块测试
├── integration.test.js    # 集成测试
└── performance.test.js    # 性能测试
```

## 测试类型

### 1. 单元测试 (unit.test.js)
测试各个模块的独立功能：
- **Prompt服务测试**: 验证不同类型和样式的prompt生成
- **响应服务测试**: 验证OpenAI响应的解析和验证逻辑
- **错误服务测试**: 验证错误分类和处理逻辑
- **命名规则验证**: 验证各种命名约定的正则表达式

### 2. API模块测试 (api.test.js)
测试核心服务模块：
- Prompt生成功能
- 响应解析功能
- 错误处理功能
- 错误分类功能
- 安全响应生成功能

### 3. 集成测试 (integration.test.js)
测试完整的API流程：
- **参数组合测试**: 测试不同type和style的组合
- **错误场景测试**: 测试各种无效输入的处理
- **响应验证测试**: 验证响应格式和时间戳
- **完整流程测试**: 验证端到端的API调用

### 4. 性能测试 (performance.test.js)
测试API的性能表现：
- **响应时间测试**: 测量API响应时间
- **并发请求测试**: 测试并发处理能力
- **内存使用测试**: 监控内存使用情况

## 运行测试

### 运行所有测试
```bash
node tests/runner.js
```

### 运行快速测试（跳过集成测试）
```bash
node tests/runner.js quick
```

### 运行特定测试类型
```bash
# 仅运行单元测试
node tests/runner.js unit

# 仅运行集成测试
node tests/runner.js integration

# 仅运行单个测试文件
node tests/unit.test.js
node tests/api.test.js
```

### 运行性能测试
```bash
node tests/performance.test.js
```

## 测试覆盖范围

### 功能测试覆盖
- ✅ 参数验证逻辑
- ✅ Prompt生成算法
- ✅ OpenAI API调用处理
- ✅ 响应解析和验证
- ✅ 错误分类和处理
- ✅ 日志记录功能
- ✅ 安全响应生成

### 错误场景覆盖
- ✅ 缺失必需参数
- ✅ 无效参数类型
- ✅ 无效参数值
- ✅ 参数长度超限
- ✅ OpenAI API各种错误
- ✅ 网络连接错误
- ✅ 响应解析错误
- ✅ 超时处理

### 命名规则验证
- ✅ camelCase: `getUserInfo`, `calculateTotal`
- ✅ snake_case: `get_user_info`, `calculate_total`
- ✅ PascalCase: `GetUserInfo`, `CalculateTotal`
- ✅ kebab-case: `get-user-info`, `calculate-total`
- ✅ UPPER_SNAKE_CASE: `GET_USER_INFO`, `CALCULATE_TOTAL`

## 测试数据

### 有效测试用例
```javascript
// 函数命名
{
  description: "获取用户信息",
  type: "function",
  style: "camelCase"
}

// 类命名
{
  description: "用户管理器",
  type: "class",
  style: "PascalCase"
}

// 常量命名
{
  description: "最大重试次数",
  type: "constant",
  style: "UPPER_SNAKE_CASE"
}
```

### 错误测试用例
```javascript
// 缺失字段
{ type: "function", style: "camelCase" }

// 无效类型
{ description: "test", type: "invalid", style: "camelCase" }

// 参数过长
{ description: "a".repeat(501), type: "function", style: "camelCase" }
```

## 环境要求

### 单元测试和API模块测试
- Node.js 环境
- 无需外部依赖

### 集成测试
- Node.js 环境
- 可用的端口 (默认3002)
- OpenAI API密钥 (可选，用于完整测试)

### 性能测试
- Node.js 环境
- 足够的系统资源
- 稳定的网络连接

## 测试配置

### 环境变量
- `NODE_ENV`: 设置为 'test' 用于测试环境
- `OPENAI_API_KEY`: OpenAI API密钥 (集成测试需要)
- `PORT`: 测试服务器端口 (默认3002)

### 测试超时
- 单元测试: 无超时限制
- 集成测试: 每个请求30秒超时
- 性能测试: 根据测试类型调整

## 故障排除

### 常见问题

1. **集成测试失败 - 端口被占用**
   ```
   解决方案: 修改 TEST_PORT 常量或关闭占用端口的进程
   ```

2. **OpenAI API调用失败**
   ```
   解决方案: 检查 OPENAI_API_KEY 环境变量是否正确设置
   ```

3. **内存测试失败**
   ```
   解决方案: 使用 --expose-gc 标志运行 Node.js 以启用垃圾回收
   node --expose-gc tests/performance.test.js
   ```

### 调试技巧

1. **启用详细日志**
   ```bash
   NODE_ENV=development node tests/runner.js
   ```

2. **单独运行失败的测试**
   ```bash
   node tests/unit.test.js
   ```

3. **检查测试覆盖率**
   ```bash
   # 如果安装了 nyc
   npx nyc node tests/runner.js
   ```

## 持续集成

建议在CI/CD流程中运行以下测试序列：

1. **快速验证**: `node tests/runner.js quick`
2. **完整测试**: `node tests/runner.js` (如果有API密钥)
3. **性能基准**: `node tests/performance.test.js` (可选)

## 测试维护

### 添加新测试
1. 在相应的测试文件中添加测试用例
2. 更新本文档的覆盖范围说明
3. 运行完整测试套件验证

### 更新测试数据
1. 修改测试用例中的数据
2. 确保测试断言仍然有效
3. 验证边界条件处理

### 性能基准更新
1. 根据硬件和网络条件调整性能阈值
2. 定期运行性能测试建立基准
3. 监控性能回归