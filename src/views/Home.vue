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
        <el-aside :width="isCollapsed ? '64px' : '200px'" class="aside">
          <div class="aside-header">
            <div v-if="!isCollapsed" class="aside-title">系统菜单</div>
            <el-button
              class="collapse-btn"
              :icon="isCollapsed ? Expand : Fold"
              circle
              @click="toggleCollapse"
            />
          </div>
          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapsed"
            class="el-menu-vertical"
            @select="handleMenuSelect"
          >
            <el-menu-item index="dashboard">
              <el-icon><HomeFilled /></el-icon>
              <template #title>仪表盘</template>
            </el-menu-item>

            <el-menu-item v-permission="'user:manage'" index="user-manage">
              <el-icon><User /></el-icon>
              <template #title>用户管理</template>
            </el-menu-item>

            <el-menu-item v-permission="'query:user'" index="user-query">
              <el-icon><Search /></el-icon>
              <template #title>用户查询</template>
            </el-menu-item>

            <el-menu-item index="recharge">
              <el-icon><Wallet /></el-icon>
              <template #title>充值管理</template>
            </el-menu-item>

            <el-menu-item v-if="userStore.isSuperAdmin()" index="file-upload">
              <el-icon><Upload /></el-icon>
              <template #title>文件上传</template>
            </el-menu-item>

            <el-menu-item index="knowledge-base">
              <el-icon><Reading /></el-icon>
              <template #title>知识库管理</template>
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

              <div v-loading="isLoading" v-if="activeMenu === 'knowledge-base'" class="knowledge-base">
                <div class="kb-header">
                  <div class="kb-actions">
                    <el-button type="primary" @click="handleCreateKB">
                      <el-icon><Plus /></el-icon>
                      新建知识库
                    </el-button>
                    <el-button type="success" @click="handleImportDoc">
                      <el-icon><Upload /></el-icon>
                      导入文档
                    </el-button>
                    <el-button type="warning" @click="handleBatchDelete">
                      <el-icon><Delete /></el-icon>
                      批量删除
                    </el-button>
                    <el-button type="info" @click="handlePermissionConfig">
                      <el-icon><Setting /></el-icon>
                      权限配置
                    </el-button>
                  </div>

                  <div class="kb-filter">
                    <el-form :inline="true" :model="kbFilterForm">
                      <el-form-item label="部门">
                        <el-select v-model="kbFilterForm.department" placeholder="请选择部门" clearable>
                          <el-option label="技术部" value="tech" />
                          <el-option label="业务部" value="business" />
                          <el-option label="行政部" value="admin" />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="负责人">
                        <el-input v-model="kbFilterForm.owner" placeholder="请输入负责人" />
                      </el-form-item>
                      <el-form-item label="类型">
                        <el-select v-model="kbFilterForm.type" placeholder="请选择类型" clearable>
                          <el-option label="技术" value="tech" />
                          <el-option label="业务" value="business" />
                          <el-option label="制度" value="policy" />
                        </el-select>
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="handleFilterKB">筛选</el-button>
                        <el-button @click="handleResetFilter">重置</el-button>
                      </el-form-item>
                    </el-form>
                  </div>
                </div>

                <div class="kb-shortcuts">
                  <el-card class="shortcut-card" shadow="hover" @click="handleQuickAccess('common')">
                    <el-icon class="shortcut-icon"><Star /></el-icon>
                    <span class="shortcut-text">常用知识库</span>
                  </el-card>
                  <el-card class="shortcut-card" shadow="hover" @click="handleQuickAccess('recent')">
                    <el-icon class="shortcut-icon"><Clock /></el-icon>
                    <span class="shortcut-text">最近更新</span>
                  </el-card>
                  <el-card class="shortcut-card" shadow="hover" @click="handleQuickAccess('search')">
                    <el-icon class="shortcut-icon"><Search /></el-icon>
                    <span class="shortcut-text">检索测试</span>
                  </el-card>
                </div>

                <div class="kb-list">
                  <el-row :gutter="20">
                    <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="kb in knowledgeBaseList" :key="kb.id">
                      <el-card class="kb-card" shadow="hover">
                        <template #header>
                          <div class="kb-card-header">
                            <span class="kb-name">{{ kb.name }}</span>
                            <el-tag :type="kb.status === '正常' ? 'success' : 'warning'" size="small">
                              {{ kb.status }}
                            </el-tag>
                          </div>
                        </template>
                        <div class="kb-card-content">
                          <div class="kb-info-item">
                            <el-icon><User /></el-icon>
                            <span>负责人：{{ kb.owner }}</span>
                          </div>
                          <div class="kb-info-item">
                            <el-icon><Document /></el-icon>
                            <span>文档数：{{ kb.docCount }}</span>
                          </div>
                          <div class="kb-info-item">
                            <el-icon><DataLine /></el-icon>
                            <span>向量维度：{{ kb.vectorDim }}</span>
                          </div>
                          <div class="kb-info-item">
                            <el-icon><Calendar /></el-icon>
                            <span>创建时间：{{ kb.createTime }}</span>
                          </div>
                          <div class="kb-info-item">
                            <el-tag :type="getKBTypeColor(kb.type)" size="small">
                              {{ getKBTypeName(kb.type) }}
                            </el-tag>
                          </div>
                        </div>
                        <template #footer>
                          <div class="kb-card-footer">
                            <el-button size="small" type="primary" @click="handleViewKB(kb)">查看</el-button>
                            <el-button size="small" type="warning" @click="handleEditKB(kb)">编辑</el-button>
                            <el-button size="small" type="danger" @click="handleDeleteKB(kb)">删除</el-button>
                          </div>
                        </template>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>

    <SmartChatService :ws-url="wsUrl" position="right" />

    <el-dialog
      v-model="kbDialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="kbFormRef"
        :model="kbForm"
        :rules="kbFormRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="知识库名称" prop="name">
          <el-input
            v-model="kbForm.name"
            placeholder="请输入知识库名称"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="业务类型" prop="type">
          <el-select v-model="kbForm.type" placeholder="请选择业务类型" style="width: 100%">
            <el-option label="技术" value="tech" />
            <el-option label="业务" value="business" />
            <el-option label="制度" value="policy" />
          </el-select>
        </el-form-item>

        <el-form-item label="负责人" prop="owner">
          <el-input
            v-model="kbForm.owner"
            placeholder="请输入负责人姓名"
            maxlength="20"
            clearable
          />
        </el-form-item>

        <el-form-item label="所属部门" prop="department">
          <el-select v-model="kbForm.department" placeholder="请选择所属部门" style="width: 100%">
            <el-option label="技术部" value="tech" />
            <el-option label="业务部" value="business" />
            <el-option label="行政部" value="admin" />
          </el-select>
        </el-form-item>

        <el-form-item label="向量维度" prop="vectorDim">
          <el-select v-model="kbForm.vectorDim" placeholder="请选择向量维度" style="width: 100%">
            <el-option label="768" :value="768" />
            <el-option label="1024" :value="1024" />
            <el-option label="1536" :value="1536" />
            <el-option label="2048" :value="2048" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="kbForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelKB">取消</el-button>
          <el-button type="primary" @click="handleSubmitKB" :loading="isSubmitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  HomeFilled,
  User,
  Search,
  Wallet,
  SwitchButton,
  Upload,
  CircleCheck,
  CircleClose,
  Reading,
  Plus,
  Delete,
  Setting,
  Star,
  Clock,
  Document,
  DataLine,
  Calendar,
  Expand,
  Fold
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import SmartChatService from '@/components/SmartChatService.vue'
import type { UserManageData, ConsumptionRecord, DashboardStats, KnowledgeBase } from '@/types'
import { dashboardApi, userApi, rechargeApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const wsUrl = 'ws://localhost:7676/ws/chat'

const activeMenu = ref('dashboard')
const isCollapsed = ref(false)
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
  'file-upload': '文件上传',
  'knowledge-base': '知识库管理'
}

const currentMenuTitle = computed(() => menuTitleMap[activeMenu.value] || '仪表盘')

const userTableData = ref<UserManageData[]>([])
const userConsumptionData = ref<ConsumptionRecord[]>([])
const userPackageData = ref<any[]>([])
const queryResultData = ref<any[]>([])
const rechargeTableData = ref<any[]>([])

const knowledgeBaseList = ref<KnowledgeBase[]>([
  {
    id: 1,
    name: '技术文档库',
    owner: '张三',
    docCount: 1250,
    vectorDim: 1536,
    createTime: '2024-01-15',
    status: '正常',
    type: 'tech',
    department: 'tech'
  },
  {
    id: 2,
    name: '业务流程库',
    owner: '李四',
    docCount: 890,
    vectorDim: 1536,
    createTime: '2024-02-20',
    status: '正常',
    type: 'business',
    department: 'business'
  },
  {
    id: 3,
    name: '制度规范库',
    owner: '王五',
    docCount: 560,
    vectorDim: 1536,
    createTime: '2024-03-10',
    status: '维护中',
    type: 'policy',
    department: 'admin'
  },
  {
    id: 4,
    name: '产品知识库',
    owner: '赵六',
    docCount: 2100,
    vectorDim: 1536,
    createTime: '2024-01-25',
    status: '正常',
    type: 'business',
    department: 'business'
  },
  {
    id: 5,
    name: '开发文档库',
    owner: '孙七',
    docCount: 1800,
    vectorDim: 1536,
    createTime: '2024-02-05',
    status: '正常',
    type: 'tech',
    department: 'tech'
  },
  {
    id: 6,
    name: '培训资料库',
    owner: '周八',
    docCount: 750,
    vectorDim: 1536,
    createTime: '2024-03-01',
    status: '维护中',
    type: 'policy',
    department: 'admin'
  }
])

const kbFilterForm = ref({
  department: '',
  owner: '',
  type: ''
})

const kbDialogVisible = ref(false)
const dialogTitle = ref('新建知识库')
const isSubmitting = ref(false)
const isEditMode = ref(false)
const kbFormRef = ref()
const kbForm = ref({
  name: '',
  type: '',
  owner: '',
  department: '',
  vectorDim: 1536,
  description: ''
})

const kbFormRules = {
  name: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '知识库名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择业务类型', trigger: 'change' }
  ],
  owner: [
    { required: true, message: '请输入负责人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '负责人姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  vectorDim: [
    { required: true, message: '请选择向量维度', trigger: 'change' }
  ]
}

const handleMenuSelect = async (index: string) => {
  activeMenu.value = index
  
  if (index === 'file-upload') {
    router.push({ name: 'FileUpload' })
    return
  }

  await loadMenuData(index)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
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
      case 'knowledge-base':
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

const handleCreateKB = () => {
  dialogTitle.value = '新建知识库'
  kbForm.value = {
    name: '',
    type: '',
    owner: '',
    department: '',
    vectorDim: 1536,
    description: ''
  }
  kbDialogVisible.value = true
}

const handleCancelKB = () => {
  kbDialogVisible.value = false
  kbForm.value = {
    name: '',
    type: '',
    owner: '',
    department: '',
    vectorDim: 1536,
    description: ''
  }
  isEditMode.value = false
}

const handleSubmitKB = async () => {
  if (!kbFormRef.value) return

  try {
    await kbFormRef.value.validate()
    
    isSubmitting.value = true
    
    if (isEditMode.value) {
      const index = knowledgeBaseList.value.findIndex(kb => kb.name === kbForm.value.name)
      if (index !== -1) {
        knowledgeBaseList.value[index] = {
          ...knowledgeBaseList.value[index],
          name: kbForm.value.name,
          type: kbForm.value.type as 'tech' | 'business' | 'policy',
          owner: kbForm.value.owner,
          department: kbForm.value.department,
          vectorDim: kbForm.value.vectorDim
        }
      }
      
      ElNotification({
        title: '更新成功',
        message: `知识库"${kbForm.value.name}"更新成功`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
    } else {
      const newKB: KnowledgeBase = {
        id: Date.now(),
        name: kbForm.value.name,
        owner: kbForm.value.owner,
        docCount: 0,
        vectorDim: kbForm.value.vectorDim,
        createTime: new Date().toISOString().split('T')[0],
        status: '正常',
        type: kbForm.value.type as 'tech' | 'business' | 'policy',
        department: kbForm.value.department
      }
      
      knowledgeBaseList.value.unshift(newKB)
      
      ElNotification({
        title: '创建成功',
        message: `知识库"${kbForm.value.name}"创建成功`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
    }
    
    kbDialogVisible.value = false
    kbForm.value = {
      name: '',
      type: '',
      owner: '',
      department: '',
      vectorDim: 1536,
      description: ''
    }
    isEditMode.value = false
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  } finally {
    isSubmitting.value = false
  }
}

const handleImportDoc = () => {
  ElMessage.info('导入文档功能开发中')
}

const handleBatchDelete = () => {
  ElMessage.info('批量删除功能开发中')
}

const handlePermissionConfig = () => {
  ElMessage.info('权限配置功能开发中')
}

const handleFilterKB = () => {
  ElMessage.info('筛选功能已应用')
}

const handleResetFilter = () => {
  kbFilterForm.value = {
    department: '',
    owner: '',
    type: ''
  }
  ElMessage.success('筛选条件已重置')
}

const handleQuickAccess = (type: string) => {
  const typeMap: Record<string, string> = {
    common: '常用知识库',
    recent: '最近更新',
    search: '检索测试'
  }
  ElMessage.info(`进入${typeMap[type]}页面`)
}

const handleViewKB = (kb: KnowledgeBase) => {
  router.push({ name: 'KnowledgeBaseDetail', params: { id: kb.id } })
}

const handleEditKB = (kb: KnowledgeBase) => {
  dialogTitle.value = '编辑知识库'
  isEditMode.value = true
  kbForm.value = {
    name: kb.name,
    type: kb.type,
    owner: kb.owner,
    department: kb.department,
    vectorDim: kb.vectorDim,
    description: ''
  }
  kbDialogVisible.value = true
}

const handleDeleteKB = (kb: KnowledgeBase) => {
  ElMessageBox.confirm(`确定要删除知识库"${kb.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const getKBTypeColor = (type: string) => {
  const typeMap: Record<string, any> = {
    tech: 'primary',
    business: 'success',
    policy: 'warning'
  }
  return typeMap[type] || 'info'
}

const getKBTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    tech: '技术',
    business: '业务',
    policy: '制度'
  }
  return typeMap[type] || '未知'
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const menuFromQuery = route.query.menu as string
  if (menuFromQuery) {
    activeMenu.value = menuFromQuery
    loadMenuData(menuFromQuery)
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
  transition: width 0.3s ease;
  position: relative;
}

.aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.aside-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.collapse-btn:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .aside {
    position: fixed;
    left: 0;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 1000;
  }

  .aside:deep(.el-menu-vertical) {
    border-right: none;
  }

  .collapse-btn {
    display: none;
  }
}

@media (max-width: 480px) {
  .aside {
    width: 64px !important;
  }

  .aside-header {
    display: none;
  }
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

.knowledge-base {
  padding: 20px;
}

.kb-header {
  margin-bottom: 20px;
}

.kb-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.kb-filter {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.kb-shortcuts {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.shortcut-card {
  flex: 1;
  min-width: 200px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}

.shortcut-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.shortcut-icon {
  font-size: 24px;
  color: #409eff;
}

.shortcut-text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.kb-list {
  margin-top: 20px;
}

.kb-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.kb-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.kb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kb-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.kb-card-content {
  padding: 10px 0;
}

.kb-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.kb-info-item:last-child {
  margin-bottom: 0;
}

.kb-info-item .el-icon {
  font-size: 16px;
  color: #909399;
}

.kb-card-footer {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .kb-actions {
    flex-direction: column;
  }

  .kb-actions .el-button {
    width: 100%;
  }

  .kb-filter :deep(.el-form-item) {
    width: 100%;
  }

  .kb-shortcuts {
    flex-direction: column;
  }

  .shortcut-card {
    width: 100%;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

:deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

:deep(.el-dialog__headerbtn .el-dialog__close:hover) {
  color: #f0f0f0;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-input__inner) {
  border-radius: 4px;
}

:deep(.el-select .el-input__inner) {
  cursor: pointer;
}

:deep(.el-textarea__inner) {
  border-radius: 4px;
  resize: none;
}
</style>
