<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">{{ t('errorLogs') }}</h1>
          </div>
          <div class="flex items-center space-x-4">
            <nav class="flex space-x-8">
              <router-link to="/" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {{ t('homePage') }}
              </router-link>
              <router-link to="/history" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {{ t('historyPage') }}
              </router-link>
              <router-link to="/error-logs" class="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {{ t('errorLogs') }}
              </router-link>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 统计信息卡片 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600 mb-1">{{ totalLogs }}</div>
            <div class="text-sm text-gray-600">{{ t('totalErrors') }}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600 mb-1">{{ todayLogs }}</div>
            <div class="text-sm text-gray-600">{{ t('todayErrors') }}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600 mb-1">{{ displayedLogs.length }}</div>
            <div class="text-sm text-gray-600">{{ t('currentDisplay') }}</div>
          </div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="flex gap-3">
            <button
              @click="loadErrorLogs"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw :class="['w-4 h-4 mr-2', loading ? 'animate-spin' : '']" />
              {{ loading ? t('loading') : t('refresh') }}
            </button>
            <button
              @click="clearAllLogs"
              :disabled="loading || totalLogs === 0"
              class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              {{ t('clearLogs') }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ t('itemsPerPage') }}</span>
            <select 
              v-model="pageSize" 
              @change="loadErrorLogs" 
              class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 错误日志列表 -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">{{ t('loading') }}</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="displayedLogs.length === 0" class="text-center py-16">
          <div class="text-gray-400 mb-4">
            <FileX class="w-12 h-12 mx-auto" />
          </div>
          <p class="text-gray-600 text-lg mb-2">{{ t('noErrorLogs') }}</p>
          <p class="text-gray-500 text-sm">{{ t('noErrorLogsDesc') }}</p>
        </div>

        <!-- 错误日志列表 -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="(log, index) in displayedLogs"
            :key="log.id || index"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <div>
                  <span class="text-sm font-medium text-gray-900">
                    {{ t('errorNumber') }} #{{ totalLogs - (currentPage - 1) * pageSize - index }}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    {{ formatTime(log.created_at) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="retryGeneration(log)"
                  :title="t('retry')"
                  :disabled="!log.final_prompt"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw class="w-3 h-3 mr-1" />
                  {{ t('retry') }}
                </button>
                <button
                  @click="copyError(log)"
                  :title="t('copy')"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Copy class="w-3 h-3 mr-1" />
                  {{ t('copy') }}
                </button>
                <button
                  @click="deleteLog(log.id)"
                  :title="t('delete')"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <Trash2 class="w-3 h-3 mr-1" />
                  {{ t('delete') }}
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <!-- 提示词 -->
              <div v-if="log.final_prompt">
                <label class="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                  {{ t('prompt') }}
                </label>
                <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <p class="text-sm text-gray-900">{{ log.final_prompt }}</p>
                </div>
              </div>

              <!-- 模板变量 -->
              <div v-if="log.template_variables">
                <label class="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                  {{ t('templateVariables') }}
                </label>
                <div class="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                  <p class="text-sm text-gray-700">{{ log.template_variables }}</p>
                </div>
              </div>

              <!-- 错误信息 -->
              <div>
                <label class="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                  {{ t('errorMessage') }}
                </label>
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p class="text-sm text-red-700">{{ log.error_message }}</p>
                </div>
              </div>

              <!-- 详细信息 -->
              <div v-if="log.error_details">
                <label class="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                  {{ t('errorDetails') }}
                </label>
                <div class="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                  <pre class="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">{{ log.error_details }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t">
          <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                {{ t('showing') }} {{ (currentPage - 1) * pageSize + 1 }} {{ t('to') }} {{ Math.min(currentPage * pageSize, totalLogs) }} {{ t('of') }} {{ totalLogs }} {{ t('total') }}
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage <= 1"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ t('previousPage') }}
                </button>
              
              <template v-for="page in getPageNumbers()" :key="page">
                <button
                  v-if="page !== '...'"
                  @click="goToPage(page as number)"
                  :class="[
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <span v-else class="px-3 py-2 text-sm text-gray-500">...</span>
              </template>
              
              <button
                  @click="goToPage(currentPage + 1)"
                  :disabled="currentPage >= totalPages"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ t('nextPage') }}
                </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import axios from 'axios'
import { toast } from 'sonner'
import { RefreshCw, Trash2, Copy, FileX } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const errorLogs = ref<any[]>([])
const totalLogs = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const totalPages = computed(() => Math.ceil(totalLogs.value / pageSize.value))
const displayedLogs = computed(() => errorLogs.value)
const todayLogs = computed(() => {
  const today = new Date().toDateString()
  return errorLogs.value.filter(log => {
    const logDate = new Date(log.created_at).toDateString()
    return logDate === today
  }).length
})

// 加载错误日志
const loadErrorLogs = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3002/api/error-logs', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    
    if (response.data.success) {
      errorLogs.value = response.data.data || []
      totalLogs.value = response.data.total || 0
    } else {
      throw new Error(response.data.message || t('loadErrorLogsFailed'))
    }
  } catch (error: any) {
    console.error('加载错误日志失败:', error)
    toast.error(t('loadErrorLogsFailed') + ': ' + (error.response?.data?.message || error.message))
    errorLogs.value = []
    totalLogs.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 清空所有日志
 */
const clearAllLogs = async () => {
  try {
    await ElMessageBox.confirm(
      t('confirmClear'),
      t('confirmClearTitle'),
      {
        confirmButtonText: t('confirm'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      }
    )
  } catch {
    return
  }
  
  loading.value = true
  try {
    const response = await axios.delete('http://localhost:3002/api/error-logs')
    
    if (response.data.success) {
      toast.success(t('errorLogCleared'))
      await loadErrorLogs()
    } else {
      throw new Error(response.data.message || t('clearErrorLogsFailed'))
    }
  } catch (error: any) {
    console.error('清空错误日志失败:', error)
    toast.error(t('clearErrorLogsFailed') + ': ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

/**
 * 删除单条错误日志
 * @param {string} logId - 日志ID
 */
const deleteLog = async (logId: string) => {
  // 直接删除，不需要确认框
  
  loading.value = true
  try {
    const response = await axios.delete(`http://localhost:3002/api/error-logs/${logId}`)
    
    if (response.data.success) {
      toast.success(t('errorLogDeleted'))
      await loadErrorLogs()
    } else {
      throw new Error(response.data.message || t('deleteErrorLogFailed'))
    }
  } catch (error: any) {
    console.error('删除错误日志失败:', error)
    toast.error(t('deleteErrorLogFailed') + ': ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

/**
 * 重新生成图片
 * @param {Object} log - 错误日志对象
 */
const retryGeneration = (log: any) => {
  if (!log.final_prompt) {
    toast.error(t('noPromptError'))
    return
  }
  
  // 将提示词信息保存到sessionStorage，供主页面使用
  const templateData = {
    promptTemplate: log.final_prompt,
    templateVariables: log.template_variables || ''
  }
  
  sessionStorage.setItem('promptTemplate', JSON.stringify(templateData))
  toast.success(t('promptFilled'))
  
  // 跳转到主页面
  router.push('/')
}

/**
 * 复制错误信息
 * @param {Object} log - 错误日志对象
 */
const copyError = async (log: any) => {
  const errorText = `${t('errorMessage')}: ${formatTime(log.created_at)}\n${t('prompt')}: ${log.final_prompt || 'N/A'}\n${t('templateVariables')}: ${log.template_variables || 'N/A'}\n${t('errorMessage')}: ${log.error_message}\n${t('errorDetails')}: ${log.error_details || 'N/A'}`
  
  try {
    await navigator.clipboard.writeText(errorText)
    toast.success(t('errorCopied'))
  } catch (error) {
    console.error('复制失败:', error)
    toast.error(t('copyFailed'))
  }
}

// 格式化时间
const formatTime = (timestamp: string | number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 跳转到指定页面
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    loadErrorLogs()
  }
}

// 获取分页页码数组
const getPageNumbers = () => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    // 如果总页数小于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第一页
    pages.push(1)
    
    if (current <= 4) {
      // 当前页在前面
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后面
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
}

// 组件挂载时加载数据
onMounted(() => {
  loadErrorLogs()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>