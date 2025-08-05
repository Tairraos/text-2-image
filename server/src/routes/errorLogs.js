import express from 'express';
import { getAllErrorLogs, getErrorLogById, deleteErrorLog, getErrorLogCount, clearAllErrorLogs } from '../models/database.js';

const router = express.Router();

// 获取所有错误日志
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = getAllErrorLogs(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: result.errorLogs, total: result.total });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({ error: '获取错误日志失败' });
  }
});

// 获取错误日志总数
router.get('/count', async (req, res) => {
  try {
    const total = getErrorLogCount()
    res.json({ success: true, count: total })
  } catch (error) {
    console.error('Get error log count error:', error)
    res.status(500).json({ success: false, error: '获取错误日志总数失败', details: error.message })
  }
})

// 根据ID获取错误日志
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const errorLog = getErrorLogById(id);
    
    if (!errorLog) {
      return res.status(404).json({ error: '错误日志不存在' });
    }
    
    res.json({ success: true, data: errorLog });
  } catch (error) {
    console.error('Get error log error:', error);
    res.status(500).json({ error: '获取错误日志失败' });
  }
});

// 清空所有错误日志
router.delete('/', (req, res) => {
  try {
    clearAllErrorLogs();
    res.json({ success: true, message: '所有错误日志已清空' });
  } catch (error) {
    console.error('Clear all error logs error:', error);
    res.status(500).json({ error: '清空错误日志失败' });
  }
});

// 删除错误日志
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedLog = deleteErrorLog(id);
    if (!deletedLog) {
      return res.status(404).json({ error: '错误日志不存在' });
    }
    
    res.json({ success: true, message: '错误日志删除成功' });
  } catch (error) {
    console.error('Delete error log error:', error);
    res.status(500).json({ error: '删除错误日志失败' });
  }
});

export default router;