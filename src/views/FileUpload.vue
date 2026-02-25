<template>
  <div class="file-upload-container">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <span class="title">文件上传</span>
      </template>
    </el-page-header>

    <el-card class="upload-card">
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :multiple="true"
        :auto-upload="false"
        :on-change="handleFileChange"
        :disabled="isUploading"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">
          <p v-if="!isUploading">将文件拖到此处，或<span class="highlight">点击上传</span></p>
          <p v-else class="uploading-text">
            <el-icon class="is-loading"><Loading /></el-icon>
            上传中... {{ uploadProgress }}%
          </p>
          <p class="upload-hint">支持格式：doc, docx, pdf, txt, jpg, png | 单个文件不超过10MB</p>
        </div>
      </el-upload>

      <el-progress
        v-if="isUploading && uploadProgress > 0"
        :percentage="uploadProgress"
        :status="uploadProgress === 100 ? 'success' : undefined"
        class="upload-progress"
      />

      <div v-if="pendingFiles.length > 0" class="pending-files-list">
        <div class="pending-files-header">
          <span class="pending-files-title">已选择文件 ({{ pendingFiles.length }})</span>
          <el-button 
            size="small" 
            type="danger" 
            text
            @click="clearAllPendingFiles"
            :disabled="isUploading"
          >
            清空全部
          </el-button>
        </div>
        <div class="pending-files-items">
          <div 
            v-for="(file, index) in pendingFiles" 
            :key="index"
            class="pending-file-item"
          >
            <div class="file-icon">
              <el-icon><component :is="getFileIcon(file.name)" /></el-icon>
            </div>
            <div class="file-info">
              <div class="file-name" :title="file.name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
            <el-button
              size="small"
              type="danger"
              text
              :icon="Delete"
              @click="removePendingFile(index)"
              :disabled="isUploading"
              class="remove-file-btn"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="operation-area">
        <div class="left-buttons">
          <el-button 
            type="danger" 
            :disabled="selectedFiles.length === 0 || isDeleting"
            :loading="isDeleting"
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon>
            {{ isDeleting ? '删除中...' : '批量删除' }}
          </el-button>
          <el-button 
            type="primary" 
            :disabled="selectedFiles.length === 0 || isDownloading"
            :loading="isDownloading"
            @click="handleBatchDownload"
          >
            <el-icon><Download /></el-icon>
            {{ isDownloading ? '下载中...' : '批量下载' }}
          </el-button>
        </div>

        <div class="search-area">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文件名"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="right-buttons">
          <el-button 
            type="warning" 
            :disabled="pendingFiles.length === 0 || isUploading"
            :loading="isUploading"
            @click="handleUploadAll"
          >
            <el-icon><Upload /></el-icon>
            {{ isUploading ? '上传中...' : '全部上传' }}
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="file-list-area">
        <el-table 
          :data="filteredFileList" 
          style="width: 100%"
          @selection-change="handleSelectionChange"
          v-loading="isLoading"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column prop="fileName" label="文件名" min-width="200" />
          <el-table-column prop="uploadTime" label="上传时间" width="180" />
          <el-table-column prop="updateTime" label="更新时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button 
                size="small" 
                type="primary" 
                :disabled="isDownloading"
                :loading="downloadingFileId === row.id"
                @click="handleDownload(row)"
              >
                <el-icon><Download /></el-icon>
                {{ downloadingFileId === row.id ? '下载中...' : '下载' }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                :disabled="isDeleting"
                :loading="deletingFileId === row.id"
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>
                {{ deletingFileId === row.id ? '删除中...' : '删除' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { UploadFilled, Upload, Delete, Download, Search, Loading, CircleCheck, CircleClose, Document, Picture } from '@element-plus/icons-vue'
import type { FileInfo, UploadResponse } from '@/types'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const uploadRef = ref()
const fileList = ref<FileInfo[]>([])
const selectedFiles = ref<FileInfo[]>([])
const searchKeyword = ref('')
const pendingFiles = ref<File[]>([])

const isUploading = ref(false)
const isDownloading = ref(false)
const isDeleting = ref(false)
const isLoading = ref(false)
const uploadProgress = ref(0)
const downloadingFileId = ref<number | null>(null)
const deletingFileId = ref<number | null>(null)

const uploadUrl = '/api/file/upload'
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${userStore.token}`
}))

const filteredFileList = computed(() => {
  if (!searchKeyword.value) {
    return fileList.value
  }
  return fileList.value.filter(file => 
    file.fileName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const handleBack = () => {
  router.back()
}

const handleFileChange = (file: any) => {
  pendingFiles.value.push(file.raw)
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) {
    return Picture
  }
  return Document
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const removePendingFile = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

const clearAllPendingFiles = () => {
  pendingFiles.value = []
}

const beforeUpload = (file: File) => {
  const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'text/plain', 'image/jpeg', 'image/png']
  const maxSize = 10 * 1024 * 1024

  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(doc|docx|pdf|txt|jpg|png)$/i)) {
    ElNotification({
      title: '上传失败',
      message: `不支持的文件类型：${file.name}`,
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
    return false
  }

  if (file.size > maxSize) {
    ElNotification({
      title: '上传失败',
      message: `文件大小超过限制：${file.name}（最大10MB）`,
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
    return false
  }

  return true
}

const handleUploadSuccess = (response: UploadResponse) => {
  if (response.code === 200) {
    ElNotification({
      title: '上传成功',
      message: '文件已成功上传到服务器',
      type: 'success',
      duration: 3000,
      icon: CircleCheck
    })
    loadFileList()
  } else {
    ElNotification({
      title: '上传失败',
      message: response.msg || '服务器返回错误，请重试',
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  }
}

const handleUploadError = () => {
  ElNotification({
    title: '上传失败',
    message: '网络错误或服务器异常，请检查网络连接后重试',
    type: 'error',
    duration: 5000,
    icon: CircleClose
  })
}

const handleUploadAll = async () => {
  if (pendingFiles.value.length === 0) {
    ElNotification({
      title: '提示',
      message: '请先选择要上传的文件',
      type: 'warning',
      duration: 3000
    })
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  pendingFiles.value.forEach(file => {
    formData.append('files', file)
  })

  try {
    const response = await axios.post<UploadResponse>(uploadUrl, formData, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.code === 200) {
      ElNotification({
        title: '批量上传成功',
        message: `成功上传 ${pendingFiles.value.length} 个文件`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
      pendingFiles.value = []
      loadFileList()
    } else {
      ElNotification({
        title: '上传失败',
        message: response.data.msg || '服务器返回错误',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } catch (error) {
    ElNotification({
      title: '上传失败',
      message: '网络错误或服务器异常，请检查网络连接后重试',
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const handleSelectionChange = (selection: FileInfo[]) => {
  selectedFiles.value = selection
}

const handleSearch = () => {
  console.log('搜索文件:', searchKeyword.value)
}

const handleDownload = async (file: FileInfo) => {
  downloadingFileId.value = file.id
  isDownloading.value = true

  try {
    const response = await axios.get(`/api/file/download/${file.id}`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = file.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElNotification({
      title: '下载成功',
      message: `文件 "${file.fileName}" 已开始下载`,
      type: 'success',
      duration: 3000,
      icon: CircleCheck
    })
  } catch (error) {
    ElNotification({
      title: '下载失败',
      message: `文件 "${file.fileName}" 下载失败，请检查网络连接后重试`,
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  } finally {
    downloadingFileId.value = null
    isDownloading.value = false
  }
}

const handleBatchDownload = async () => {
  if (selectedFiles.value.length === 0) {
    ElNotification({
      title: '提示',
      message: '请先选择要下载的文件',
      type: 'warning',
      duration: 3000
    })
    return
  }

  isDownloading.value = true
  let successCount = 0
  let failCount = 0

  for (const file of selectedFiles.value) {
    try {
      await handleDownload(file)
      successCount++
    } catch (error) {
      failCount++
    }
  }

  isDownloading.value = false

  if (failCount === 0) {
    ElNotification({
      title: '批量下载完成',
      message: `成功下载 ${successCount} 个文件`,
      type: 'success',
      duration: 3000,
      icon: CircleCheck
    })
  } else {
    ElNotification({
      title: '批量下载部分完成',
      message: `成功下载 ${successCount} 个文件，失败 ${failCount} 个文件`,
      type: 'warning',
      duration: 5000
    })
  }
}

const handleDelete = async (file: FileInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.fileName}" 吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    deletingFileId.value = file.id
    isDeleting.value = true

    const response = await axios.delete(`/api/file/${file.id}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    if (response.data.code === 200) {
      ElNotification({
        title: '删除成功',
        message: `文件 "${file.fileName}" 已成功删除`,
        type: 'success',
        duration: 3000,
        icon: CircleCheck
      })
      loadFileList()
    } else {
      ElNotification({
        title: '删除失败',
        message: response.data.msg || '服务器返回错误',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElNotification({
        title: '删除失败',
        message: `文件 "${file.fileName}" 删除失败，请检查网络连接后重试`,
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } finally {
    deletingFileId.value = null
    isDeleting.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedFiles.value.length === 0) {
    ElNotification({
      title: '提示',
      message: '请先选择要删除的文件',
      type: 'warning',
      duration: 3000
    })
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？删除后无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    isDeleting.value = true

    const deletePromises = selectedFiles.value.map(file => 
      axios.delete(`/api/file/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      })
    )

    await Promise.all(deletePromises)

    ElNotification({
      title: '批量删除成功',
      message: `成功删除 ${selectedFiles.value.length} 个文件`,
      type: 'success',
      duration: 3000,
      icon: CircleCheck
    })

    selectedFiles.value = []
    loadFileList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElNotification({
        title: '批量删除失败',
        message: '删除过程中出现错误，请检查网络连接后重试',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } finally {
    isDeleting.value = false
  }
}

const loadFileList = async () => {
  isLoading.value = true

  try {
    const response = await axios.get('/api/file/list', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    if (response.data.code === 200) {
      fileList.value = response.data.data
    } else {
      ElNotification({
        title: '加载失败',
        message: response.data.msg || '获取文件列表失败',
        type: 'error',
        duration: 5000,
        icon: CircleClose
      })
    }
  } catch (error) {
    ElNotification({
      title: '加载失败',
      message: '获取文件列表失败，请检查网络连接后重试',
      type: 'error',
      duration: 5000,
      icon: CircleClose
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!userStore.isSuperAdmin()) {
    ElMessage.error('您没有权限访问该页面')
    router.push('/home')
    return
  }

  loadFileList()
})
</script>

<style scoped>
.file-upload-container {
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

.title {
  font-size: 18px;
  font-weight: 600;
}

.upload-card {
  min-height: calc(100vh - 150px);
}

.upload-area {
  padding: 40px 20px;
  background-color: white;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-icon {
  font-size: 67px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.upload-text .highlight {
  color: #409eff;
  font-weight: 600;
  cursor: pointer;
}

.uploading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 12px !important;
}

.upload-progress {
  margin: 20px 0;
}

.pending-files-list {
  margin: 20px 0;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
}

.pending-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.pending-files-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.pending-files-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.pending-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.pending-file-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.file-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f9ff;
  border-radius: 6px;
  color: #409eff;
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.remove-file-btn {
  flex-shrink: 0;
  padding: 4px 8px;
}

.operation-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  gap: 20px;
  flex-wrap: wrap;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.search-area {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.file-list-area {
  margin-top: 20px;
}

:deep(.el-upload-dragger) {
  padding: 40px 20px;
  background-color: white;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  width: 100%;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f5f7fa;
}

:deep(.el-upload-dragger.is-disabled) {
  border-color: #e4e7ed;
  background-color: #f5f7fa;
  cursor: not-allowed;
}

:deep(.el-divider--horizontal) {
  margin: 20px 0;
}

:deep(.el-button.is-disabled) {
  cursor: not-allowed;
}

:deep(.el-notification) {
  z-index: 9999;
}

@media screen and (max-width: 768px) {
  .file-upload-container {
    padding: 10px;
  }

  .operation-area {
    flex-direction: column;
    align-items: stretch;
  }

  .left-buttons,
  .right-buttons {
    justify-content: center;
  }

  .search-area {
    max-width: 100%;
    width: 100%;
  }

  .upload-area {
    padding: 20px 10px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-text p {
    font-size: 12px;
  }

  .pending-files-list {
    padding: 12px;
  }

  .pending-files-items {
    max-height: 250px;
  }

  .pending-file-item {
    padding: 8px 10px;
    gap: 8px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .file-name {
    font-size: 13px;
  }

  .file-size {
    font-size: 11px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-button) {
    padding: 5px 10px;
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  .page-header {
    padding: 10px 15px;
  }

  .title {
    font-size: 16px;
  }

  .left-buttons,
  .right-buttons {
    flex-direction: column;
    width: 100%;
  }

  .left-buttons .el-button,
  .right-buttons .el-button {
    width: 100%;
  }

  .pending-files-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pending-files-items {
    max-height: 200px;
  }

  .pending-file-item {
    padding: 8px;
  }

  .file-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .file-name {
    font-size: 12px;
  }

  .remove-file-btn {
    padding: 2px 6px;
  }

  :deep(.el-table-column--selection .cell) {
    padding-left: 5px;
    padding-right: 5px;
  }
}
</style>
