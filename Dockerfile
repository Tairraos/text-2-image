# 使用官方Node.js运行时作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 复制package.json和pnpm-lock.yaml（如果存在）
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml* ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建前端
RUN pnpm run build

# 创建targets目录
RUN mkdir -p /app/server/targets

# 创建数据目录
RUN mkdir -p /app/server/data

# 暴露端口
EXPOSE 3002

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3002

# 创建非root用户
RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# 更改文件所有权
RUN chown -R nextjs:nodejs /app
USER nextjs

# 启动应用
CMD ["npm", "run", "start"]