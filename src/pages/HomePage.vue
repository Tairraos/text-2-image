<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">文生图工具</h1>
          </div>
          <nav class="flex space-x-8">
            <router-link to="/" class="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium">
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：提示词构建区域 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 提示词输入卡片 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">提示词构建</h2>
            
            <!-- 流式布局容器 -->
            <div class="prompt-builder-container">
              <!-- 提示词模板 -->
              <div class="input-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  提示词模板
                  <span class="text-xs text-gray-500">(可使用 ${keyName} 引用变量)</span>
                </label>
                <el-input
                  v-model="promptTemplate"
                  type="textarea"
                  :autosize="{ minRows: 3, maxRows: 10 }"
                  placeholder="输入提示词模板...\n例如：\n一张${style}风格的${subject}图片，${details}，高质量，4K分辨率"
                  @input="updateFinalPrompt"
                  class="resizable-textarea"
                />
              </div>

              <!-- 模板变量 -->
              <div class="input-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  模板变量
                  <span class="text-xs text-gray-500">(支持 "|" 分隔或 JSON 格式)</span>
                </label>
                <el-input
                  v-model="templateVariables"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 15 }"
                  placeholder="方式1 - 用 | 分隔按顺序填入：&#10;写实|猫咪|毛发细腻&#10;&#10;方式2 - JSON格式：&#10;[&#123;&quot;style&quot;: &quot;写实&quot;, &quot;subject&quot;: &quot;猫咪&quot;, &quot;details&quot;: &quot;毛发细腻&quot;&#125;]"
                  @input="updateFinalPrompt"
                  class="resizable-textarea variables-textarea"
                />
              </div>

              <!-- 最终提示词预览 -->
              <div class="input-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">最终提示词预览</label>
                <el-input
                  :model-value="previewPrompt"
                  type="textarea"
                  :autosize="{ minRows: 3, maxRows: 12 }"
                  readonly
                  placeholder="最终提示词将在这里显示..."
                  class="resizable-textarea preview-textarea bg-gray-50"
                />
              </div>
            </div>
          </div>
          
          <!-- 生成控制卡片 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">生成控制</h2>
            
            <div class="space-y-4">
              <div v-if="isGenerating || isBatchGenerating" class="py-4">
                <div class="mb-2">
                  <span class="text-sm text-gray-600">{{ isBatchGenerating ? '批量生成中...' : '生成中...' }}</span>
                  <span class="text-sm text-gray-500 ml-2">{{ generationProgress }}%</span>
                </div>
                <el-progress 
                  :percentage="generationProgress" 
                  :stroke-width="8"
                  status="success"
                />
              </div>
              
              <!-- 并发数量和生成按钮组 -->
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-2">
                  <label class="text-sm font-medium text-gray-700 whitespace-nowrap">并发数量:</label>
                  <el-select v-model="concurrency" size="small" style="width: 80px;">
                    <el-option label="1" :value="1" />
                    <el-option label="2" :value="2" />
                    <el-option label="3" :value="3" />
                  </el-select>
                </div>
                
                <div class="flex space-x-2 flex-1">
                  <el-button 
                type="primary" 
                size="default"
                :loading="isGenerating && !isBatchGenerating"
                :disabled="!canGenerateSingle"
                @click="generateSingleImage"
                class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                style="width: 100px; height: 40px;"
              >
                <template #icon>
                  <el-icon><Picture /></el-icon>
                </template>
                生成单图
              </el-button>
                  
                  <el-button 
                type="success" 
                size="default"
                :loading="isBatchGenerating"
                :disabled="!canBatchGenerate"
                @click="startBatchGeneration"
                style="width: 100px; height: 40px;"
              >
                <template #icon>
                  <el-icon><Picture /></el-icon>
                </template>
                批量生成
              </el-button>
                  
                  <el-button 
                type="danger" 
                size="default"
                :disabled="!canStop"
                @click="stopGeneration"
                style="width: 80px; height: 40px;"
              >
                <template #icon>
                  <el-icon><Close /></el-icon>
                </template>
                停止
              </el-button>
                  
                  <el-button 
                type="warning" 
                size="default"
                @click="clearTemplate"
                :disabled="!promptTemplate && !templateVariables"
                style="width: 80px; height: 40px;"
              >
                <template #icon>
                  <el-icon><Delete /></el-icon>
                </template>
                清空
              </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：预览区域 -->
        <div class="space-y-6">
          <!-- 提示词状态 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">提示词状态</h3>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">变量队列:</span>
                <span class="text-sm font-medium">{{ variableQueueCount }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">生成队列:</span>
                <span class="text-sm font-medium">{{ generationQueueCount }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">错误日志:</span>
                <button 
                  @click="$router.push('/error-logs')"
                  class="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline transition-colors cursor-pointer"
                  :disabled="errorLogCount === 0"
                >
                  {{ errorLogCount }}
                </button>
              </div>
            </div>
          </div>

          <!-- 最近生成的图像 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">最近生成</h3>
            
            <div v-if="recentImages.length > 0" class="space-y-3">
              <div 
                v-for="image in recentImages.slice(0, 3)" 
                :key="image.id"
                class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                @click="viewImage(image)"
              >
                <img 
                  :src="getImageUrl(image.image_path)" 
                  :alt="image.final_prompt"
                  class="w-12 h-12 object-cover rounded-md"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ image.final_prompt }}</p>
                  <p class="text-xs text-gray-500">{{ formatTime(image.created_at) }}</p>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <el-icon class="text-4xl text-gray-300 mb-2"><Picture /></el-icon>
              <p class="text-sm text-gray-500">暂无生成记录</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Close, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const promptTemplate = ref('')
const templateVariables = ref('')
const concurrency = ref(1)
const isGenerating = ref(false)
const isBatchGenerating = ref(false)
const generationProgress = ref(0)
const recentImages = ref([])
const variableQueue = ref([])
const generationQueue = ref([])
const batchGenerationTimer = ref(null)
const errorLogCount = ref(0)

// 变量替换函数
const replaceVariables = (template: string, variables: string) => {
  let result = template
  
  if (!variables.trim()) {
    return result
  }
  
  try {
    // 尝试解析为JSON
    const jsonVars = JSON.parse(variables)
    if (Array.isArray(jsonVars)) {
      // JSON数组格式，返回多个结果
      return jsonVars.map(item => {
        let tempResult = template
        if (typeof item === 'object') {
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
            tempResult = tempResult.replace(regex, item[key])
          })
        }
        return tempResult
      })
    } else if (typeof jsonVars === 'object') {
      // JSON对象格式
      Object.keys(jsonVars).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
        result = result.replace(regex, jsonVars[key])
      })
    }
  } catch (e) {
    // 不是JSON格式，按"|"分隔处理
    const values = variables.split('|').map(v => v.trim())
    const placeholders = template.match(/\$\{[^}]+\}/g) || []
    
    placeholders.forEach((placeholder, index) => {
      if (index < values.length) {
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), values[index])
      }
    })
  }
  
  return result
}

// 解析模板变量为数组
const parseVariables = () => {
  if (!templateVariables.value.trim()) {
    return []
  }
  
  try {
    // 尝试解析为JSON
    const jsonVars = JSON.parse(templateVariables.value)
    if (Array.isArray(jsonVars)) {
      return jsonVars
    } else if (typeof jsonVars === 'object') {
      return [jsonVars]
    }
  } catch (e) {
    // 不是JSON格式，按行分割，每行按"|"分隔
    const lines = templateVariables.value.split('\n').filter(line => line.trim())
    return lines.map(line => {
      const values = line.split('|').map(v => v.trim())
      const placeholders = (promptTemplate.value.match(/\$\{[^}]+\}/g) || []).map(p => p.slice(2, -1))
      const obj = {}
      placeholders.forEach((key, index) => {
        if (index < values.length) {
          obj[key] = values[index]
        }
      })
      return obj
    })
  }
  
  return []
}

// 计算最终提示词列表
const finalPrompts = computed(() => {
  const prompts = []
  
  if (!promptTemplate.value.trim()) {
    return prompts
  }
  
  const variables = parseVariables()
  
  if (variables.length > 0) {
    variables.forEach(varObj => {
      let result = promptTemplate.value
      Object.keys(varObj).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
        result = result.replace(regex, varObj[key])
      })
      if (result.trim()) {
        prompts.push(result.trim())
      }
    })
  } else {
    // 没有变量，直接使用模板
    if (promptTemplate.value.trim()) {
      prompts.push(promptTemplate.value.trim())
    }
  }
  
  return prompts
})

// 预览提示词（只显示第一行）
const previewPrompt = computed(() => {
  return finalPrompts.value.length > 0 ? finalPrompts.value[0] : ''
})

// 变量队列数量
const variableQueueCount = computed(() => {
  return variableQueue.value.length
})

// 生成队列数量
const generationQueueCount = computed(() => {
  return generationQueue.value.length
})

// 检查模板中是否包含变量
const hasVariables = computed(() => {
  return /\$\{[^}]+\}/.test(promptTemplate.value)
})

// 是否可以生成单图
const canGenerateSingle = computed(() => {
  if (!promptTemplate.value.trim()) {
    return false
  }
  
  if (hasVariables.value) {
    return parseVariables().length > 0
  }
  
  return true
})

// 是否可以批量生成
const canBatchGenerate = computed(() => {
  if (!promptTemplate.value.trim()) {
    return false
  }
  
  if (hasVariables.value) {
    return parseVariables().length > 1
  }
  
  return false
})

// 是否可以停止
const canStop = computed(() => {
  return isBatchGenerating.value && variableQueue.value.length > 0
})

// 更新最终提示词
const updateFinalPrompt = () => {
  // 更新变量队列
  variableQueue.value = parseVariables()
}

// 验证提示词
const validatePrompt = () => {
  if (!promptTemplate.value.trim()) {
    ElMessage.error('请输入提示词模板')
    return false
  }
  
  if (hasVariables.value && parseVariables().length === 0) {
    ElMessage.error('提示词模板包含变量，请提供模板变量')
    return false
  }
  
  return true
}

// 生成单图
const generateSingleImage = async () => {
  if (!validatePrompt()) {
    return
  }
  
  if (!canGenerateSingle.value) {
    ElMessage.error('当前条件不允许生成单图')
    return
  }

  isGenerating.value = true
  generationProgress.value = 0

  try {
    // 获取第一行变量数据
    const variables = parseVariables()
    let singleVariableData = ''
    
    if (variables.length > 0) {
      // 仅使用第一行数据
      singleVariableData = JSON.stringify([variables[0]])
    }
    
    const response = await axios.post('http://localhost:3002/api/images/generate', {
      promptTemplate: promptTemplate.value,
      templateVariables: singleVariableData || templateVariables.value,
      concurrency: 1,
      singleGeneration: true
    })

    // 检查响应状态和数据
    if (response.status >= 200 && response.status < 300 && response.data && response.data.success) {
      ElMessage.success('图像生成成功')
      
      // 消费第一行变量数据并删除
      if (variableQueue.value.length > 0) {
        variableQueue.value.shift()
        updateTemplateVariables()
      }
      
      // 刷新最近图像列表
      await loadRecentImages()
      
      // 跳转到查看页面
      if (response.data.results && response.data.results.length > 0) {
        router.push(`/image/${response.data.results[0].id}`)
      }
    } else {
      // 显示服务器返回的错误信息
      const errorMsg = response.data?.message || response.data?.error || '图像生成失败'
      ElMessage.error(`生成失败: ${errorMsg}`)
    }
  } catch (error) {
    console.error('Generation error:', error)
    
    // 显示详细的错误信息
    let errorMessage = '图像生成失败'
    
    if (error.response) {
      // HTTP错误响应
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        errorMessage = '生成失败: 未授权访问 (401)'
      } else if (status === 403) {
        errorMessage = '生成失败: 访问被禁止 (403)'
      } else if (status === 404) {
        errorMessage = '生成失败: 服务未找到 (404)'
      } else if (status === 500) {
        errorMessage = '生成失败: 服务器内部错误 (500)'
      } else if (data) {
        if (data.message) {
          errorMessage = `生成失败: ${data.message} (${status})`
        } else if (data.error) {
          errorMessage = `生成失败: ${data.error} (${status})`
        } else if (typeof data === 'string') {
          errorMessage = `生成失败: ${data} (${status})`
        } else {
          errorMessage = `生成失败: HTTP ${status} 错误`
        }
      } else {
        errorMessage = `生成失败: HTTP ${status} 错误`
      }
    } else if (error.request) {
      // 网络错误
      errorMessage = '生成失败: 网络连接错误，请检查服务器是否运行'
    } else if (error.message) {
      errorMessage = `生成失败: ${error.message}`
    }
    
    ElMessage.error(errorMessage)
    
    // 更新错误日志数量
    await loadErrorLogCount()
  } finally {
    isGenerating.value = false
    generationProgress.value = 0
  }
}

// 开始批量生成
const startBatchGeneration = async () => {
  if (!validatePrompt()) {
    return
  }
  
  if (!canBatchGenerate.value) {
    ElMessage.error('当前条件不允许批量生成')
    return
  }

  isBatchGenerating.value = true
  variableQueue.value = [...parseVariables()]
  
  ElMessage.success(`开始批量生成，共 ${variableQueue.value.length} 个任务`)
  
  // 开始处理队列
  processBatchGeneration()
}

// 处理批量生成队列
const processBatchGeneration = async () => {
  if (!isBatchGenerating.value || variableQueue.value.length === 0) {
    isBatchGenerating.value = false
    generationProgress.value = 0
    ElMessage.success('批量生成完成')
    await loadRecentImages()
    return
  }
  
  // 控制并发数量
  while (generationQueue.value.length < concurrency.value && variableQueue.value.length > 0) {
    const variables = variableQueue.value.shift()
    generateSingleFromQueue(variables)
  }
  
  // 更新进度
  const totalTasks = parseVariables().length
  const remainingTasks = variableQueue.value.length + generationQueue.value.length
  const completedTasks = Math.max(0, totalTasks - remainingTasks)
  generationProgress.value = totalTasks > 0 ? Math.min(100, Math.max(0, Math.round((completedTasks / totalTasks) * 100))) : 0
  
  // 更新模板变量显示
  updateTemplateVariables()
  
  // 继续处理
  batchGenerationTimer.value = setTimeout(processBatchGeneration, 1000)
}

// 从队列生成单个图像
const generateSingleFromQueue = async (variables) => {
  const taskId = Date.now() + Math.random()
  generationQueue.value.push(taskId)
  
  try {
    let prompt = promptTemplate.value
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      prompt = prompt.replace(regex, variables[key])
    })
    
    const response = await axios.post('http://localhost:3002/api/images/generate', {
      promptTemplate: promptTemplate.value,
      templateVariables: JSON.stringify([variables]),
      concurrency: 1,
      singleGeneration: true
    })

    // 检查响应状态和数据
    if (response.status >= 200 && response.status < 300 && response.data && response.data.success) {
      console.log('批量生成：单个任务完成')
    } else {
      // 记录批量生成中的错误
      const errorMsg = response.data?.message || response.data?.error || '生成失败'
      console.error('批量生成错误:', errorMsg)
    }
  } catch (error) {
    console.error('Batch generation error:', error)
    
    // 显示批量生成中的错误信息
    let errorMessage = '批量生成中的任务失败'
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        errorMessage = `批量生成任务失败: 未授权访问 (401)`
      } else if (status === 403) {
        errorMessage = `批量生成任务失败: 访问被禁止 (403)`
      } else if (status === 500) {
        errorMessage = `批量生成任务失败: 服务器内部错误 (500)`
      } else if (data) {
        if (data.message) {
          errorMessage = `批量生成任务失败: ${data.message} (${status})`
        } else if (data.error) {
          errorMessage = `批量生成任务失败: ${data.error} (${status})`
        } else {
          errorMessage = `批量生成任务失败: HTTP ${status} 错误`
        }
      } else {
        errorMessage = `批量生成任务失败: HTTP ${status} 错误`
      }
    } else if (error.request) {
      errorMessage = '批量生成任务失败: 网络连接错误'
    } else if (error.message) {
      errorMessage = `批量生成任务失败: ${error.message}`
    }
    
    console.error('批量生成任务错误:', errorMessage)
    
    // 更新错误日志数量
    await loadErrorLogCount()
  } finally {
    // 从生成队列中移除
    const index = generationQueue.value.indexOf(taskId)
    if (index > -1) {
      generationQueue.value.splice(index, 1)
    }
  }
}

// 停止生成
const stopGeneration = () => {
  if (isBatchGenerating.value) {
    isBatchGenerating.value = false
    variableQueue.value = []
    generationQueue.value = []
    
    if (batchGenerationTimer.value) {
      clearTimeout(batchGenerationTimer.value)
      batchGenerationTimer.value = null
    }
    
    ElMessage.info('批量生成已停止')
    updateTemplateVariables()
  }
}

// 更新模板变量显示
const updateTemplateVariables = () => {
  if (variableQueue.value.length === 0) {
    templateVariables.value = ''
    return
  }
  
  // 将剩余变量重新格式化为字符串
  try {
    templateVariables.value = JSON.stringify(variableQueue.value, null, 2)
  } catch (e) {
    // 如果JSON格式化失败，使用|分隔格式
    const lines = variableQueue.value.map(varObj => {
      const placeholders = (promptTemplate.value.match(/\$\{[^}]+\}/g) || []).map(p => p.slice(2, -1))
      return placeholders.map(key => varObj[key] || '').join('|')
    })
    templateVariables.value = lines.join('\n')
  }
}

// 加载最近图像
const loadRecentImages = async () => {
  try {
    const response = await axios.get('http://localhost:3002/api/images?limit=8')
    if (response.data.success) {
      recentImages.value = response.data.data
    }
  } catch (error) {
    console.error('Load recent images error:', error)
  }
}



// 查看图像
const viewImage = (image: any) => {
  router.push(`/image/${image.id}`)
}

// 获取图像URL
const getImageUrl = (imagePath: string) => {
  return `http://localhost:3002${imagePath}`
}

// 格式化时间
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 加载错误日志数量
const loadErrorLogCount = async () => {
  try {
    const response = await axios.get('http://localhost:3002/api/error-logs/count')
    if (response.data.success) {
      errorLogCount.value = response.data.count
    }
  } catch (error) {
    console.error('Load error log count error:', error)
  }
}

// 监听模板数据变化，自动保存
watch([promptTemplate, templateVariables], () => {
  // 防抖保存，避免频繁写入
  if (saveTemplateTimer.value) {
    clearTimeout(saveTemplateTimer.value)
  }
  saveTemplateTimer.value = setTimeout(() => {
    if (promptTemplate.value || templateVariables.value) {
      saveTemplate()
    }
  }, 1000)
}, { deep: true })

// 保存模板的定时器
const saveTemplateTimer = ref(null)

// 页面卸载前保存数据
const handleBeforeUnload = () => {
  if (promptTemplate.value || templateVariables.value) {
    saveTemplate()
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadRecentImages()
  
  // 加载模板数据
  loadTemplate()
  
  // 初始化变量队列
  updateFinalPrompt()
  
  // 加载错误日志数量
  loadErrorLogCount()
  
  // 添加页面卸载监听器
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 组件卸载时清理
onUnmounted(() => {
  // 保存当前模板数据
  if (promptTemplate.value || templateVariables.value) {
    saveTemplate()
  }
  
  // 清理定时器
  if (saveTemplateTimer.value) {
    clearTimeout(saveTemplateTimer.value)
  }
  
  // 移除页面卸载监听器
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 清除模板
const clearTemplate = () => {
  promptTemplate.value = ''
  templateVariables.value = ''
  variableQueue.value = []
  
  // 清除localStorage中的数据
  localStorage.removeItem('templateData')
  
  ElMessage.success('模板已清除')
}

// 保存模板数据到localStorage
const saveTemplate = () => {
  const templateData = {
    promptTemplate: promptTemplate.value,
    templateVariables: templateVariables.value,
    timestamp: Date.now()
  }
  localStorage.setItem('templateData', JSON.stringify(templateData))
}

// 加载模板数据
const loadTemplate = () => {
  // 优先从sessionStorage加载（用于错误日志页面的模板传递）
  const templateData = sessionStorage.getItem('promptTemplate')
  if (templateData) {
    try {
      const template = JSON.parse(templateData)
      promptTemplate.value = template.promptTemplate || ''
      templateVariables.value = template.templateVariables || ''
      
      // 只在成功加载后清除sessionStorage数据
      sessionStorage.removeItem('promptTemplate')
      
      ElMessage.success('模板已加载')
      return
    } catch (error) {
      console.error('Load template error:', error)
    }
  }
  
  // 从localStorage恢复模板数据（持久化存储）
  const persistentData = localStorage.getItem('templateData')
  if (persistentData) {
    try {
      const template = JSON.parse(persistentData)
      promptTemplate.value = template.promptTemplate || ''
      templateVariables.value = template.templateVariables || ''
      
      console.log('已从localStorage恢复模板数据')
    } catch (error) {
      console.error('Parse persistent template data error:', error)
      // 如果数据损坏，清除它
      localStorage.removeItem('templateData')
    }
  }
  
  // 兼容旧版本：从sessionStorage恢复模板数据
  const savedData = sessionStorage.getItem('templateData')
  if (savedData && !persistentData) {
    try {
      const template = JSON.parse(savedData)
      promptTemplate.value = template.promptTemplate || ''
      templateVariables.value = template.templateVariables || ''
      
      // 迁移到localStorage
      saveTemplate()
      
      // 清除sessionStorage中的数据
      sessionStorage.removeItem('templateData')
      
      console.log('已迁移模板数据到localStorage')
    } catch (error) {
      console.error('Parse template data error:', error)
    }
  }
}
</script>

<style scoped>
.prompt-builder-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.input-group {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.resizable-textarea {
  width: 100%;
  flex: 1;
}

.resizable-textarea :deep(.el-textarea__inner) {
  resize: vertical;
  min-height: auto;
  height: auto;
  transition: all 0.3s ease;
}

.variables-textarea :deep(.el-textarea__inner) {
  min-height: auto;
  height: auto;
}

.preview-textarea :deep(.el-textarea__inner) {
  min-height: auto;
  height: auto;
  background-color: #f9fafb;
}

/* 响应式流式布局 */
@media (min-width: 768px) {
  .prompt-builder-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .prompt-builder-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .input-group {
    flex: 1;
    min-width: 0;
  }
}

/* 拖拽调整大小时的视觉反馈 */
.resizable-textarea :deep(.el-textarea__inner):hover {
  border-color: #409eff;
}

.resizable-textarea :deep(.el-textarea__inner):focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
</style>
