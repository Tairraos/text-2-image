/**
 * 国际化组合式函数
 * 提供中英文双语支持，默认使用系统语言
 */
import { ref, computed } from 'vue'

// 当前语言设置
const currentLocale = ref('zh')

// 检测系统语言
const detectSystemLanguage = () => {
  const systemLang = navigator.language || navigator.userLanguage
  return systemLang.startsWith('zh') ? 'zh' : 'en'
}

// 初始化语言设置
const initLanguage = () => {
  const savedLang = localStorage.getItem('app-language')
  if (savedLang && ['zh', 'en'].includes(savedLang)) {
    currentLocale.value = savedLang
  } else {
    currentLocale.value = detectSystemLanguage()
  }
}

// 翻译文本映射
const translations = {
  zh: {
    // 页面标题
    errorLogs: '错误日志',
    homePage: '主页面',
    historyPage: '历史记录',
    
    // 统计信息
    totalErrors: '总错误数',
    todayErrors: '今日错误',
    currentDisplay: '当前显示',
    
    // 操作按钮
    refresh: '刷新',
    loading: '加载中...',
    clearLogs: '清空日志',
    itemsPerPage: '每页显示:',
    retry: '重新生成',
    copy: '复制',
    delete: '删除',
    
    // 状态信息
    noErrorLogs: '暂无错误日志',
    noErrorLogsDesc: '当图片生成失败时，错误信息会显示在这里',
    
    // 错误详情
    errorNumber: '错误',
    prompt: '提示词',
    errorMessage: '错误信息',
    errorDetails: '详细信息',
    templateVariables: '模板变量',
    
    // 分页
    showing: '显示第',
    to: '-',
    of: '条，共',
    total: '条',
    previousPage: '上一页',
    nextPage: '下一页',
    
    // 确认对话框
    confirmClear: '确定要清空所有错误日志吗？此操作不可恢复。',
    confirmClearTitle: '确认清空',
    confirm: '确定',
    cancel: '取消',
    
    // 提示信息
    errorLogCleared: '错误日志已清空',
    errorLogDeleted: '错误日志已删除',
    errorCopied: '错误信息已复制到剪贴板',
    copyFailed: '复制失败',
    promptFilled: '提示词已填入模板，正在跳转到主页面...',
    noPromptError: '该错误日志没有提示词信息',
    loadErrorLogsFailed: '加载错误日志失败',
    clearErrorLogsFailed: '清空错误日志失败',
    deleteErrorLogFailed: '删除错误日志失败'
  },
  en: {
    // Page titles
    errorLogs: 'Error Logs',
    homePage: 'Home',
    historyPage: 'History',
    
    // Statistics
    totalErrors: 'Total Errors',
    todayErrors: 'Today\'s Errors',
    currentDisplay: 'Currently Displayed',
    
    // Action buttons
    refresh: 'Refresh',
    loading: 'Loading...',
    clearLogs: 'Clear Logs',
    itemsPerPage: 'Items per page:',
    retry: 'Retry',
    copy: 'Copy',
    delete: 'Delete',
    
    // Status messages
    noErrorLogs: 'No Error Logs',
    noErrorLogsDesc: 'Error messages will appear here when image generation fails',
    
    // Error details
    errorNumber: 'Error',
    prompt: 'Prompt',
    errorMessage: 'Error Message',
    errorDetails: 'Error Details',
    templateVariables: 'Template Variables',
    
    // Pagination
    showing: 'Showing',
    to: 'to',
    of: 'of',
    total: 'entries',
    previousPage: 'Previous',
    nextPage: 'Next',
    
    // Confirmation dialogs
    confirmClear: 'Are you sure you want to clear all error logs? This action cannot be undone.',
    confirmClearTitle: 'Confirm Clear',
    confirm: 'Confirm',
    cancel: 'Cancel',
    
    // Toast messages
    errorLogCleared: 'Error logs cleared',
    errorLogDeleted: 'Error log deleted',
    errorCopied: 'Error information copied to clipboard',
    copyFailed: 'Copy failed',
    promptFilled: 'Prompt filled in template, redirecting to home page...',
    noPromptError: 'This error log has no prompt information',
    loadErrorLogsFailed: 'Failed to load error logs',
    clearErrorLogsFailed: 'Failed to clear error logs',
    deleteErrorLogFailed: 'Failed to delete error log'
  }
}

/**
 * 国际化组合式函数
 * @returns {Object} 包含翻译函数和语言切换函数的对象
 */
export function useI18n() {
  // 初始化语言
  if (!currentLocale.value) {
    initLanguage()
  }
  
  /**
   * 翻译函数
   * @param {string} key - 翻译键
   * @param {Object} params - 参数对象（用于插值）
   * @returns {string} 翻译后的文本
   */
  const t = (key, params = {}) => {
    const translation = translations[currentLocale.value]?.[key] || translations.zh[key] || key
    
    // 简单的参数插值
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match
      })
    }
    
    return translation
  }
  
  /**
   * 切换语言
   * @param {string} locale - 语言代码 ('zh' | 'en')
   */
  const setLocale = (locale) => {
    if (['zh', 'en'].includes(locale)) {
      currentLocale.value = locale
      localStorage.setItem('app-language', locale)
    }
  }
  
  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  const locale = computed(() => currentLocale.value)
  
  /**
   * 获取可用语言列表
   * @returns {Array} 语言选项数组
   */
  const availableLocales = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' }
  ]
  
  return {
    t,
    locale,
    setLocale,
    availableLocales
  }
}

// 导出初始化函数供应用启动时调用
export { initLanguage }