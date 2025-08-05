import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据文件路径
const dataDir = path.join(__dirname, '../../data');
const imagesFile = path.join(dataDir, 'images.json');
const errorLogsFile = path.join(dataDir, 'error_logs.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(imagesFile)) {
  const initialData = {
    images: [],
    nextId: 1
  };
  fs.writeFileSync(imagesFile, JSON.stringify(initialData, null, 2));
}

// 初始化错误日志文件
if (!fs.existsSync(errorLogsFile)) {
  const initialErrorData = {
    errorLogs: [],
    nextId: 1
  };
  fs.writeFileSync(errorLogsFile, JSON.stringify(initialErrorData, null, 2));
}

// 读取数据
function readData() {
  try {
    const data = fs.readFileSync(imagesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据文件失败:', error);
    return { images: [], nextId: 1 };
  }
}

// 写入数据
function writeData(data) {
  try {
    fs.writeFileSync(imagesFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('写入数据文件失败:', error);
    throw error;
  }
}

// 插入图像记录
export function insertImage(imageData) {
  const data = readData();
  const newImage = {
    id: data.nextId,
    prompt_template: imageData.prompt_template || '',
    template_variables: imageData.template_variables || '',
    final_prompt: imageData.final_prompt,
    image_url: imageData.image_url,
    image_path: imageData.image_path,
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  data.images.unshift(newImage); // 添加到开头，最新的在前面
  data.nextId++;
  
  writeData(data);
  return newImage;
}

// 获取所有图像
export function getAllImages(limit = 20, offset = 0) {
  const data = readData();
  const images = data.images.slice(offset, offset + limit);
  return {
    images,
    total: data.images.length,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(data.images.length / limit)
  };
}

// 根据ID获取图像
export function getImageById(id) {
  const data = readData();
  return data.images.find(image => image.id === parseInt(id));
}

// 删除图像
export function deleteImage(id) {
  const data = readData();
  const index = data.images.findIndex(image => image.id === parseInt(id));
  
  if (index === -1) {
    return null;
  }
  
  const deletedImage = data.images.splice(index, 1)[0];
  writeData(data);
  return deletedImage;
}

// 搜索图像
export function searchImages(keyword, limit = 20, offset = 0) {
  const data = readData();
  const filteredImages = data.images.filter(image => {
    // 安全检查，确保字段存在且为字符串
    const finalPrompt = image.final_prompt || '';
    const promptTemplate = image.prompt_template || '';
    const templateVariables = image.template_variables || '';
    
    const keywordLower = keyword.toLowerCase();
    
    return finalPrompt.toLowerCase().includes(keywordLower) ||
           promptTemplate.toLowerCase().includes(keywordLower) ||
           templateVariables.toLowerCase().includes(keywordLower);
  });
  
  const images = filteredImages.slice(offset, offset + limit);
  return {
    images,
    total: filteredImages.length,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(filteredImages.length / limit)
  };
}

// 错误日志相关函数

// 读取错误日志数据
function readErrorLogs() {
  try {
    const data = fs.readFileSync(errorLogsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取错误日志文件失败:', error);
    return { errorLogs: [], nextId: 1 };
  }
}

// 写入错误日志数据
function writeErrorLogs(data) {
  try {
    fs.writeFileSync(errorLogsFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('写入错误日志文件失败:', error);
    throw error;
  }
}

// 插入错误日志记录
export function insertErrorLog(errorData) {
  const data = readErrorLogs();
  const newErrorLog = {
    id: data.nextId,
    prompt_template: errorData.prompt_template || '',
    template_variables: errorData.template_variables || '',
    final_prompt: errorData.final_prompt,
    error_message: errorData.error_message,
    error_details: errorData.error_details || '',
    created_at: new Date().toISOString()
  };
  
  data.errorLogs.unshift(newErrorLog); // 添加到开头，最新的在前面
  data.nextId++;
  
  writeErrorLogs(data);
  return newErrorLog;
}

// 获取所有错误日志
export function getAllErrorLogs(limit = 20, offset = 0) {
  const data = readErrorLogs();
  const errorLogs = data.errorLogs.slice(offset, offset + limit);
  return {
    errorLogs,
    total: data.errorLogs.length,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(data.errorLogs.length / limit)
  };
}

// 根据ID获取错误日志
export function getErrorLogById(id) {
  const data = readErrorLogs();
  return data.errorLogs.find(log => log.id === parseInt(id));
}

// 删除错误日志
export function deleteErrorLog(id) {
  const data = readErrorLogs();
  const index = data.errorLogs.findIndex(log => log.id === parseInt(id));
  
  if (index === -1) {
    return null;
  }
  
  const deletedLog = data.errorLogs.splice(index, 1)[0];
  writeErrorLogs(data);
  return deletedLog;
}

// 获取错误日志总数
export function getErrorLogCount() {
  const data = readErrorLogs();
  return data.errorLogs.length;
}

// 清空所有错误日志
export function clearAllErrorLogs() {
  const data = {
    errorLogs: [],
    nextId: 1
  };
  writeErrorLogs(data);
  return true;
}