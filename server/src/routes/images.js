import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertImage, getAllImages, getImageById, deleteImage, searchImages, insertErrorLog } from '../models/database.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// seedream-3.0 API配置
const API_BASE_URL = 'https://www.dmxapi.cn';
const API_KEY = process.env.SEEDREAM_API_KEY || '';
const API_ENDPOINT = '/v1/images/generations';
const MODEL_NAME = 'seedream-3.0';
const IMAGE_SIZE = '1664x936';

// 检查API_KEY是否配置
if (!API_KEY) {
  console.error('错误: 未配置SEEDREAM_API_KEY环境变量');
  console.error('请在环境变量中设置SEEDREAM_API_KEY，或在.env文件中配置');
}

// 生成队列和并发控制
const generationQueue = [];
const activeGenerations = new Set();
const MAX_CONCURRENT = 3;

// 处理队列
async function processQueue() {
  if (activeGenerations.size >= MAX_CONCURRENT || generationQueue.length === 0) {
    return;
  }

  const task = generationQueue.shift();
  activeGenerations.add(task.id);

  try {
    await generateSingleImage(task);
  } catch (error) {
    console.error('Queue processing error:', error);
  } finally {
    activeGenerations.delete(task.id);
    // 继续处理下一个任务
    setTimeout(processQueue, 100);
  }
}

// 生成单个图像 (使用真实的seedream-3.0 API)
async function generateSingleImage(task) {
  try {
    console.log(`开始生成图像，提示词: ${task.finalPrompt}`);
    
    // 调用seedream-3.0 API
    const apiResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINT}`, {
      model: MODEL_NAME,
      prompt: task.finalPrompt,
      size: IMAGE_SIZE,
      quality: 'standard',
      n: 1
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 100000 // 100秒超时
    });

    console.log('API响应:', apiResponse.data);
    
    if (!apiResponse.data || !apiResponse.data.data || !apiResponse.data.data[0]) {
      throw new Error('API返回数据格式错误');
    }

    const imageUrl = apiResponse.data.data[0].url;
    if (!imageUrl) {
      throw new Error('API未返回图像URL');
    }

    console.log('获取到图像URL:', imageUrl);
    
    // 生成本地文件名
    const fileName = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
    const imagePath = path.join(__dirname, '../../targets', fileName);
    
    // 下载图像到本地
    console.log('开始下载图像到本地...');
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'stream',
      timeout: 30000 // 30秒下载超时
    });
    
    const writer = fs.createWriteStream(imagePath);
    imageResponse.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('图像下载完成:', fileName);

    // 保存到数据库
    const imageData = {
      prompt_template: task.promptTemplate,
      template_variables: task.templateVariables,
      final_prompt: task.finalPrompt,
      image_url: imageUrl,
      image_path: `/targets/${fileName}`
    };

    const savedImage = insertImage(imageData);
    console.log('图像保存到数据库成功:', savedImage.id);
    task.resolve(savedImage);
  } catch (error) {
    console.error('图像生成失败:', error.message);
    if (error.response) {
      console.error('API错误响应:', error.response.status, error.response.data);
    }
    
    // 记录错误日志到数据库
     try {
       insertErrorLog({
         prompt_template: task.promptTemplate,
         template_variables: task.templateVariables,
         final_prompt: task.finalPrompt,
         error_message: error.message,
         error_details: error.response ? JSON.stringify({
           status: error.response.status,
           data: error.response.data
         }) : null
       });
     } catch (logError) {
       console.error('记录错误日志失败:', logError);
     }
    
    task.reject(error);
  }
}

// 变量替换函数
function replaceVariables(template, variables) {
  let result = template;
  
  // 如果variables是字符串，尝试解析为JSON
  if (typeof variables === 'string') {
    try {
      // 先尝试解析为JSON
      const jsonVars = JSON.parse(variables);
      if (Array.isArray(jsonVars)) {
        // JSON数组格式，按keyName:value替换
        jsonVars.forEach(item => {
          if (typeof item === 'object') {
            Object.keys(item).forEach(key => {
              const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
              result = result.replace(regex, item[key]);
            });
          }
        });
      } else if (typeof jsonVars === 'object') {
        // JSON对象格式
        Object.keys(jsonVars).forEach(key => {
          const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
          result = result.replace(regex, jsonVars[key]);
        });
      }
    } catch (e) {
      // 不是JSON格式，按"|"分隔处理
      const values = variables.split('|').map(v => v.trim());
      const placeholders = template.match(/\$\{[^}]+\}/g) || [];
      
      placeholders.forEach((placeholder, index) => {
        if (index < values.length) {
          result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), values[index]);
        }
      });
    }
  }
  
  return result;
}

// 生成图像API
router.post('/generate', (req, res) => {
  try {
    const { promptTemplate, templateVariables, concurrency = 1 } = req.body;

    if (!promptTemplate || !promptTemplate.trim()) {
      return res.status(400).json({ error: '提示词模板不能为空' });
    }

    // 构建最终提示词列表
    const finalPrompts = [];
    
    if (templateVariables && templateVariables.trim()) {
      try {
        // 尝试解析为JSON数组
        const jsonVars = JSON.parse(templateVariables);
        if (Array.isArray(jsonVars)) {
          // JSON数组格式，为每个对象生成一个提示词
          jsonVars.forEach(varObj => {
            const finalPrompt = replaceVariables(promptTemplate, JSON.stringify(varObj));
            if (finalPrompt.trim()) finalPrompts.push(finalPrompt.trim());
          });
        } else {
          // 单个JSON对象
          const finalPrompt = replaceVariables(promptTemplate, templateVariables);
          if (finalPrompt.trim()) finalPrompts.push(finalPrompt.trim());
        }
      } catch (e) {
        // 不是JSON格式，按"|"分隔处理
        const values = templateVariables.split('|').map(v => v.trim()).filter(v => v);
        if (values.length > 0) {
          values.forEach(value => {
            const finalPrompt = replaceVariables(promptTemplate, value);
            if (finalPrompt.trim()) finalPrompts.push(finalPrompt.trim());
          });
        } else {
          // 没有变量值，直接使用模板
          if (promptTemplate.trim()) finalPrompts.push(promptTemplate.trim());
        }
      }
    } else {
      // 没有变量，直接使用模板
      if (promptTemplate.trim()) finalPrompts.push(promptTemplate.trim());
    }

    if (finalPrompts.length === 0) {
      return res.status(400).json({ error: '生成的提示词为空' });
    }

    // 创建生成任务
    const tasks = [];
    finalPrompts.forEach((prompt, index) => {
      for (let i = 0; i < concurrency; i++) {
        tasks.push(new Promise((resolve, reject) => {
          const task = {
            id: `${Date.now()}_${index}_${i}`,
            promptTemplate: promptTemplate,
            templateVariables: templateVariables || '',
            finalPrompt: prompt,
            resolve,
            reject
          };
          generationQueue.push(task);
        }));
      }
    });

    // 开始处理队列
    processQueue();

    // 等待所有任务完成
    Promise.allSettled(tasks).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

      res.json({
        success: true,
        generated: successful.length,
        failed: failed.length,
        results: successful,
        errors: failed
      });
    }).catch(error => {
      console.error('Generation error:', error);
      res.status(500).json({ error: '图像生成失败', details: error.message });
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: '图像生成失败', details: error.message });
  }
});

// 获取所有图像
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = getAllImages(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: result.images, total: result.total });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: '获取图像列表失败' });
  }
});

// 搜索图像
router.get('/search/:keyword', (req, res) => {
  try {
    const { keyword } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // 解码URL编码的关键词
    const decodedKeyword = decodeURIComponent(keyword);
    
    const result = searchImages(decodedKeyword, parseInt(limit), parseInt(offset));
    
    res.json({ success: true, data: result.images, total: result.total });
  } catch (error) {
    console.error('Search images error:', error);
    res.status(500).json({ error: '搜索图像失败', details: error.message });
  }
});

// 获取生成状态
router.get('/status/queue', (req, res) => {
  res.json({
    success: true,
    data: {
      queueLength: generationQueue.length,
      activeGenerations: activeGenerations.size,
      maxConcurrent: MAX_CONCURRENT
    }
  });
});

// 根据ID获取图像
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const image = getImageById(id);
    
    if (!image) {
      return res.status(404).json({ error: '图像不存在' });
    }
    
    res.json({ success: true, data: image });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: '获取图像失败' });
  }
});

// 删除图像
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 先获取图像信息
    const image = getImageById(id);
    if (!image) {
      return res.status(404).json({ error: '图像不存在' });
    }
    
    // 删除本地文件
    if (image.image_path) {
      const fullPath = path.join(__dirname, '../..', image.image_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    // 删除数据库记录
    deleteImage(id);
    
    res.json({ success: true, message: '图像删除成功' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: '删除图像失败' });
  }
});

export default router;