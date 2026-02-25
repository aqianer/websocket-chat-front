<template>
  <div class="order-detail-container">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <div class="header-content">
          <span class="title">订单详情</span>
          <el-tag type="primary" size="large">{{ phoneId }}</el-tag>
        </div>
      </template>
    </el-page-header>

    <el-card class="detail-card">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="消费记录" name="consumption">
          <el-table :data="consumptionData" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="消费类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getConsumptionType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="time" label="消费时间" width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="套餐使用情况" name="package">
          <div class="package-usage">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-descriptions title="当前套餐" :column="3" border>
                  <el-descriptions-item label="套餐名称">{{ packageUsage.packageName }}</el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag type="success">正常使用中</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="手机号">{{ phoneId }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="resource-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><DataLine /></el-icon>
                      <span>流量使用</span>
                    </div>
                  </template>
                  <div class="resource-content">
                    <el-progress
                      type="circle"
                      :percentage="getDataPercentage()"
                      :color="getProgressColor(getDataPercentage())"
                      :width="120"
                    >
                      <template #default>
                        <span class="progress-text">{{ packageUsage.usedData }}GB</span>
                        <span class="progress-total">/ {{ packageUsage.totalData }}GB</span>
                      </template>
                    </el-progress>
                    <div class="resource-info">
                      <p>剩余流量: {{ (packageUsage.totalData - packageUsage.usedData).toFixed(2) }}GB</p>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="resource-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Phone /></el-icon>
                      <span>语音通话</span>
                    </div>
                  </template>
                  <div class="resource-content">
                    <el-progress
                      type="circle"
                      :percentage="getVoicePercentage()"
                      :color="getProgressColor(getVoicePercentage())"
                      :width="120"
                    >
                      <template #default>
                        <span class="progress-text">{{ packageUsage.usedVoice }}分钟</span>
                        <span class="progress-total">/ {{ packageUsage.totalVoice }}分钟</span>
                      </template>
                    </el-progress>
                    <div class="resource-info">
                      <p>剩余通话: {{ packageUsage.totalVoice - packageUsage.usedVoice }}分钟</p>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="resource-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><ChatDotRound /></el-icon>
                      <span>短信使用</span>
                    </div>
                  </template>
                  <div class="resource-content">
                    <el-progress
                      type="circle"
                      :percentage="getSmsPercentage()"
                      :color="getProgressColor(getSmsPercentage())"
                      :width="120"
                    >
                      <template #default>
                        <span class="progress-text">{{ packageUsage.usedSms }}条</span>
                        <span class="progress-total">/ {{ packageUsage.totalSms }}条</span>
                      </template>
                    </el-progress>
                    <div class="resource-info">
                      <p>剩余短信: {{ packageUsage.totalSms - packageUsage.usedSms }}条</p>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="充值记录" name="recharge">
          <el-table :data="rechargeData" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column prop="amount" label="充值金额" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="method" label="充值方式" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getRechargeStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="充值时间" width="180" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataLine, Phone, ChatDotRound } from '@element-plus/icons-vue'
import type { ConsumptionRecord, PackageUsage, RechargeRecord } from '@/types'

const route = useRoute()
const router = useRouter()

const phoneId = ref((route.params.phoneId as string) || '13800138001')
const activeTab = ref('consumption')

const consumptionData = ref<ConsumptionRecord[]>([
  { id: 1, phone: phoneId.value, amount: 58.00, type: '流量包', time: '2024-01-15 10:30:00', description: '购买500MB流量包' },
  { id: 2, phone: phoneId.value, amount: 15.50, type: '通话费', time: '2024-01-14 15:20:00', description: '国内长途通话' },
  { id: 3, phone: phoneId.value, amount: 2.00, type: '短信费', time: '2024-01-13 09:15:00', description: '发送短信10条' },
  { id: 4, phone: phoneId.value, amount: 99.00, type: '套餐费', time: '2024-01-01 00:00:00', description: '月度套餐扣费' }
])

const packageUsage = ref<PackageUsage>({
  packageName: '畅享套餐99元',
  totalData: 20,
  usedData: 8.5,
  totalVoice: 500,
  usedVoice: 120,
  totalSms: 100,
  usedSms: 35
})

const rechargeData = ref<RechargeRecord[]>([
  { id: 1, phone: phoneId.value, amount: 100.00, time: '2024-01-10 14:30:00', status: '成功', method: '微信支付' },
  { id: 2, phone: phoneId.value, amount: 50.00, time: '2024-01-05 09:20:00', status: '成功', method: '支付宝' },
  { id: 3, phone: phoneId.value, amount: 200.00, time: '2023-12-28 16:45:00', status: '成功', method: '银行卡' }
])

const handleBack = () => {
  router.back()
}

const handleTabChange = (tabName: string) => {
  console.log('切换到选项卡:', tabName)
  activeTab.value = tabName
}

const getConsumptionType = (type: string) => {
  const typeMap: Record<string, any> = {
    '流量包': 'primary',
    '通话费': 'success',
    '短信费': 'warning',
    '套餐费': 'info'
  }
  return typeMap[type] || 'info'
}

const getRechargeStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '成功': 'success',
    '失败': 'danger',
    '处理中': 'warning'
  }
  return typeMap[status] || 'info'
}

const getDataPercentage = () => {
  return Math.round((packageUsage.value.usedData / packageUsage.value.totalData) * 100)
}

const getVoicePercentage = () => {
  return Math.round((packageUsage.value.usedVoice / packageUsage.value.totalVoice) * 100)
}

const getSmsPercentage = () => {
  return Math.round((packageUsage.value.usedSms / packageUsage.value.totalSms) * 100)
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

onMounted(() => {
  console.log('订单详情页加载, 手机号:', phoneId.value)
})
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.page-header {
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 4px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.detail-card {
  min-height: calc(100vh - 150px);
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.package-usage {
  padding: 20px 0;
}

.resource-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.resource-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.progress-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.progress-total {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.resource-info {
  margin-top: 20px;
  text-align: center;
}

.resource-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

:deep(.el-progress__text) {
  font-size: 16px !important;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>
