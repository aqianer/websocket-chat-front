<template>
  <div class="kb-detail-container">
    <el-container>
      <el-header class="kb-header">
        <div class="header-content">
          <div class="header-left">
            <el-button @click="handleBack" circle>
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <h2>{{ kbDetail.name }}</h2>
            <el-tag :type="kbDetail.status === '正常' ? 'success' : 'warning'">
              {{ kbDetail.status }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleUploadDoc" circle>
              <el-icon><Upload /></el-icon>
            </el-button>
          </div>
        </div>
      </el-header>

      <el-container>
        <el-aside width="280px" class="kb-aside">
          <el-card class="doc-list-card">
            <template #header>
              <div class="tree-header">
                <span>文档列表</span>
              </div>
            </template>
            <div class="doc-search">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索文档名称"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="doc-content-wrapper">
              <div class="doc-list-container">
                <div
                  v-for="doc in paginatedDocuments"
                  :key="doc.id"
                  class="doc-item"
                  :class="{ 'is-active': selectedDocId === doc.id }"
                  @click="handleSelectDoc(doc)"
                >
                  <div class="doc-item-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <el-tooltip
                    :content="doc.fileName"
                    placement="right"
                    :disabled="!isTextOverflow(doc.fileName)"
                  >
                    <div class="doc-item-name">{{ doc.fileName }}</div>
                  </el-tooltip>
                  <div class="doc-item-status">
                    <el-tag :type="getVectorStatusType(doc.vectorStatus)" size="small">
                      {{ doc.vectorStatus }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            <div class="doc-pagination">
              <div class="pagination-info">
                <span class="total-count">Total {{ filteredDocuments.length }}</span>
                <el-select v-model="pageSize" size="small" class="page-size-select">
                  <el-option :value="10">10/page</el-option>
                  <el-option :value="20">20/page</el-option>
                  <el-option :value="50">50/page</el-option>
                </el-select>
              </div>
              <div class="pagination-controls">
                <el-button
                  size="small"
                  :disabled="currentPage === 1"
                  @click="handlePrevPage"
                  class="pagination-btn"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div class="page-numbers">
                  <span
                    v-for="page in totalPages"
                    :key="page"
                    class="page-number"
                    :class="{ 'is-active': page === currentPage, 'is-current': page === currentPage }"
                    @click="handleGoToPage(page)"
                  >
                    {{ page }}
                  </span>
                </div>
                <el-button
                  size="small"
                  :disabled="currentPage === totalPages"
                  @click="handleNextPage"
                  class="pagination-btn"
                >
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </el-aside>

        <el-main class="kb-main">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card v-if="selectedDoc" class="doc-detail-card">
                <template #header>
                  <div class="card-header">
                    <span>文档详情</span>
                    <div class="header-actions">
                      <el-button type="primary" size="small" @click="handleUploadDoc">
                        <el-icon><Upload /></el-icon>
                        继续上传
                      </el-button>
                      <el-button type="info" size="small" @click="handlePreviewChunk">
                        <el-icon><View /></el-icon>
                        预览分块
                      </el-button>
                      <el-button type="warning" size="small" @click="handleReVectorize(selectedDoc)">
                        重新向量化
                      </el-button>
                      <el-button type="danger" size="small" @click="handleDeleteDoc(selectedDoc)">
                        删除
                      </el-button>
                    </div>
                  </div>
                </template>

                <div class="doc-detail-content">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="文件名" :span="2">
                      <div class="file-name-display">
                        <el-icon><Document /></el-icon>
                        <span>{{ selectedDoc.fileName }}</span>
                      </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="上传人">
                      {{ selectedDoc.uploader }}
                    </el-descriptions-item>
                    <el-descriptions-item label="上传时间">
                      {{ selectedDoc.uploadTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="分块数">
                      {{ selectedDoc.chunkCount }}
                    </el-descriptions-item>
                    <el-descriptions-item label="向量状态">
                      <el-tag :type="getVectorStatusType(selectedDoc.vectorStatus)">
                        {{ selectedDoc.vectorStatus }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="文件大小" :span="2">
                      {{ selectedDoc.fileSize || '未知' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="文件类型" :span="2">
                      {{ selectedDoc.fileType || '未知' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="uploadDialogVisible" title="上传文档" width="500px">
      <el-upload
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="uploadFileList"
        multiple
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .txt, .pdf, .doc, .docx 格式文件，单个文件不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmUpload">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="chunkPreviewVisible" title="分块预览" width="800px">
      <el-table :data="chunkList" style="width: 100%" max-height="500">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="content" label="分块内容" min-width="400" show-overflow-tooltip />
        <el-table-column prop="tokenCount" label="Token数" width="100" align="center" />
        <el-table-column prop="vectorStatus" label="向量状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getVectorStatusType(row.vectorStatus)" size="small">
              {{ row.vectorStatus }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chunkPreviewVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Refresh,
  Upload,
  View,
  Document,
  UploadFilled,
  Search
} from '@element-plus/icons-vue'
import type { KnowledgeBase } from '@/types'
import { knowledgeBaseApi } from '@/api/knowledgeBase'

const router = useRouter()
const route = useRoute()

const kbId = parseInt(route.params.id as string)

const kbDetail = ref<KnowledgeBase>({
  id: 0,
  name: '',
  owner: '',
  docCount: 0,
  vectorDim: 1536,
  createTime: '',
  status: '正常',
  type: 'tech',
  department: 'tech'
})

interface Document {
  id: number
  fileName: string
  uploader: string
  uploadTime: string
  chunkCount: number
  vectorStatus: '未向量化' | '已向量化' | '失败'
  fileSize?: string
  fileType?: string
}

const documentList = ref<Document[]>([])

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedDocId = ref<number | null>(null)
const selectedDoc = ref<Document | null>(null)
const selectedDocuments = ref<Document[]>([])

const filteredDocuments = computed(() => {
  if (!searchKeyword.value) {
    return documentList.value.sort((a, b) => 
      new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    )
  }
  const keyword = searchKeyword.value.toLowerCase()
  return documentList.value
    .filter(doc => doc.fileName.toLowerCase().includes(keyword))
    .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())
})

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDocuments.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredDocuments.value.length / pageSize.value)
})

const handlePrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const handleGoToPage = (page: number) => {
  currentPage.value = page
}

const vectorConfig = reactive({
  model: 'bge-large-zh',
  strategy: 'paragraph',
  chunkSize: 1000,
  overlap: 100
})

const uploadDialogVisible = ref(false)
const uploadFileList = ref<any[]>([])

const chunkPreviewVisible = ref(false)
const chunkList = ref<any[]>([])

const handleBack = () => {
  router.push({ path: '/home', query: { menu: 'knowledge-base' } })
}

const handleSearch = () => {
  currentPage.value = 1
  loadDocumentList()
}

const handleSelectDoc = (doc: Document) => {
  selectedDocId.value = doc.id
  selectedDoc.value = doc
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadDocumentList()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadDocumentList()
}

const isTextOverflow = (text: string) => {
  const maxLength = 20
  return text.length > maxLength
}

const handleUploadDoc = async () => {
  if (!selectedDoc.value) {
    ElMessage.warning('请先选择一个文档')
    return
  }

  try {
    const response = await knowledgeBaseApi.getDocumentUploadWizard({
      kbId,
      documentId: selectedDoc.value.id
    })

    if (response.code === 200) {
      const documentData = response.data

      if (documentData.status === 'uploaded_not_chunked') {
        router.push({
          path: `/document-upload-wizard/${kbId}`,
          query: {
            documentId: documentData.documentId,
            step: '2'
          }
        })
      } else if (documentData.status === 'chunked') {
        router.push({
          path: `/document-upload-wizard/${kbId}`,
          query: {
            documentId: documentData.documentId,
            step: '3',
            chunkData: JSON.stringify(documentData.chunkData)
          }
        })
      }
    } else {
      throw new Error(response.msg || '获取文档信息失败')
    }
  } catch (error) {
    ElNotification({
      title: '操作失败',
      message: '无法获取文档信息，请检查网络连接后重试',
      type: 'error',
      duration: 5000
    })
  }
}

const handleFileChange = (file: any) => {
  console.log('文件选择:', file)
}

const handleConfirmUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  try {
    const response = await knowledgeBaseApi.uploadDocuments({
      kbId,
      files: uploadFileList.value.map(f => f.raw)
    })
    
    if (response.code === 200) {
      ElNotification({
        title: '上传成功',
        message: `成功上传 ${response.data.successCount} 个文件`,
        type: 'success',
        duration: 3000
      })
      await loadDocumentList()
    } else {
      throw new Error(response.msg || '上传失败')
    }
  } catch (error) {
    ElNotification({
      title: '上传失败',
      message: '文件上传失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000
    })
  }
  
  uploadDialogVisible.value = false
  uploadFileList.value = []
}

const handlePreviewChunk = async () => {
  if (!selectedDoc.value) return
  
  try {
    const response = await knowledgeBaseApi.getChunkPreview(kbId, selectedDoc.value.id)
    if (response.code === 200) {
      chunkList.value = response.data
      chunkPreviewVisible.value = true
    } else {
      throw new Error(response.msg || '获取分块预览失败')
    }
  } catch (error) {
    ElNotification({
      title: '加载失败',
      message: '分块预览加载失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000
    })
  }
}

const handleReVectorize = async (row: Document) => {
  try {
    await ElMessageBox.confirm(
      `确定要重新向量化文档"${row.fileName}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await knowledgeBaseApi.reVectorize({
      kbId,
      documentId: row.id
    })
    
    if (response.code === 200) {
      ElNotification({
        title: '操作成功',
        message: `文档"${row.fileName}"已开始重新向量化`,
        type: 'success',
        duration: 3000
      })
      await loadDocumentList()
    } else {
      throw new Error(response.msg || '重新向量化失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElNotification({
        title: '操作失败',
        message: '重新向量化失败，请检查网络连接后重试',
        type: 'error',
        duration: 5000
      })
    }
  }
}

const handleDeleteDoc = async (row: Document) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档"${row.fileName}"吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await knowledgeBaseApi.deleteDocument({
      kbId,
      documentId: row.id
    })
    
    if (response.code === 200) {
      ElNotification({
        title: '删除成功',
        message: `文档"${row.fileName}"已删除`,
        type: 'success',
        duration: 3000
      })
      selectedDoc.value = null
      selectedDocId.value = null
      await loadDocumentList()
    } else {
      throw new Error(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElNotification({
        title: '删除失败',
        message: '删除失败，请检查网络连接后重试',
        type: 'error',
        duration: 5000
      })
    }
  }
}

const handleSelectionChange = (selection: Document[]) => {
  selectedDocuments.value = selection
}

const handleBatchVectorize = () => {
  ElMessageBox.confirm(
    `确定要批量向量化选中的 ${selectedDocuments.value.length} 个文档吗？`,
    '批量操作确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElNotification({
      title: '操作成功',
      message: `已开始批量向量化 ${selectedDocuments.value.length} 个文档`,
      type: 'success',
      duration: 3000
    })
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchExport = () => {
  ElNotification({
    title: '导出中',
    message: `正在导出 ${selectedDocuments.value.length} 个文档...`,
    type: 'info',
    duration: 3000
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定要批量删除选中的 ${selectedDocuments.value.length} 个文档吗？此操作不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const selectedIds = selectedDocuments.value.map(doc => doc.id)
    documentList.value = documentList.value.filter(doc => !selectedIds.includes(doc.id))
    selectedDocuments.value = []
    ElNotification({
      title: '删除成功',
      message: `已成功删除 ${selectedIds.length} 个文档`,
      type: 'success',
      duration: 3000
    })
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleApplyConfig = () => {
  ElNotification({
    title: '配置已应用',
    message: '向量配置已成功应用',
    type: 'success',
    duration: 3000
  })
}

const getVectorStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '未向量化': 'info',
    '已向量化': 'success',
    '失败': 'danger'
  }
  return typeMap[status] || 'info'
}

const loadKnowledgeBaseDetail = async () => {
  try {
    const response = await knowledgeBaseApi.getDetail(kbId)
    if (response.code === 200) {
      kbDetail.value = response.data
    } else {
      throw new Error(response.msg || '获取知识库详情失败')
    }
  } catch (error) {
    ElNotification({
      title: '加载失败',
      message: '知识库详情加载失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000
    })
  }
}

const loadDocumentList = async () => {
  try {
    const response = await knowledgeBaseApi.getDocuments({
      kbId,
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined
    })
    if (response.code === 200) {
      documentList.value = response.data.list
    } else {
      throw new Error(response.msg || '获取文档列表失败')
    }
  } catch (error) {
    ElNotification({
      title: '加载失败',
      message: '文档列表加载失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000
    })
  }
}

onMounted(() => {
  loadKnowledgeBaseDetail()
  loadDocumentList()
})
</script>

<style scoped>
.kb-detail-container {
  height: 100vh;
  background-color: #f0f2f5;
}

.kb-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .header-content {
    gap: 10px;
  }

  .header-left {
    gap: 10px;
  }

  .header-right {
    gap: 10px;
  }

  .header-content h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .header-left,
  .header-right {
    width: 100%;
    justify-content: center;
    gap: 12px;
  }

  .header-content h2 {
    font-size: 16px;
    margin-bottom: 8px;
  }
}

.kb-aside {
  background-color: #f5f7fa;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}

.doc-list-card {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-search {
  margin-bottom: 15px;
}

.doc-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
  margin-bottom: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.doc-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
  transform: translateX(5px);
}

.doc-item.is-active {
  background-color: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.doc-item-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f9ff;
  border-radius: 8px;
  margin-right: 12px;
}

.doc-item-icon .el-icon {
  font-size: 20px;
  color: #409eff;
}

.doc-item-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.doc-item-status {
  flex-shrink: 0;
}

.doc-content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.doc-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
  margin-bottom: 12px;
}

.doc-pagination {
  flex-shrink: 0;
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  z-index: 100;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.total-count {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.page-size-select {
  width: 100px;
  flex-shrink: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.pagination-btn:disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.page-number {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number:hover:not(.is-active):not(.is-current) {
  background-color: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
}

.page-number.is-active {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
  font-weight: 500;
}

.page-number.is-current {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
  font-weight: 500;
  cursor: default;
}

@media (max-width: 768px) {
  .doc-list-container {
    max-height: calc(100vh - 250px);
  }

  .doc-pagination {
    position: sticky;
    bottom: 0;
    background-color: white;
    z-index: 10;
  }
}

@media (max-width: 480px) {
  .doc-list-container {
    max-height: calc(100vh - 200px);
  }

  .pagination-info {
    flex-direction: column;
    gap: 8px;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 8px;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-btn {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .doc-pagination {
    padding: 10px;
  }

  .pagination-info {
    gap: 8px;
  }

  .total-count {
    font-size: 11px;
  }

  .page-size-select {
    width: 80px;
  }

  .pagination-btn {
    width: 32px;
    height: 32px;
  }
}

.doc-detail-card {
  margin-bottom: 20px;
}

.doc-detail-content {
  padding: 20px 0;
}

.file-name-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.file-name-display .el-icon {
  font-size: 20px;
  color: #409eff;
}

.kb-main {
  padding: 20px;
  background-color: #f0f2f5;
}

.config-card {
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-actions {
  margin-top: 20px;
}

.batch-actions-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

:deep(.el-tabs__content) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-upload-dragger) {
  padding: 40px;
}

:deep(.el-upload__text) {
  font-size: 14px;
  color: #606266;
}

:deep(.el-icon--upload) {
  font-size: 67px;
  color: #409eff;
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

:deep(.el-descriptions) {
  font-size: 14px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-descriptions__body) {
  padding: 20px 0;
}

:deep(.el-empty) {
  padding: 60px 0;
}
</style>
