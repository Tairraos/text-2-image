# 文生图工具 (Text-to-Image Tool)

基于AI的图像生成应用，允许用户通过构建精确的文本提示词来生成高质量图像。

## 🚀 功能特性

- **智能提示词构建**：支持提示词模板和变量系统，使用 `${keyName}` 语法引用变量
- **灵活变量系统**：支持文本格式（用|分隔）和JSON格式的变量输入
- **批量图像生成**：支持单图生成、批量生成和停止控制，可设置并发数量
- **实时预览**：提供最终提示词预览，显示变量队列和生成队列状态
- **历史记录管理**：完整的生成历史记录，支持搜索和筛选
- **图像操作**：下载、分享、删除、用作模板等功能
- **响应式设计**：支持桌面和移动端访问

## 🛠️ 技术栈

- **前端**：Vue 3 + TypeScript + Vite + Tailwind CSS
- **后端**：Node.js + Express + SQLite
- **UI组件**：Element Plus + Lucide Icons

## 📦 安装和运行

### 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd text-image
```

2. 安装依赖
```bash
npm install
# 或
pnpm install
```

3. 启动开发服务器
```bash
npm run dev
```

服务器将在 http://localhost:3002 启动

### 生产部署

1. 构建前端
```bash
npm run build
```

2. 启动生产服务器
```bash
npm run start
```

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

1. 启动服务
```bash
docker-compose up -d
```

2. 访问应用
- 应用地址：http://localhost:3002
- 生成的图像将保存在 `./data/targets` 目录中

3. 停止服务
```bash
docker-compose down
```

### 使用 Docker

1. 构建镜像
```bash
docker build -t text-image .
```

2. 运行容器
```bash
docker run -d \
  --name text-image-app \
  -p 3002:3002 \
  -v $(pwd)/data/targets:/app/server/targets \
  text-image
```

### 数据持久化

生成的图像文件存储在 `server/targets` 目录中。在Docker部署时，该目录会被映射到宿主机，确保数据持久化。

## 📁 项目结构

```
text-image/
├── src/                    # 前端源码
│   ├── components/         # Vue组件
│   ├── pages/             # 页面组件
│   ├── router/            # 路由配置
│   └── ...
├── server/                # 后端源码
│   ├── src/               # 服务器代码
│   │   ├── routes/        # API路由
│   │   ├── models/        # 数据模型
│   │   └── app.js         # 主应用文件
│   └── targets/           # 生成的图像文件
├── dist/                  # 前端构建输出
├── docker-compose.yml     # Docker Compose配置
├── Dockerfile            # Docker镜像配置
└── package.json          # 项目配置
```

## 🔧 开发命令

```bash
# 开发模式
npm run dev              # 启动开发服务器

# 构建
npm run build            # 构建前端
npm run check            # 类型检查

# 生产
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码问题
```

## 📝 API 接口

- `GET /api/health` - 健康检查
- `GET /api/images` - 获取图像列表
- `POST /api/images/generate` - 生成图像
- `DELETE /api/images/:id` - 删除图像
- `GET /api/error-logs` - 获取错误日志
- `DELETE /api/error-logs` - 清空错误日志

## 🎯 使用说明

### 提示词模板

在提示词模板中使用 `${变量名}` 语法来定义变量占位符：

```
一只 ${color} 的 ${animal} 在 ${location}
```

### 模板变量

支持两种格式输入变量值：

**文本格式（用|分隔）：**
```
红色|猫|花园
蓝色|狗|公园
```

**JSON格式：**
```json
[
  {"color": "红色", "animal": "猫", "location": "花园"},
  {"color": "蓝色", "animal": "狗", "location": "公园"}
]
```

### 生成控制

- **生成单图**：生成第一行变量对应的图像，生成后自动消费该行数据
- **批量生成**：按顺序生成所有变量组合的图像，支持设置并发数量
- **停止**：停止当前批量生成任务

### 提示词状态

实时显示：
- 变量队列数：待处理的变量组合数量
- 生成队列数：正在生成中的任务数量

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
