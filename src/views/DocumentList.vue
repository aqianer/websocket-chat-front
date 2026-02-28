<template>
  <div class="document-list-container">
    <div class="list-header">
      <h2 class="list-title">文档列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传文档
        </el-button>
      </div>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入文档名称"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="documentList"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
        class="document-table"
      >
        <el-table-column prop="filename" label="文档名称" min-width="200">
          <template #default="{ row }">
            <div class="filename-cell">
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="filename-text">{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="120"
          sortable
          :sort-method="(a, b) => sortStatus(a.status, b.status)"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="uploadTime"
          label="上传时间"
          width="180"
          sortable
        >
          <template #default="{ row }">
            <span class="upload-time">{{ row.uploadTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              @click.stop="handleViewDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && documentList.length === 0" class="empty-state">
        <el-empty description="暂无文档数据" />
      </div>

      <div v-if="!loading && documentList.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, Search, Refresh, Document } from '@element-plus/icons-vue'
import { documentApi } from '@/api'
import type { DocumentRecord, DocumentListRequest } from '@/types'

const router = useRouter()

const loading = ref(false)
const documentList = ref<DocumentRecord[]>([])

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
  pages: 0
})

const sortConfig = reactive({
  field: '',
  order: ''
})

let debounceTimer: number | null = null

const debounce = (fn: Function, delay: number) => {
  return (...args: any[]) => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const fetchDocuments = async () => {
  loading.value = true
  try {
    const params: DocumentListRequest = {
      page: pagination.current,
      size: pagination.size
    }

    if (searchForm.keyword.trim()) {
      params.keyword = searchForm.keyword.trim()
    }

    if (sortConfig.field) {
      params.sort = `${sortConfig.field},${sortConfig.order}`
    }

    const response = await documentApi.getList(params)
    
    if (response.code === 200) {
      documentList.value = response.data.records
      pagination.total = response.data.total
      pagination.pages = response.data.pages
      pagination.current = response.data.current
    } else {
      ElMessage.error(response.message || '获取文档列表失败')
    }
  } catch (error: any) {
    console.error('获取文档列表失败:', error)
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        ElMessage.error('未授权，请重新登录')
      } else if (status === 403) {
        ElMessage.error('没有权限访问该资源')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else {
        ElMessage.error(error.response.data?.message || '获取文档列表失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(fetchDocuments, 300)

const handleSearch = () => {
  pagination.current = 1
  fetchDocuments()
}

const handleReset = () => {
  searchForm.keyword = ''
  sortConfig.field = ''
  sortConfig.order = ''
  pagination.current = 1
  fetchDocuments()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchDocuments()
}

const handleCurrentChange = (page: number) => {
  pagination.current = page
  fetchDocuments()
}

const handleRowClick = (row: DocumentRecord) => {
  router.push({
    path: '/document-upload-wizard',
    query: { step: row.currentStep.toString() }
  })
}

const handleViewDetail = (row: DocumentRecord) => {
  ElMessage.info(`查看文档详情: ${row.filename}`)
}

const handleUpload = () => {
  router.push('/document-upload-wizard')
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '已向量化': 'success',
    '失败': 'danger',
    '处理中': 'warning',
    '未向量化': 'info'
  }
  return typeMap[status] || 'info'
}

const sortStatus = (a: string, b: string) => {
  const order = ['已向量化', '处理中', '未向量化', '失败']
  return order.indexOf(a) - order.indexOf(b)
}

watch(() => searchForm.keyword, () => {
  pagination.current = 1
  debouncedFetch()
})

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.document-list-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.table-card {
  margin-bottom: 20px;
}

.document-table {
  cursor: pointer;
}

.document-table :deep(.el-table__row) {
  transition: background-color 0.2s;
}

.document-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
  color: #409eff;
}

.filename-text {
  font-size: 14px;
  color: #303133;
}

.upload-time {
  font-size: 14px;
  color: #606266;
}

.empty-state {
  padding: 60px 0;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .document-list-container {
    padding: 16px;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .list-title {
    font-size: 20px;
  }

  .search-form {
    display: flex;
    flex-direction: column;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
  }

  .search-form :deep(.el-form-item__content) {
    width: 100%;
  }

  .search-form :deep(.el-input) {
    width: 100%;
  }

  .pagination-wrapper {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .document-list-container {
    padding: 12px;
  }

  .list-title {
    font-size: 18px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    flex: 1;
  }

  .document-table :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}
</style>