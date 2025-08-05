<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <el-button @click="goBack" type="text" class="text-gray-600 hover:text-gray-800">
              <template #icon>
                <el-icon><ArrowLeft /></el-icon>
              </template>
              返回
            </el-button>
            <h1 class="text-xl font-semibold text-gray-900">图像详情</h1>
          </div>
          <nav class="flex space-x-8">
            <router-link to="/" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              主页面
            </router-link>
            <router-link to="/history" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              历史记录
            </router-link>
            <router-link to="/error-logs" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              错误日志
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <el-loading-spinner size="large" />
        <span class="ml-2 text-gray-600">加载中...</span>
      </div>

      <div v-else-if="image" class="max-w-4xl mx-auto">
        <!-- 图像展示 -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <!-- 主图像 -->
          <div class="relative">
            <img 
              :src="getImageUrl(image.image_path)" 
              :alt="image.final_prompt"
              class="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
              @click="showImageModal = true"
            />
            <div class="absolute top-4 right-4">
              <el-button 
                type="primary" 
                circle 
                @click="showImageModal = true"
                class="bg-black bg-opacity-50 border-none hover:bg-opacity-70"
              >
                <template #icon>
                  <el-icon class="text-white"><ZoomIn /></el-icon>
                </template>
              </el-button>
            </div>
          </div>

          <!-- 最终提示词 -->
          <div class="p-6 border-t">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">最终提示词</label>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-800 leading-relaxed">
                {{ image.final_prompt }}
              </div>
            </div>
            
            <!-- 所有操作按钮 -->
            <div class="flex flex-wrap justify-center gap-3 mb-4">
              <el-button 
                type="primary" 
                @click="copyPrompt"
                :loading="copying"
              >
                <template #icon>
                  <el-icon><DocumentCopy /></el-icon>
                </template>
                {{ copying ? '复制中...' : '复制提示词' }}
              </el-button>
              
              <el-button type="primary" @click="regenerateImage">
                <template #icon>
                  <el-icon><Refresh /></el-icon>
                </template>
                重新生成
              </el-button>
              
              <el-button @click="downloadImage">
                <template #icon>
                  <el-icon><Download /></el-icon>
                </template>
                下载图像
              </el-button>
              
              <el-button @click="shareImage">
                <template #icon>
                  <el-icon><Share /></el-icon>
                </template>
                分享
              </el-button>
              
              <el-button @click="useAsTemplate">
                <template #icon>
                  <el-icon><Edit /></el-icon>
                </template>
                用作模板
              </el-button>
              
              <el-button 
                type="danger" 
                @click="deleteImage"
                :loading="deleting"
              >
                <template #icon>
                  <el-icon><Delete /></el-icon>
                </template>
                {{ deleting ? '删除中...' : '删除' }}
              </el-button>
            </div>
          </div>
        </div>

        
        <!-- 生成信息 -->
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">生成信息</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <span class="block text-sm text-gray-600 mb-1">生成时间</span>
              <span class="text-sm font-medium">{{ formatTime(image.created_at) }}</span>
            </div>
            <div class="text-center">
              <span class="block text-sm text-gray-600 mb-1">状态</span>
              <el-tag :type="getStatusType(image.status)" size="small">
                {{ getStatusText(image.status) }}
              </el-tag>
            </div>
            <div class="text-center">
              <span class="block text-sm text-gray-600 mb-1">图像ID</span>
              <span class="text-sm font-medium font-mono">{{ image.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <el-icon class="text-6xl text-gray-300 mb-4"><Picture /></el-icon>
        <h3 class="text-lg font-medium text-gray-900 mb-2">图像不存在</h3>
        <p class="text-gray-500 mb-4">请检查图像ID是否正确</p>
        <el-button type="primary" @click="goBack">返回</el-button>
      </div>
    </main>

    <!-- 图像放大模态框 -->
    <el-dialog 
      v-model="showImageModal" 
      :width="'90%'"
      :show-close="false"
      class="image-modal"
    >
      <div class="flex justify-center items-center">
        <img 
          v-if="image"
          :src="getImageUrl(image.image_path)" 
          :alt="image.final_prompt"
          class="max-w-full max-h-[80vh] object-contain"
        />
      </div>
      <template #footer>
        <div class="text-center">
          <el-button @click="showImageModal = false">关闭</el-button>
          <el-button type="primary" @click="downloadImage">下载</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Refresh, 
  Download, 
  Share, 
  Delete, 
  DocumentCopy 
} from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// 响应式数据
const image = ref(null)
const loading = ref(true)
const deleting = ref(false)
const copying = ref(false)
const showImageModal = ref(false)

// 加载图像详情
const loadImageDetail = async () => {
  try {
    const imageId = route.params.id
    const response = await axios.get(`http://localhost:3002/api/images/${imageId}`)
    
    if (response.data.success) {
      image.value = response.data.data
    } else {
      const errorMsg = response.data?.message || response.data?.error || '图像不存在'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    console.error('Load image detail error:', error)
    
    let errorMessage = '加载图像详情失败'
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        errorMessage = '加载失败: 未授权访问 (401)'
      } else if (status === 403) {
        errorMessage = '加载失败: 访问被禁止 (403)'
      } else if (status === 404) {
        errorMessage = '加载失败: 图像不存在 (404)'
      } else if (status === 500) {
        errorMessage = '加载失败: 服务器内部错误 (500)'
      } else if (data?.message) {
        errorMessage = `加载失败: ${data.message} (${status})`
      } else {
        errorMessage = `加载失败: HTTP ${status} 错误`
      }
    } else if (error.request) {
      errorMessage = '加载失败: 网络连接错误，请检查服务器是否运行'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 重新生成图像
const regenerateImage = async () => {
  if (!image.value) return
  
  try {
    const response = await axios.post('http://localhost:3002/api/images/generate', {
      promptTemplate: image.value.prompt_template,
      templateVariables: image.value.template_variables,
      finalPrompt: image.value.final_prompt,
      concurrency: 1
    })

    if (response.data.success && response.data.results.length > 0) {
      ElMessage.success('重新生成成功')
      // 跳转到新生成的图像
      router.push(`/image/${response.data.results[0].id}`)
    } else {
      const errorMsg = response.data?.message || response.data?.error || '重新生成失败'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    console.error('Regenerate error:', error)
    
    let errorMessage = '重新生成失败'
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        errorMessage = '重新生成失败: 未授权访问 (401)'
      } else if (status === 403) {
        errorMessage = '重新生成失败: 访问被禁止 (403)'
      } else if (status === 500) {
        errorMessage = '重新生成失败: 服务器内部错误 (500)'
      } else if (data?.message) {
        errorMessage = `重新生成失败: ${data.message} (${status})`
      } else {
        errorMessage = `重新生成失败: HTTP ${status} 错误`
      }
    } else if (error.request) {
      errorMessage = '重新生成失败: 网络连接错误'
    }
    
    ElMessage.error(errorMessage)
  }
}

// 下载图像
const downloadImage = () => {
  if (!image.value) return
  
  const link = document.createElement('a')
  link.href = getImageUrl(image.value.image_path)
  link.download = `image_${image.value.id}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('开始下载图像')
}

// 分享图像
const shareImage = async () => {
  if (!image.value) return
  
  try {
    const shareData = {
      title: '文生图工具 - 生成的图像',
      text: image.value.final_prompt,
      url: window.location.href
    }
    
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // 复制链接到剪贴板
      await navigator.clipboard.writeText(window.location.href)
      ElMessage.success('链接已复制到剪贴板')
    }
  } catch (error) {
    console.error('Share error:', error)
    ElMessage.error('分享失败')
  }
}

// 删除图像
const deleteImage = async () => {
  if (!image.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这张图像吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    deleting.value = true
    
    const response = await axios.delete(`http://localhost:3002/api/images/${image.value.id}`)
    
    if (response.data.success) {
      ElMessage.success('图像删除成功')
      router.push('/history')
    } else {
      const errorMsg = response.data?.message || response.data?.error || '删除失败'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      
      let errorMessage = '删除失败'
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 401) {
          errorMessage = '删除失败: 未授权访问 (401)'
        } else if (status === 403) {
          errorMessage = '删除失败: 访问被禁止 (403)'
        } else if (status === 404) {
          errorMessage = '删除失败: 图像不存在 (404)'
        } else if (status === 500) {
          errorMessage = '删除失败: 服务器内部错误 (500)'
        } else if (data?.message) {
          errorMessage = `删除失败: ${data.message} (${status})`
        } else {
          errorMessage = `删除失败: HTTP ${status} 错误`
        }
      } else if (error.request) {
        errorMessage = '删除失败: 网络连接错误'
      }
      
      ElMessage.error(errorMessage)
    }
  } finally {
    deleting.value = false
  }
}

// 复制提示词
const copyPrompt = async () => {
  if (!image.value) return
  
  copying.value = true
  
  try {
    await navigator.clipboard.writeText(image.value.final_prompt)
    ElMessage.success('提示词已复制到剪贴板')
  } catch (error) {
    console.error('Copy error:', error)
    ElMessage.error('复制失败')
  } finally {
    copying.value = false
  }
}

// 用作模板
const useAsTemplate = () => {
  if (!image.value) return
  
  // 将提示词信息存储到 sessionStorage
  const templateData = {
    promptTemplate: image.value.prompt_template || '',
    templateVariables: image.value.template_variables || ''
  }
  
  sessionStorage.setItem('promptTemplate', JSON.stringify(templateData))
  
  ElMessage.success('模板已保存，跳转到主页面')
  router.push('/')
}

// 查看相似
const viewSimilar = () => {
  if (!image.value) return
  
  // 使用最终提示词的前几个词作为搜索关键词
  const keywords = image.value.final_prompt.split(' ').slice(0, 3).join(' ')
  router.push(`/history?search=${encodeURIComponent(keywords)}`)
}

// 获取图像URL
const getImageUrl = (imagePath: string) => {
  return `http://localhost:3002${imagePath}`
}

// 格式化时间
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'pending': return '生成中'
    case 'failed': return '失败'
    default: return '未知'
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadImageDetail()
})
</script>

<style scoped>
.image-modal :deep(.el-dialog__body) {
  padding: 20px;
  text-align: center;
}

.image-modal :deep(.el-dialog__header) {
  display: none;
}
</style>