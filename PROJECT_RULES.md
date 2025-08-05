# 文生图工具项目规则

## 1. 项目概述

文生图工具是一个基于AI的图像生成应用，采用前后端分离架构，提供智能提示词构建和高质量图像生成服务。

### 1.1 技术栈

**前端技术栈：**
- Vue 3 + Composition API
- TypeScript（优先使用JavaScript）
- Vite 构建工具
- Element Plus UI组件库
- Tailwind CSS 样式框架
- Vue Router 路由管理
- Axios HTTP客户端

**后端技术栈：**
- Node.js + Express.js
- ES Modules (type: "module")
- JSON文件数据存储
- CORS跨域支持
- dotenv环境变量管理

**部署技术栈：**
- Docker容器化
- Docker Compose编排
- 静态文件服务

## 2. 项目结构规范

### 2.1 目录结构

```
text-image/
├── .trae/                    # Trae AI配置目录
│   ├── documents/           # 产品文档
│   └── rules/              # 项目规则
├── src/                     # 前端源码
│   ├── components/         # Vue组件
│   ├── pages/              # 页面组件
│   ├── composables/        # 组合式函数
│   ├── router/             # 路由配置
│   └── assets/             # 静态资源
├── server/                  # 后端源码
│   ├── src/                # 服务器代码
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── data/               # 数据文件
│   └── targets/            # 生成图片存储
├── dist/                    # 构建输出
├── public/                  # 公共静态文件
└── data/                    # Docker数据挂载
```

### 2.2 文件命名规范

- **Vue组件**：使用PascalCase，如 `HomePage.vue`
- **JavaScript文件**：使用camelCase，如 `imageUtils.js`
- **路由文件**：使用kebab-case，如 `error-logs`
- **配置文件**：使用小写+点分隔，如 `vite.config.ts`

## 3. 代码规范

### 3.1 JavaScript/TypeScript规范

**基本原则：**
- 优先使用JavaScript，仅在必要时使用TypeScript
- 使用ES2020或更早版本语法
- 使用ES Modules导入导出
- 函数必须添加JSDoc注释

**代码示例：**
```javascript
/**
 * 生成图像的API调用函数
 * @param {string} prompt - 图像生成提示词
 * @param {Object} options - 生成选项
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImage(prompt, options = {}) {
  // 实现代码
}
```

### 3.2 Vue组件规范

**组件结构：**
- 使用 `<script setup>` 语法
- 组件大小控制在300行以内
- 单一职责原则，复杂组件拆分为子组件
- 使用Composition API

**组件示例：**
```vue
<template>
  <div class="component-container">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
/**
 * 组件功能描述
 */
import { ref, computed } from 'vue'

// 组件逻辑
</script>

<style scoped>
/* 组件样式 */
</style>
```

### 3.3 CSS/样式规范

**样式原则：**
- 优先使用Tailwind CSS工具类
- 避免使用 `@apply` 和 `@layer` 指令
- 组件样式使用scoped
- 响应式设计，桌面优先

**设计规范：**
- 主色调：深蓝色(#1890ff)
- 辅助色：浅灰色(#f5f5f5)
- 字体大小：标题16px，正文14px，说明12px
- 布局：卡片式布局，圆角按钮

## 4. 国际化规范

### 4.1 双语支持

**支持语言：**
- 中文（zh）- 默认语言
- 英文（en）

**语言检测：**
- 自动检测系统语言
- 支持手动切换语言
- 语言设置持久化存储

**使用方式：**
```javascript
import { useI18n } from '@/composables/useI18n.js'

const { t, locale, setLocale } = useI18n()

// 使用翻译
const title = t('errorLogs')

// 切换语言
setLocale('en')
```

## 5. API规范

### 5.1 RESTful API设计

**路由规范：**
- 使用 `/api/` 前缀
- 资源名使用复数形式
- HTTP方法语义化使用

**API路由示例：**
```
GET    /api/images          # 获取图像列表
POST   /api/images          # 生成新图像
GET    /api/images/:id      # 获取特定图像
DELETE /api/images/:id      # 删除图像
GET    /api/health          # 健康检查
```

### 5.2 错误处理规范

**统一错误格式：**
```javascript
{
  "error": "错误描述",
  "message": "详细错误信息",
  "code": "ERROR_CODE"
}
```

## 6. 环境配置规范

### 6.1 环境变量管理

**必需环境变量：**
- `SEEDREAM_API_KEY`: Seedream API密钥
- `NODE_ENV`: 运行环境 (development/production)
- `PORT`: 服务器端口 (默认3002)

**配置文件：**
- `.env`: 本地开发环境变量
- `.env.example`: 环境变量模板
- `.gitignore`: 确保 `.env` 被忽略

### 6.2 依赖管理

**包管理器：**
- 统一使用 `pnpm` 进行依赖安装
- 项目仅使用一个 `package.json`
- 定期清理未使用的依赖

**依赖安装示例：**
```bash
pnpm add axios              # 生产依赖
pnpm add -D @types/node     # 开发依赖
```

## 7. 开发流程规范

### 7.1 开发环境启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
npm run dev

# 启动生产服务器
npm run start
```

### 7.2 构建部署流程

```bash
# 前端构建
npm run build

# 代码检查
npm run check

# Docker构建
docker-compose build

# Docker部署
docker-compose up -d
```

### 7.3 代码质量检查

**必须通过的检查：**
- TypeScript类型检查：`npm run check`
- ESLint代码规范：`npm run lint`
- 构建成功：`npm run build`

## 8. 数据存储规范

### 8.1 文件存储结构

**数据文件：**
- `server/data/images.json`: 图像元数据
- `server/data/error_logs.json`: 错误日志
- `server/targets/`: 生成图像文件

**数据格式示例：**
```javascript
// images.json
{
  "id": "unique_id",
  "prompt": "图像提示词",
  "filename": "image_filename.png",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "completed"
}
```

### 8.2 文件命名规范

**图像文件命名：**
- 格式：`image_{timestamp}_{randomId}.png`
- 示例：`image_1754208556893_7f4hyt3jd.png`

## 9. Docker部署规范

### 9.1 容器化配置

**Dockerfile规范：**
- 基础镜像：`node:18`
- 工作目录：`/app`
- 非root用户运行
- 多阶段构建优化

**端口映射：**
- 容器端口：3002
- 宿主机端口：3002

### 9.2 数据持久化

**卷挂载：**
- `./data/targets:/app/server/targets` - 图像文件
- `./data/database:/app/server/data` - 数据库文件

### 9.3 环境变量配置

**Docker环境变量：**
```yaml
environment:
  - NODE_ENV=production
  - PORT=3002
  - SEEDREAM_API_KEY=${SEEDREAM_API_KEY}
```

## 10. 安全规范

### 10.1 API安全

- API密钥通过环境变量管理
- 敏感信息不得硬编码
- 实施CORS策略
- 请求大小限制（10MB）

### 10.2 文件安全

- `.env` 文件加入 `.gitignore`
- 上传文件类型验证
- 文件大小限制
- 定期清理临时文件

## 11. 性能优化规范

### 11.1 前端优化

- 组件懒加载
- 图片压缩和缓存
- 路由级代码分割
- 静态资源CDN

### 11.2 后端优化

- API响应缓存
- 并发请求控制
- 文件流式传输
- 错误日志管理

## 12. 监控和日志规范

### 12.1 健康检查

**健康检查端点：**
- URL: `/api/health`
- 返回格式：
```javascript
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "text-image-api"
}
```

### 12.2 错误日志

**日志级别：**
- ERROR: 系统错误
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

**日志格式：**
```javascript
{
  "level": "ERROR",
  "message": "错误描述",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "stack": "错误堆栈"
}
```

## 13. 版本控制规范

### 13.1 Git规范

**分支策略：**
- `main`: 主分支，生产环境代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

**提交信息格式：**
```
type(scope): description

[optional body]

[optional footer]
```

**提交类型：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 13.2 版本发布

**版本号规范：**
- 遵循语义化版本控制 (SemVer)
- 格式：`MAJOR.MINOR.PATCH`
- 示例：`1.0.0`, `1.1.0`, `1.1.1`

---

**最后更新时间：** 2024年1月
**文档版本：** 1.1.0
**维护者：** 开发团队
**更新内容：** 添加国际化规范，修复CSS问题，完善项目结构