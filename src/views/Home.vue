<template>
  <div class="home-container">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1>系统首页</h1>
          <div class="user-info">
            <el-tag type="success" size="large">{{ userStore.role }}</el-tag>
            <el-button type="danger" @click="handleLogout" plain>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px" class="aside">
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            @select="handleMenuSelect"
          >
            <el-menu-item index="dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>

            <el-menu-item v-permission="'user:manage'" index="user-manage">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>

            <el-menu-item v-permission="'query:user'" index="user-query">
              <el-icon><Search /></el-icon>
              <span>用户查询</span>
            </el-menu-item>

            <el-menu-item index="recharge">
              <el-icon><Wallet /></el-icon>
              <span>充值管理</span>
            </el-menu-item>

            <el-menu-item v-if="userStore.isSuperAdmin()" index="file-upload">
              <el-icon><Upload /></el-icon>
              <span>文件上传</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="main-content">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <span>{{ currentMenuTitle }}</span>
              </div>
            </template>

            <div class="menu-content">
              <div v-loading="isLoading" v-if="activeMenu === 'dashboard'" class="dashboard">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-statistic title="总用户数" :value="dashboardStats.totalUsers" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="今日充值" :value="dashboardStats.todayRecharge" prefix="¥" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="待审核" :value="dashboardStats.pendingAudit" />
                  </el-col>
                </el-row>
              </div>

              <div v-loading="isLoading" v-if="activeMenu === 'user-manage'" class="user-manage">
                <el-tabs v-model="userManageTab" type="card" @tab-change="handleUserManageTabChange">
                  <el-tab-pane label="基础信息" name="basic">
                    <el-table :data="userTableData" style="width: 100%">
                      <el-table-column prop="id" label="ID" width="80" />
                      <el-table-column prop="username" label="用户名" width="150">
                        <template #default="{ row }">
                          <el-dropdown trigger="click" @command="(command: string) => handleUsernameClick(row, command)">
                            <span class="username-link">{{ row.username }}</span>
                            <template #dropdown>
                              <el-dropdown-menu>
                                <el-dropdown-item v-for="phone in row.phones" :key="phone.phoneId" :command="phone.phone">
                                  {{ phone.phone }}
                                </el-dropdown-item>
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                        </template>
                      </el-table-column>
                      <el-table-column prop="phone" label="手机号" width="120" />
                      <el-table-column prop="role" label="角色" width="100" />
                      <el-table-column prop="packageName" label="套餐名称" width="150" />
                      <el-table-column prop="accountStatus" label="账户状态" width="100">
                        <template #default="{ row }">
                          <el-tag :type="getAccountStatusType(row.accountStatus)">
                            {{ row.accountStatus }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="lastRechargeTime" label="最近充值时间" width="180" />
                      <el-table-column prop="status" label="状态" width="80">
                        <template #default="{ row }">
                          <el-tag :type="row.status === '正常' ? 'success' : 'danger'">
                            {{ row.status }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="200">
                        <template #default>
                          <el-button size="small" type="primary">编辑</el-button>
                          <el-button size="small" type="danger">删除</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>

                  <el-tab-pane label="消费明细" name="consumption">
                    <el-table :data="userConsumptionData" style="width: 100%">
                      <el-table-column prop="id" label="ID" width="80" />
                      <el-table-column prop="username" label="用户名" width="120" />
                      <el-table-column prop="phone" label="手机号" width="120" />
                      <el-table-column prop="amount" label="消费金额" width="120">
                        <template #default="{ row }">
                          <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="type" label="消费类型" width="100">
                        <template #default="{ row }">
                          <el-tag :type="getConsumptionType(row.type)">{{ row.type }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="description" label="描述" />
                      <el-table-column prop="time" label="消费时间" width="180" />
                    </el-table>
                  </el-tab-pane>

                  <el-tab-pane label="套餐资源" name="package">
                    <el-table :data="userPackageData" style="width: 100%">
                      <el-table-column prop="username" label="用户名" width="120" />
                      <el-table-column prop="phone" label="手机号" width="120" />
                      <el-table-column prop="packageName" label="套餐名称" width="150" />
                      <el-table-column label="流量使用" width="180">
                        <template #default="{ row }">
                          <el-progress :percentage="row.dataPercentage" :color="getProgressColor(row.dataPercentage)" />
                          <span class="usage-text">{{ row.usedData }}GB / {{ row.totalData }}GB</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="语音使用" width="180">
                        <template #default="{ row }">
                          <el-progress :percentage="row.voicePercentage" :color="getProgressColor(row.voicePercentage)" />
                          <span class="usage-text">{{ row.usedVoice }}分钟 / {{ row.totalVoice }}分钟</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="短信使用" width="180">
                        <template #default="{ row }">
                          <el-progress :percentage="row.smsPercentage" :color="getProgressColor(row.smsPercentage)" />
                          <span class="usage-text">{{ row.usedSms }}条 / {{ row.totalSms }}条</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
              </div>

              <div v-loading="isLoading" v-if="activeMenu === 'user-query'" class="user-query">
                <el-form :inline="true" :model="queryForm">
                  <el-form-item label="用户名">
                    <el-input v-model="queryForm.username" placeholder="请输入用户名" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="handleQuery" :loading="isLoading">查询</el-button>
                  </el-form-item>
                </el-form>
                <el-table :data="queryResultData" style="width: 100%">
                  <el-table-column prop="id" label="ID" width="80" />
                  <el-table-column prop="username" label="用户名" />
                  <el-table-column prop="balance" label="余额" />
                </el-table>
              </div>

              <div v-loading="isLoading" v-if="activeMenu === 'recharge'" class="recharge">
                <el-table :data="rechargeTableData" style="width: 100%">
                  <el-table-column prop="id" label="ID" width="80" />
                  <el-table-column prop="username" label="用户名" />
                  <el-table-column prop="amount" label="金额" />
                  <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.status)">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="300">
                    <template #default="{ row }">
                      <el-button
                        v-permission="'recharge:audit'"
                        size="small"
                        type="success"
                        :disabled="row.status !== '待审核'"
                        @click="handleAudit(row)"
                      >
                        充值审核
                      </el-button>
                      <el-button
                        v-permission="'recharge:handle'"
                        size="small"
                        type="primary"
                        :disabled="row.status !== '待审核'"
                        @click="handleProcess(row)"
                      >
                        处理充值
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>

    <SmartChatService :ws-url="wsUrl" position="right" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  HomeFilled,
  User,
  Search,
  Wallet,
  SwitchButton,
  Upload,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import SmartChatService from '@/components/SmartChatService.vue'
import type { UserManageData, ConsumptionRecord, DashboardStats } from '@/types'
import { dashboardApi, userApi, rechargeApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const wsUrl = 'ws://localhost:7676/ws/chat'

const activeMenu = ref('dashboard')
const userManageTab = ref('basic')
const queryForm = ref({
  username: ''
})

const isLoading = ref(false)
const dashboardStats = ref<DashboardStats>({
  totalUsers: 0,
  todayRecharge: 0,
  pendingAudit: 0
})

const menuTitleMap: Record<string, string> = {
  dashboard: '仪表盘',
  'user-manage': '用户管理',
  'user-query': '用户查询',
  recharge: '充值管理',
  'file-upload': '文件上传'
}

const currentMenuTitle = computed(() => menuTitleMap[activeMenu.value] || '仪表盘')

const userTableData = ref<UserManageData[]>([])
const userConsumptionData = ref<ConsumptionRecord[]>([])
const userPackageData = ref<any[]>([])
const queryResultData = ref<any[]>([])
const rechargeTableData = ref<any[]>([])

const handleMenuSelect = async (index: string) => {
  activeMenu.value = index
  
  if (index === 'file-upload') {
    router.push({ name: 'FileUpload' })
    return
  }

  await loadMenuData(index)
}

const loadMenuData = async (menu: string) => {
  try {
    isLoading.value = true
    
    switch (menu) {
      case 'dashboard':
        await loadDashboardStats()
        break
      case 'user-manage':
        await loadUserData()
        break
      case 'user-query':
        break
      case 'recharge':
        await loadRechargeData()
        break
    }
  } catch (error) {
    ElNotification({
      title: '加载失败',
      message: '数据加载失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  } finally {
    isLoading.value = false
  }
}

const loadDashboardStats = async () => {
  const response = await dashboardApi.getStats()
  if (response.code === 200) {
    dashboardStats.value = response.data
  } else {
    throw new Error(response.msg || '获取仪表盘数据失败')
  }
}

const loadUserData = async () => {
  const [userListResponse, consumptionListResponse, packageListResponse] = await Promise.all([
    userApi.getList(),
    userApi.getConsumption(),
    userApi.getPackageUsage()
  ])

  if (userListResponse.code === 200) {
    userTableData.value = userListResponse.data.list
  }
  
  if (consumptionListResponse.code === 200) {
    userConsumptionData.value = consumptionListResponse.data.list
  }
  
  if (packageListResponse.code === 200) {
    userPackageData.value = packageListResponse.data.list
  }
}

const loadRechargeData = async () => {
  const response = await rechargeApi.getList()
  if (response.code === 200) {
    rechargeTableData.value = response.data.list
  } else {
    throw new Error(response.msg || '获取充值数据失败')
  }
}

const handleUserManageTabChange = (tabName: string) => {
  console.log('切换到选项卡:', tabName)
  userManageTab.value = tabName
}

const handleUsernameClick = (_row: UserManageData, phone: string) => {
  console.log('点击手机号:', phone)
  router.push({ name: 'OrderDetail', params: { phoneId: phone } })
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
  }
}

const handleQuery = async () => {
  if (!queryForm.value.username) {
    ElNotification({
      title: '提示',
      message: '请输入用户名进行查询',
      type: 'warning',
      duration: 3000
    })
    return
  }

  try {
    isLoading.value = true
    const response = await userApi.query(queryForm.value)
    
    if (response.code === 200) {
      queryResultData.value = response.data
      ElNotification({
        title: '查询成功',
        message: `找到 ${response.data.length} 条记录`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
    } else {
      throw new Error(response.msg || '查询失败')
    }
  } catch (error) {
    ElNotification({
      title: '查询失败',
      message: '查询失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  } finally {
    isLoading.value = false
  }
}

const handleAudit = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要审核用户 ${row.username} 的充值申请吗？`,
      '审核确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    isLoading.value = true
    const response = await rechargeApi.audit({
      id: row.id,
      status: 'approved'
    })

    if (response.code === 200) {
      ElNotification({
        title: '审核成功',
        message: `已审核用户 ${row.username} 的充值申请`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
      await loadRechargeData()
    } else {
      throw new Error(response.msg || '审核失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElNotification({
        title: '审核失败',
        message: '审核失败，请检查网络连接后重试',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } finally {
    isLoading.value = false
  }
}

const handleProcess = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要处理用户 ${row.username} 的充值申请吗？`,
      '处理确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    isLoading.value = true
    const response = await rechargeApi.audit({
      id: row.id,
      status: 'approved'
    })

    if (response.code === 200) {
      ElNotification({
        title: '处理成功',
        message: `已处理用户 ${row.username} 的充值申请`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
      await loadRechargeData()
    } else {
      throw new Error(response.msg || '处理失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElNotification({
        title: '处理失败',
        message: '处理失败，请检查网络连接后重试',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } finally {
    isLoading.value = false
  }
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '待审核': 'warning',
    '已审核': 'success',
    '已拒绝': 'danger'
  }
  return typeMap[status] || 'info'
}

const getAccountStatusType = (status?: string) => {
  const typeMap: Record<string, any> = {
    '正常': 'success',
    '冻结': 'danger',
    '欠费': 'warning',
    '注销': 'info'
  }
  return typeMap[status || '正常'] || 'info'
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

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
})
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.el-menu-vertical {
  border-right: none;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}

.content-card {
  min-height: calc(100vh - 120px);
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.menu-content {
  padding: 20px 0;
}

.dashboard {
  padding: 20px;
}

.user-manage,
.user-query,
.recharge {
  padding: 20px;
}

.username-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}

.username-link:hover {
  color: #66b1ff;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.usage-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

:deep(.el-statistic__head) {
  font-size: 14px;
  color: #909399;
}

:deep(.el-statistic__content) {
  font-size: 28px;
  font-weight: 600;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-progress-bar__outer) {
  background-color: #e4e7ed;
}
</style>
