# 智能命名生成API - TypeScript版本

这是命名生成API的TypeScript重写版本，提供更好的类型安全性、更简洁的代码和更好的开发体验。

## 特性

- ✅ **类型安全**: 完整的TypeScript类型定义
- ✅ **简洁代码**: 利用类型系统减少验证代码
- ✅ **开发体验**: 完整的IDE支持和自动补全
- ✅ **API兼容**: 与JavaScript版本完全兼容的API接口
- ✅ **错误处理**: 类型安全的错误处理和响应
- ✅ **日志记录**: 结构化的类型安全日志
- ✅ **测试覆盖**: 包含类型测试的完整测试套件

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- TypeScript >= 5.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的环境变量：

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 类型检查

```bash
npm run type-check
```

## API文档

### 生成命名建议

**POST** `/api/generate`

#### 请求体

```typescript
{
  "description": string,    // 功能描述，最大500字符
  "type": "function" | "variable" | "class" | "boolean" | "constant",
  "style": "camelCase" | "snake_case" | "PascalCase" | "kebab-case" | "UPPER_SNAKE_CASE"
}
```

#### 成功响应

```typescript
{
  "success": true,
  "data": string[],        // 5个命名建议
  "count": number,         // 建议数量
  "requestId": string,     // 请求ID
  "timestamp": string      // ISO时间戳
}
```

#### 错误响应

```typescript
{
  "success": false,
  "error": string,         // 错误消息
  "errorType": string,     // 错误类型
  "timestamp": string,     // ISO时间戳
  "requestId": string,     // 请求ID
  "details"?: string[]     // 验证错误详情（可选）
}
```

### 健康检查

**GET** `/health`

返回服务健康状态和依赖服务状态。

## 项目结构

```
src/
├── types/              # 类型定义
│   ├── api.ts         # API相关类型
│   ├── errors.ts      # 错误类型
│   └── config.ts      # 配置类型
├── services/          # 业务逻辑服务
│   ├── openai.ts      # OpenAI API服务
│   ├── prompt.ts      # Prompt生成服务
│   ├── logger.ts      # 日志服务
│   └── validator.ts   # 验证服务
├── middleware/        # Express中间件
│   ├── validation.ts  # 请求验证
│   └── errorHandler.ts # 错误处理
├── controllers/       # 控制器
│   └── generate.ts    # 生成命名控制器
└── app.ts            # 应用入口
```

## Docker部署

### 构建镜像

```bash
docker build -t naming-api-ts .
```

### 运行容器

```bash
docker run -p 3001:3001 -e OPENAI_API_KEY=your_key naming-api-ts
```

### 使用Docker Compose

```bash
docker-compose up -d
```

## 开发指南

### 添加新的命名类型

1. 在 `src/types/api.ts` 中添加新类型到 `NAMING_TYPES`
2. 在 `src/services/prompt.ts` 中添加对应的规则和示例
3. 更新测试用例

### 添加新的错误类型

1. 在 `src/types/errors.ts` 中添加新的错误类型到 `ErrorType` 枚举
2. 在 `ErrorFactory` 中添加对应的工厂方法
3. 更新错误处理逻辑

### 类型安全最佳实践

- 使用类型守卫进行运行时类型检查
- 利用联合类型和字面量类型提供精确的类型定义
- 使用泛型提高代码复用性
- 启用严格的TypeScript编译选项

## 性能对比

与JavaScript版本相比：

- **代码量减少**: 约40-50%的代码量减少
- **类型安全**: 编译时类型检查，减少运行时错误
- **开发效率**: 更好的IDE支持和自动补全
- **运行时性能**: 编译后性能与JavaScript版本相当

## 许可证

MIT License