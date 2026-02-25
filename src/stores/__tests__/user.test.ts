import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/types'

describe('权限管理系统测试', () => {
  let userStore: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
  })

  describe('超级管理员识别', () => {
    it('应该正确识别超级管理员', () => {
      const superAdminInfo: UserInfo = {
        username: 'admin',
        role: '超级管理员',
        permissions: ['user:manage', 'file:upload']
      }
      userStore.setUserInfo(superAdminInfo)
      
      expect(userStore.isSuperAdmin()).toBe(true)
    })

    it('应该正确识别非超级管理员', () => {
      const normalUserInfo: UserInfo = {
        username: 'user1',
        role: '普通用户',
        permissions: ['user:query']
      }
      userStore.setUserInfo(normalUserInfo)
      
      expect(userStore.isSuperAdmin()).toBe(false)
    })

    it('应该正确识别管理员', () => {
      const adminInfo: UserInfo = {
        username: 'manager',
        role: '管理员',
        permissions: ['user:manage']
      }
      userStore.setUserInfo(adminInfo)
      
      expect(userStore.isSuperAdmin()).toBe(false)
    })

    it('应该正确识别VIP用户', () => {
      const vipUserInfo: UserInfo = {
        username: 'vip',
        role: 'VIP用户',
        permissions: ['user:query']
      }
      userStore.setUserInfo(vipUserInfo)
      
      expect(userStore.isSuperAdmin()).toBe(false)
    })
  })

  describe('权限检查', () => {
    it('应该正确检查用户权限', () => {
      const userInfo: UserInfo = {
        username: 'admin',
        role: '超级管理员',
        permissions: ['user:manage', 'file:upload', 'file:delete']
      }
      userStore.setUserInfo(userInfo)
      
      expect(userStore.hasPermission('user:manage')).toBe(true)
      expect(userStore.hasPermission('file:upload')).toBe(true)
      expect(userStore.hasPermission('file:delete')).toBe(true)
      expect(userStore.hasPermission('unknown:permission')).toBe(false)
    })

    it('应该正确检查多个权限', () => {
      const userInfo: UserInfo = {
        username: 'admin',
        role: '超级管理员',
        permissions: ['user:manage', 'file:upload']
      }
      userStore.setUserInfo(userInfo)
      
      expect(userStore.hasAnyPermission(['user:manage', 'file:upload'])).toBe(true)
      expect(userStore.hasAnyPermission(['user:manage', 'unknown:permission'])).toBe(true)
      expect(userStore.hasAnyPermission(['unknown:permission1', 'unknown:permission2'])).toBe(false)
    })

    it('无权限时应该返回false', () => {
      const userInfo: UserInfo = {
        username: 'user1',
        role: '普通用户',
        permissions: ['user:query']
      }
      userStore.setUserInfo(userInfo)
      
      expect(userStore.hasPermission('user:manage')).toBe(false)
      expect(userStore.hasPermission('file:upload')).toBe(false)
    })
  })

  describe('角色切换', () => {
    it('应该能够切换用户角色', () => {
      const superAdminInfo: UserInfo = {
        username: 'admin',
        role: '超级管理员',
        permissions: ['user:manage', 'file:upload']
      }
      userStore.setUserInfo(superAdminInfo)
      expect(userStore.isSuperAdmin()).toBe(true)
      
      const normalUserInfo: UserInfo = {
        username: 'user1',
        role: '普通用户',
        permissions: ['user:query']
      }
      userStore.setUserInfo(normalUserInfo)
      expect(userStore.isSuperAdmin()).toBe(false)
    })
  })

  describe('登录状态', () => {
    it('未登录时应该返回false', () => {
      userStore.logout()
      
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('登录后应该返回true', () => {
      userStore.setToken('test-token')
      const userInfo: UserInfo = {
        username: 'admin',
        role: '超级管理员',
        permissions: ['user:manage']
      }
      userStore.setUserInfo(userInfo)
      
      expect(userStore.isLoggedIn).toBe(true)
    })
  })
})
