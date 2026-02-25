import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const permissions = computed(() => userInfo.value?.permissions || [])
  const role = computed(() => userInfo.value?.role || '')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function setUserInfo(newUserInfo: UserInfo) {
    userInfo.value = newUserInfo
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(newUserInfo))
  }

  function loadFromStorage() {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUserInfo = localStorage.getItem(USER_INFO_KEY)

    if (savedToken) {
      token.value = savedToken
    }

    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(permissionList: string[]): boolean {
    return permissionList.some(permission => hasPermission(permission))
  }

  function isSuperAdmin(): boolean {
    return role.value === '超级管理员'
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    permissions,
    role,
    setToken,
    setUserInfo,
    loadFromStorage,
    logout,
    hasPermission,
    hasAnyPermission,
    isSuperAdmin
  }
})
