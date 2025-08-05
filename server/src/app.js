import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 导入路由
import imagesRouter from './routes/images.js';
import errorLogsRouter from './routes/errorLogs.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录和前端构建目录
const projectRoot = path.resolve(__dirname, '../../');
const distDir = path.join(projectRoot, 'dist');

const app = express();
const PORT = process.env.PORT || 3002;

// 确保目标目录存在
const targetsDir = path.join(__dirname, '../targets');
if (!fs.existsSync(targetsDir)) {
  fs.mkdirSync(targetsDir, { recursive: true });
}

// 中间件配置
app.use(cors({
  origin: ['http://localhost:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/targets', express.static(path.join(__dirname, '../targets')));

// 前端静态文件服务（如果dist目录存在）
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// API路由
app.use('/api/images', imagesRouter);
app.use('/api/error-logs', errorLogsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'text-image-api'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// SPA路由处理 - 对于非API请求，返回index.html
app.get('*', (req, res) => {
  // 如果是API请求，返回404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  
  // 如果dist目录存在且包含index.html，返回前端应用
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // 否则返回开发模式提示
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>文生图工具</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>文生图工具服务器</h1>
      <p>服务器运行在: <a href="http://localhost:${PORT}">http://localhost:${PORT}</a></p>
      <p>API健康检查: <a href="/api/health">/api/health</a></p>
      <hr>
      <p>开发模式：请先运行 <code>npm run build</code> 构建前端，然后重启服务器</p>
      <p>或者运行 <code>npm run dev:client</code> 启动前端开发服务器</p>
    </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Targets directory: ${targetsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;