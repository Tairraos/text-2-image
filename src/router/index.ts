import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import ImageDetailPage from '@/pages/ImageDetailPage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'
import ErrorLogsPage from '@/pages/ErrorLogsPage.vue'

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/image/:id',
    name: 'image-detail',
    component: ImageDetailPage,
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryPage,
  },
  {
    path: '/error-logs',
    name: 'error-logs',
    component: ErrorLogsPage,
  },

]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
