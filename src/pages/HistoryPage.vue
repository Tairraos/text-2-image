<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">历史记录</h1>
          </div>
          <nav class="flex space-x-8">
            <router-link to="/" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              主页面
            </router-link>
            <router-link to="/history" class="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium">
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
      <!-- 搜索和筛选区域 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 搜索框 -->
          <div class="flex-1">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索提示词..."
              @keyup.enter="searchImages"
              @clear="clearSearch"
              clearable
              class="w-full"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <!-- 搜索按钮 -->
          <el-button type="primary" @click="searchImages" :loading="searching">
            {{ searching ? '搜索中...' : '搜索' }}
          </el-button>
          
          <!-- 批量操作 -->
          <div class="flex gap-2">
            <el-button 
              v-if="selectedImages.length > 0"
              type="danger"
              @click="batchDelete"
              :loading="batchDeleting"
            >
              {{ batchDeleting ? '删除中...' : `删除选中 (${selectedImages.length})` }}
            </el-button>
            
            <el-button 
              v-if="selectedImages.length > 0"
              @click="batchDownload"
              :loading="batchDownloading"
            >
              {{ batchDownloading ? '下载中...' : '批量下载' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 图像网格 -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <el-loading-spinner size="large" />
        <span class="ml-2 text-gray-600">加载中...</span>
      </div>

      <div v-else-if="images.length > 0">
        <!-- 全选控制 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <el-checkbox 
              v-model="selectAll" 
              @change="toggleSelectAll"
              :indeterminate="isIndeterminate"
            >
              全选
            </el-checkbox>
            <span class="text-sm text-gray-600">
              共 {{ images.length }} 张图像
              <span v-if="selectedImages.length > 0">，已选中 {{ selectedImages.length }} 张</span>
            </span>
          </div>
          
          <!-- 排序选择 -->
          <el-select v-model="sortBy" @change="loadImages" style="width: 150px">
            <el-option label="最新优先" value="created_at_desc" />
            <el-option label="最旧优先" value="created_at_asc" />
          </el-select>
        </div>

        <!-- 图像网格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div 
            v-for="image in images" 
            :key="image.id"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            <!-- 图像卡片 -->
            <div class="relative">
              <!-- 选择框 -->
              <div class="absolute top-2 left-2 z-10">
                <el-checkbox 
                  v-model="selectedImages"
                  :label="image.id"
                  @click.stop
                  class="bg-white bg-opacity-80 rounded p-1"
                />
              </div>
              
              <!-- 图像 -->
              <div @click="viewImage(image)" class="aspect-square overflow-hidden">
                <img 
                  :src="getImageUrl(image.image_path)" 
                  :alt="image.final_prompt"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              
              <!-- 状态标签 -->
              <div class="absolute top-2 right-2">
                <el-tag 
                  :type="getStatusType(image.status)" 
                  size="small"
                  class="bg-opacity-90"
                >
                  {{ getStatusText(image.status) }}
                </el-tag>
              </div>
            </div>
            
            <!-- 图像信息 -->
            <div class="p-4">
              <p class="text-sm text-gray-800 line-clamp-2 mb-2" :title="image.final_prompt">
                {{ image.final_prompt }}
              </p>
              
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ formatTime(image.created_at) }}</span>
                <span>ID: {{ image.id }}</span>
              </div>
              
              <!-- 快速操作按钮 -->
              <div class="flex gap-1 mt-3">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click.stop="viewImage(image)"
                  class="flex-1"
                >
                  查看
                </el-button>
                
                <el-button 
                  size="small" 
                  @click.stop="downloadSingle(image)"
                  class="flex-1"
                >
                  下载
                </el-button>
                
                <el-button 
                  size="small" 
                  type="danger" 
                  @click.stop="deleteSingle(image)"
                >
                  <template #icon>
                    <el-icon><Delete /></el-icon>
                  </template>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalImages"
            layout="prev, pager, next, sizes, total"
            :page-sizes="[20, 40, 60, 100]"
            @current-change="loadImages"
            @size-change="handleSizeChange"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-16">
        <el-icon class="text-6xl text-gray-300 mb-4"><Picture /></el-icon>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchKeyword ? '未找到相关图像' : '暂无生成记录' }}
        </h3>
        <p class="text-gray-500 mb-4">
          {{ searchKeyword ? '尝试使用其他关键词搜索' : '开始生成您的第一张图像吧' }}
        </p>
        <el-button type="primary" @click="goToHome">开始生成</el-button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Picture } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 响应式数据
const images = ref([])
const loading = ref(true)
const searching = ref(false)
const batchDeleting = ref(false)
const batchDownloading = ref(false)
const searchKeyword = ref('')
const selectedImages = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalImages = ref(0)
const sortBy = ref('created_at_desc')

// 计算属性
const selectAll = computed({
  get: () => selectedImages.value.length === images.value.length && images.value.length > 0,
  set: (value) => {
    if (value) {
      selectedImages.value = images.value.map(img => img.id)
    } else {
      selectedImages.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  return selectedImages.value.length > 0 && selectedImages.value.length < images.value.length
})

// 加载图像列表
const loadImages = async () => {
  try {
    loading.value = true
    
    let url = `http://localhost:3002/api/images?page=${currentPage.value}&limit=${pageSize.value}`
    
    if (searchKeyword.value.trim()) {
      url = `http://localhost:3002/api/images/search/${encodeURIComponent(searchKeyword.value)}?page=${currentPage.value}&limit=${pageSize.value}`
    }
    
    const response = await axios.get(url)
    
    if (response.data.success) {
      images.value = response.data.data
      // 注意：这里简化处理，实际应该从API返回总数
      totalImages.value = response.data.total || response.data.data.length
    }
  } catch (error) {
    console.error('Load images error:', error)
    
    let errorMessage = '加载图像列表失败'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        errorMessage = '加载失败: 未授权访问 (401)'
      } else if (status === 403) {
        errorMessage = '加载失败: 访问被禁止 (403)'
      } else if (status === 500) {
        errorMessage = '加载失败: 服务器内部错误 (500)'
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

// 搜索图像
const searchImages = async () => {
  searching.value = true
  currentPage.value = 1
  selectedImages.value = []
  
  try {
    await loadImages()
  } finally {
    searching.value = false
  }
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  selectedImages.value = []
  loadImages()
}

// 切换全选
const toggleSelectAll = () => {
  // selectAll 的 setter 会自动处理
}

// 查看图像
const viewImage = (image: any) => {
  router.push(`/image/${image.id}`)
}

// 下载单个图像
const downloadSingle = (image: any) => {
  const link = document.createElement('a')
  link.href = getImageUrl(image.image_path)
  link.download = `image_${image.id}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('开始下载图像')
}

// 删除单个图像
const deleteSingle = async (image: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这张图像吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await axios.delete(`http://localhost:3002/api/images/${image.id}`)
    
    if (response.data.success) {
      ElMessage.success('图像删除成功')
      // 从列表中移除
      images.value = images.value.filter(img => img.id !== image.id)
      // 从选中列表中移除
      selectedImages.value = selectedImages.value.filter(id => id !== image.id)
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
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedImages.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.length} 张图像吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    batchDeleting.value = true
    
    // 并发删除
    const deletePromises = selectedImages.value.map(id => 
      axios.delete(`http://localhost:3002/api/images/${id}`)
    )
    
    const results = await Promise.allSettled(deletePromises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    if (successful > 0) {
      ElMessage.success(`成功删除 ${successful} 张图像`)
      if (failed > 0) {
        ElMessage.warning(`${failed} 张图像删除失败`)
      }
      
      // 重新加载列表
      selectedImages.value = []
      await loadImages()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
      
      let errorMessage = '批量删除失败'
      if (error.response) {
        const status = error.response.status
        if (status === 401) {
          errorMessage = '批量删除失败: 未授权访问 (401)'
        } else if (status === 403) {
          errorMessage = '批量删除失败: 访问被禁止 (403)'
        } else if (status === 500) {
          errorMessage = '批量删除失败: 服务器内部错误 (500)'
        } else {
          errorMessage = `批量删除失败: HTTP ${status} 错误`
        }
      } else if (error.request) {
        errorMessage = '批量删除失败: 网络连接错误'
      }
      
      ElMessage.error(errorMessage)
    }
  } finally {
    batchDeleting.value = false
  }
}

// 批量下载
const batchDownload = async () => {
  if (selectedImages.value.length === 0) return
  
  batchDownloading.value = true
  
  try {
    // 逐个下载（避免浏览器阻止多个下载）
    for (const imageId of selectedImages.value) {
      const image = images.value.find(img => img.id === imageId)
      if (image) {
        const link = document.createElement('a')
        link.href = getImageUrl(image.image_path)
        link.download = `image_${image.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 添加延迟避免浏览器限制
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    ElMessage.success(`开始下载 ${selectedImages.value.length} 张图像`)
  } catch (error) {
    console.error('Batch download error:', error)
    
    let errorMessage = '批量下载失败'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        errorMessage = '批量下载失败: 未授权访问 (401)'
      } else if (status === 403) {
        errorMessage = '批量下载失败: 访问被禁止 (403)'
      } else if (status === 500) {
        errorMessage = '批量下载失败: 服务器内部错误 (500)'
      } else {
        errorMessage = `批量下载失败: HTTP ${status} 错误`
      }
    } else if (error.request) {
      errorMessage = '批量下载失败: 网络连接错误'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    batchDownloading.value = false
  }
}

// 处理页面大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadImages()
}

// 跳转到主页
const goToHome = () => {
  router.push('/')
}

// 获取图像URL
const getImageUrl = (imagePath: string) => {
  return `http://localhost:3002${imagePath}`
}

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1小时显示分钟
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }
  
  // 小于1天显示小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  
  // 否则显示日期
  return date.toLocaleDateString('zh-CN')
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
    case 'completed': return '完成'
    case 'pending': return '生成中'
    case 'failed': return '失败'
    default: return '未知'
  }
}

// 监听路由变化，处理搜索参数
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    searchKeyword.value = newSearch as string
    searchImages()
  }
}, { immediate: true })

// 组件挂载时加载数据
onMounted(() => {
  // 如果没有搜索参数，直接加载
  if (!route.query.search) {
    loadImages()
  }
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