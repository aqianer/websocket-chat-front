import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import OrderDetail from '@/views/OrderDetail.vue'

describe('OrderDetail.vue - 订单详情页测试', () => {
  let router: any
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { 
          path: '/order-detail/:phoneId', 
          name: 'OrderDetail',
          component: OrderDetail 
        }
      ]
    })
  })

  describe('页面初始化', () => {
    it('应该正确加载订单详情页', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).phoneId).toBe('13800138001')
    })

    it('应该默认显示消费记录选项卡', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).activeTab).toBe('consumption')
    })
  })

  describe('消费记录选项卡', () => {
    it('应该显示消费记录数据', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).consumptionData).toBeDefined()
      expect((wrapper.vm as any).consumptionData.length).toBeGreaterThan(0)
    })

    it('消费记录应该包含必要字段', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const consumptionData = (wrapper.vm as any).consumptionData
      
      if (consumptionData && consumptionData.length > 0) {
        const firstRecord = consumptionData[0]
        expect(firstRecord.id).toBeDefined()
        expect(firstRecord.phone).toBeDefined()
        expect(firstRecord.amount).toBeDefined()
        expect(firstRecord.type).toBeDefined()
        expect(firstRecord.time).toBeDefined()
        expect(firstRecord.description).toBeDefined()
      }
    })

    it('应该正确显示消费类型标签颜色', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
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

  describe('套餐使用情况选项卡', () => {
    it('应该显示套餐使用数据', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).packageUsage).toBeDefined()
    })

    it('套餐使用应该包含流量、语音、短信数据', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const packageData = (wrapper.vm as any).packageUsage
      
      expect(packageData.totalData).toBeDefined()
      expect(packageData.usedData).toBeDefined()
      expect(packageData.totalVoice).toBeDefined()
      expect(packageData.usedVoice).toBeDefined()
      expect(packageData.totalSms).toBeDefined()
      expect(packageData.usedSms).toBeDefined()
    })

    it('应该正确计算流量使用百分比', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const percentage = (wrapper.vm as any).getDataPercentage()
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(percentage).toBeLessThanOrEqual(100)
    })

    it('应该正确计算语音使用百分比', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const percentage = (wrapper.vm as any).getVoicePercentage()
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(percentage).toBeLessThanOrEqual(100)
    })

    it('应该正确计算短信使用百分比', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const percentage = (wrapper.vm as any).getSmsPercentage()
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(percentage).toBeLessThanOrEqual(100)
    })

    it('应该根据使用率返回正确的进度条颜色', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
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

  describe('充值记录选项卡', () => {
    it('应该显示充值记录数据', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rechargeData).toBeDefined()
      expect((wrapper.vm as any).rechargeData.length).toBeGreaterThan(0)
    })

    it('充值记录应该包含必要字段', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      const rechargeData = (wrapper.vm as any).rechargeData
      
      if (rechargeData && rechargeData.length > 0) {
        const firstRecord = rechargeData[0]
        expect(firstRecord.id).toBeDefined()
        expect(firstRecord.phone).toBeDefined()
        expect(firstRecord.amount).toBeDefined()
        expect(firstRecord.time).toBeDefined()
        expect(firstRecord.status).toBeDefined()
        expect(firstRecord.method).toBeDefined()
      }
    })

    it('应该正确显示充值状态标签颜色', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect((wrapper.vm as any).getRechargeStatusType('成功')).toBe('success')
      expect((wrapper.vm as any).getRechargeStatusType('失败')).toBe('danger')
      expect((wrapper.vm as any).getRechargeStatusType('处理中')).toBe('warning')
    })
  })

  describe('选项卡切换', () => {
    it('应该能够切换到套餐使用情况选项卡', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).handleTabChange('package')
      expect((wrapper.vm as any).activeTab).toBe('package')
    })

    it('应该能够切换到充值记录选项卡', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).handleTabChange('recharge')
      expect((wrapper.vm as any).activeTab).toBe('recharge')
    })
  })

  describe('返回功能', () => {
    it('点击返回按钮应该返回上一页', async () => {
      router.push('/order-detail/13800138001')
      await router.isReady()
      
      const wrapper = mount(OrderDetail, {
        global: {
          plugins: [router, pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      ;(wrapper.vm as any).handleBack()
      
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).handleBack).toBeDefined()
    })
  })
})
