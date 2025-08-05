<template>
  <div class="relative inline-block text-left">
    <button
      @click="toggleDropdown"
      class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      <Globe class="w-4 h-4 mr-2" />
      {{ currentLanguageName }}
      <ChevronDown class="w-4 h-4 ml-2" />
    </button>
    
    <div
      v-if="isOpen"
      class="absolute right-0 z-10 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <div class="py-1">
        <button
          v-for="lang in availableLocales"
          :key="lang.code"
          @click="switchLanguage(lang.code)"
          :class="[
            'block w-full px-4 py-2 text-sm text-left transition-colors',
            locale === lang.code
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ lang.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 语言切换组件
 * 提供下拉菜单形式的语言切换功能
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Globe, ChevronDown } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { locale, setLocale, availableLocales } = useI18n()

// 下拉菜单状态
const isOpen = ref(false)

/**
 * 切换下拉菜单显示状态
 */
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

/**
 * 切换语言
 * @param {string} langCode - 语言代码
 */
const switchLanguage = (langCode: string) => {
  setLocale(langCode)
  isOpen.value = false
}

/**
 * 获取当前语言显示名称
 */
const currentLanguageName = computed(() => {
  const current = availableLocales.find(lang => lang.code === locale.value)
  return current ? current.name : '中文'
})

/**
 * 点击外部关闭下拉菜单
 * @param {Event} event - 点击事件
 */
const handleClickOutside = (event: Event) => {
  const dropdown = (event.target as Element)?.closest('.relative')
  if (!dropdown) {
    isOpen.value = false
  }
}

// 组件挂载时添加全局点击监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>