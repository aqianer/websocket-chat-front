import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: true
    }
  },
  {
    path: '/order-detail/:phoneId',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      requiresAuth: true
    }
  },
  {
    path: '/my-knowledge-base/upload',
    name: 'FileUpload',
    component: () => import('@/views/FileUpload.vue'),
    meta: {
      title: '文件上传',
      requiresAuth: true,
      requiresSuperAdmin: true
    }
  },
  {
    path: '/knowledge-base/:id',
    name: 'KnowledgeBaseDetail',
    component: () => import('@/views/KnowledgeBaseDetail.vue'),
    meta: {
      title: '知识库详情',
      requiresAuth: true
    }
  },
  {
    path: '/document-upload-wizard/:kbId?',
    name: 'DocumentUploadWizard',
    component: () => import('@/views/DocumentUploadWizard.vue'),
    meta: {
      title: '文档上传向导',
      requiresAuth: true
    }
  },
  {
    path: '/document-list',
    name: 'DocumentList',
    component: () => import('@/views/DocumentList.vue'),
    meta: {
      title: '文档列表',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresSuperAdmin && !userStore.isSuperAdmin()) {
    ElMessage.warning('您没有权限访问该页面')
    next('/home')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/home')
  } else {
    next()
  }
})

export default router
