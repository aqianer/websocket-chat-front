import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Home from '@/views/Home.vue'

const { getStats } = vi.hoisted(() => ({
  getStats: vi.fn()
}))

const { getList, getConsumption, getPackageUsage, query } = vi.hoisted(() => ({
  getList: vi.fn(),
  getConsumption: vi.fn(),
  getPackageUsage: vi.fn(),
  query: vi.fn()
}))

const { getList: getRechargeList, audit } = vi.hoisted(() => ({
  getList: vi.fn(),
  audit: vi.fn()
}))

vi.mock('@/api', () => ({
  dashboardApi: {
    getStats
  },
  userApi: {
    getList,
    getConsumption,
    getPackageUsage,
    query
  },
  rechargeApi: {
    getList: getRechargeList,
    audit
  }
}))

describe('Home.vue - 用户管理功能测试', () => {
  let router: any
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/order-detail/:phoneId', name: 'OrderDetail', component: { template: '<div>OrderDetail</div>' } }
      ]
    })

    getStats.mockReset()
    getList.mockReset()
    getConsumption.mockReset()
    getPackageUsage.mockReset()
    query.mockReset()
    getRechargeList.mockReset()
    audit.mockReset()
  })

  describe('用户管理 - 基础信息选项卡', () => {
    it('应该显示用户管理表格', async () => {
      getList.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { 
              id: 1, 
              username: 'user1', 
              role: '普通用户', 
              status: '正常',
              phone: '13800138001',
              packageName: '畅享套餐99元',
              accountStatus: '正常',
              lastRechargeTime: '2024-01-15 10:30:00',
              phones: [
                { phone: '13800138001', phoneId: '13800138001' },
                { phone: '13800138002', phoneId: '13800138002' }
              ]
            }
          ],
          total: 1
        }
      })
      getConsumption.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getPackageUsage.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      expect((wrapper.vm as any).userTableData).toBeDefined()
      expect((wrapper.vm as any).userTableData.length).toBeGreaterThan(0)
    })

    it('应该显示新增的数据列（手机号、套餐名称、账户状态、最近充值时间）', async () => {
      getList.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { 
              id: 1, 
              username: 'user1', 
              role: '普通用户', 
              status: '正常',
              phone: '13800138001',
              packageName: '畅享套餐99元',
              accountStatus: '正常',
              lastRechargeTime: '2024-01-15 10:30:00',
              phones: [
                { phone: '13800138001', phoneId: '13800138001' },
                { phone: '13800138002', phoneId: '13800138002' }
              ]
            }
          ],
          total: 1
        }
      })
      getConsumption.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getPackageUsage.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      const firstUser = (wrapper.vm as any).userTableData[0]
      expect(firstUser.phone).toBeDefined()
      expect(firstUser.packageName).toBeDefined()
      expect(firstUser.accountStatus).toBeDefined()
      expect(firstUser.lastRechargeTime).toBeDefined()
    })

    it('应该正确显示账户状态标签颜色', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      
      expect((wrapper.vm as any).getAccountStatusType('正常')).toBe('success')
      expect((wrapper.vm as any).getAccountStatusType('冻结')).toBe('danger')
      expect((wrapper.vm as any).getAccountStatusType('欠费')).toBe('warning')
      expect((wrapper.vm as any).getAccountStatusType('注销')).toBe('info')
    })
  })

  describe('用户管理 - 选项卡导航', () => {
    it('应该有三个选项卡：基础信息、消费明细、套餐资源', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      
      expect((wrapper.vm as any).userManageTab).toBe('basic')
    })

    it('应该能够切换选项卡', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      
      ;(wrapper.vm as any).handleUserManageTabChange('consumption')
      expect((wrapper.vm as any).userManageTab).toBe('consumption')
      
      ;(wrapper.vm as any).handleUserManageTabChange('package')
      expect((wrapper.vm as any).userManageTab).toBe('package')
    })

    it('消费明细选项卡应该显示消费数据', async () => {
      getList.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getConsumption.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { id: 1, username: 'user1', phone: '13800138001', amount: 58.00, type: '流量包', time: '2024-01-15 10:30:00', description: '购买500MB流量包' }
          ],
          total: 1
        }
      })
      getPackageUsage.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      ;(wrapper.vm as any).userManageTab = 'consumption'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      expect((wrapper.vm as any).userConsumptionData).toBeDefined()
      expect((wrapper.vm as any).userConsumptionData.length).toBeGreaterThan(0)
    })

    it('套餐资源选项卡应该显示套餐使用数据', async () => {
      getList.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getConsumption.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getPackageUsage.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { 
              username: 'user1', 
              phone: '13800138001',
              packageName: '畅享套餐99元',
              totalData: 20, 
              usedData: 8.5, 
              dataPercentage: 43,
              totalVoice: 500, 
              usedVoice: 120, 
              voicePercentage: 24,
              totalSms: 100, 
              usedSms: 35, 
              smsPercentage: 35
            }
          ],
          total: 1
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      ;(wrapper.vm as any).userManageTab = 'package'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      expect((wrapper.vm as any).userPackageData).toBeDefined()
      expect((wrapper.vm as any).userPackageData.length).toBeGreaterThan(0)
    })
  })

  describe('用户管理 - 用户名点击交互', () => {
    it('用户应该有多个关联手机号', async () => {
      getList.mockResolvedValue({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { 
              id: 1, 
              username: 'user1', 
              role: '普通用户', 
              status: '正常',
              phone: '13800138001',
              packageName: '畅享套餐99元',
              accountStatus: '正常',
              lastRechargeTime: '2024-01-15 10:30:00',
              phones: [
                { phone: '13800138001', phoneId: '13800138001' },
                { phone: '13800138002', phoneId: '13800138002' }
              ]
            }
          ],
          total: 1
        }
      })
      getConsumption.mockResolvedValue({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getPackageUsage.mockResolvedValue({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      const firstUser = (wrapper.vm as any).userTableData[0]
      expect(firstUser.phones).toBeDefined()
      expect(firstUser.phones.length).toBeGreaterThan(0)
    })

    it('点击手机号应该跳转到订单详情页', async () => {
      getList.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [
            { 
              id: 1, 
              username: 'user1', 
              role: '普通用户', 
              status: '正常',
              phone: '13800138001',
              packageName: '畅享套餐99元',
              accountStatus: '正常',
              lastRechargeTime: '2024-01-15 10:30:00',
              phones: [
                { phone: '13800138001', phoneId: '13800138001' },
                { phone: '13800138002', phoneId: '13800138002' }
              ]
            }
          ],
          total: 1
        }
      })
      getConsumption.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })
      getPackageUsage.mockResolvedValueOnce({
        code: 200,
        msg: '获取成功',
        data: {
          list: [],
          total: 0
        }
      })

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).activeMenu = 'user-manage'
      await wrapper.vm.$nextTick()
      await (wrapper.vm as any).loadUserData()
      
      const firstUser = (wrapper.vm as any).userTableData[0]
      const phone = firstUser.phones[0].phone
      
      ;(wrapper.vm as any).handleUsernameClick(firstUser, phone)
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(router.currentRoute.value.name).toBe('OrderDetail')
      expect(router.currentRoute.value.params).toEqual({ phoneId: phone })
    })
  })

  describe('用户管理 - 进度条颜色', () => {
    it('应该根据使用率返回正确的颜色', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect((wrapper.vm as any).getProgressColor(95)).toBe('#f56c6c')
      expect((wrapper.vm as any).getProgressColor(80)).toBe('#e6a23c')
      expect((wrapper.vm as any).getProgressColor(50)).toBe('#67c23a')
    })
  })

  describe('用户管理 - 消费类型标签', () => {
    it('应该根据消费类型返回正确的标签类型', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect((wrapper.vm as any).getConsumptionType('流量包')).toBe('primary')
      expect((wrapper.vm as any).getConsumptionType('通话费')).toBe('success')
      expect((wrapper.vm as any).getConsumptionType('短信费')).toBe('warning')
      expect((wrapper.vm as any).getConsumptionType('套餐费')).toBe('info')
    })
  })
})
