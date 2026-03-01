<template>
  <div class="upload-wizard-container">
    <div class="wizard-header">
      <div class="header-left">
        <el-button @click="handleBack" circle class="back-button">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="header-title">添加内容</span>
      </div>
      <div class="header-center">
        <div class="step-indicator">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="step-item"
            :class="{ 'is-active': currentStep === index + 1, 'is-completed': index + 1 < currentStep }"
          >
            <div class="step-number">
              <el-icon v-if="index + 1 < currentStep" class="check-icon"><Check /></el-icon>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-name">{{ step }}</div>
          </div>
        </div>
      </div>
      <div class="header-right"></div>
    </div>

    <div class="wizard-content" :class="{ 'has-step-3': currentStep === 3, 'has-step-4': currentStep === 4 }">
      <div v-if="currentStep === 1" class="step-1-content">
        <div 
          class="upload-area"
          :class="{ 'is-dragover': isDragOver }"
          @click="handleUploadClick"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <input 
            ref="fileInputRef"
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx,.md"
            @change="handleFileSelect"
            style="display: none"
          >
          <div class="upload-icon">
            <el-icon><UploadFilled /></el-icon>
          </div>
          <div class="upload-title">点击上传或拖拽文档到这里</div>
          <div class="upload-hint">
            支持 PDF、TXT、DOC、DOCX、MD，最多可上传 300 个文件，每个文件不超过 100MB，PDF 最多 500 页
          </div>
        </div>

        <div v-if="selectedFiles.length > 0" class="selected-files">
          <div class="files-header">
            <span class="files-title">已选择 {{ selectedFiles.length }} 个文件</span>
            <el-button size="small" text @click="clearFiles" :disabled="isUploading">清空</el-button>
          </div>
          <div v-if="uploadError" class="upload-error">
            <el-icon><CircleClose /></el-icon>
            <span>{{ uploadError }}</span>
          </div>
          <div class="files-list">
            <div v-for="(fileItem, index) in selectedFiles" :key="index" class="file-item">
              <el-icon class="file-icon">
                <component :is="getFileStatusIcon(fileItem.status)" />
              </el-icon>
              <div class="file-info">
                <span class="file-name">{{ fileItem.name }}</span>
                <span class="file-size">{{ formatFileSize(fileItem.size) }}</span>
                <div v-if="fileItem.status === 'uploading' || fileItem.status === 'pending'" class="file-progress">
                  <el-progress :percentage="fileItem.progress" :stroke-width="4" :show-text="false" />
                  <span class="progress-text">{{ fileItem.progress }}%</span>
                </div>
                <div v-if="fileItem.status === 'error'" class="file-error">
                  <span class="error-message">{{ fileItem.errorMessage }}</span>
                </div>
              </div>
              <el-button 
                size="small" 
                text 
                @click="removeFile(index)"
                :disabled="isUploading"
                v-if="fileItem.status !== 'success'"
              >
                <el-icon><Close /></el-icon>
              </el-button>
              <el-tag v-else size="small" type="success">上传成功</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 2" class="step-2-content">
        <div class="settings-container">
          <div class="collapse-panel" :class="{ 'is-collapsed': !parsePanelExpanded }">
            <div class="collapse-header" @click="toggleParsePanel">
              <span class="collapse-title">文档解析策略</span>
              <el-icon class="collapse-icon" :class="{ 'is-rotated': !parsePanelExpanded }">
                <ArrowDown />
              </el-icon>
            </div>
            <div v-show="parsePanelExpanded" class="collapse-content">
              <div class="option-group">
                <div 
                  class="option-card"
                  :class="{ 'is-selected': parseStrategy === 'precise' }"
                  @click="selectParseStrategy('precise')"
                >
                  <div class="option-header">
                    <div class="option-title">精准解析</div>
                    <div class="option-radio" :class="{ 'is-checked': parseStrategy === 'precise' }">
                      <div class="radio-inner"></div>
                    </div>
                  </div>
                  <div class="option-desc">将从文档中提取图片、表格等元素，需要耗费更长的时间</div>
                  <div v-if="parseStrategy === 'precise'" class="option-subsection">
                    <div class="subsection-title">提取内容</div>
                    <div class="checkbox-group">
                      <div 
                        v-for="item in extractItems" 
                        :key="item.value"
                        class="checkbox-item"
                        @click.stop="toggleExtractItem(item.value)"
                      >
                        <div class="checkbox" :class="{ 'is-checked': extractContent.includes(item.value) }">
                          <el-icon v-if="extractContent.includes(item.value)" class="check-icon-small">
                            <Check />
                          </el-icon>
                        </div>
                        <span class="checkbox-label">{{ item.label }}</span>
                        <el-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top">
                          <el-icon class="help-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </div>
                    <div class="subsection-divider"></div>
                    <div class="subsection-title">内容过滤 设置过滤内容</div>
                    <div class="filter-input">
                      <div class="filter-placeholder">未设置任何过滤内容</div>
                    </div>
                  </div>
                </div>

                <div 
                  class="option-card"
                  :class="{ 'is-selected': parseStrategy === 'fast' }"
                  @click="selectParseStrategy('fast')"
                >
                  <div class="option-header">
                    <div class="option-title">快速解析</div>
                    <div class="option-radio" :class="{ 'is-checked': parseStrategy === 'fast' }">
                      <div class="radio-inner"></div>
                    </div>
                  </div>
                  <div class="option-desc">不会对文档提取图像、表格等元素，适用于纯文本</div>
                </div>
              </div>
            </div>
          </div>

          <div class="collapse-panel" :class="{ 'is-collapsed': !segmentPanelExpanded }">
            <div class="collapse-header" @click="toggleSegmentPanel">
              <span class="collapse-title">分段策略</span>
              <el-icon class="collapse-icon" :class="{ 'is-rotated': !segmentPanelExpanded }">
                <ArrowDown />
              </el-icon>
            </div>
            <div v-show="segmentPanelExpanded" class="collapse-content">
              <div class="option-group">
                <div 
                  v-for="strategy in segmentStrategies"
                  :key="strategy.value"
                  class="option-card"
                  :class="{ 'is-selected': segmentStrategy === strategy.value }"
                  @click="selectSegmentStrategy(strategy.value)"
                >
                  <div class="option-header">
                    <div class="option-title">{{ strategy.label }}</div>
                    <div class="option-radio" :class="{ 'is-checked': segmentStrategy === strategy.value }">
                      <div class="radio-inner"></div>
                    </div>
                  </div>
                  <div class="option-desc">{{ strategy.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 3" class="step-3-content">
        <div class="preview-container">
          <div class="left-sidebar" :class="{ 'is-collapsed': leftSidebarCollapsed }">
            <div class="sidebar-header">
              <span class="sidebar-title">自动分段与清洗</span>
              <el-button 
                class="collapse-sidebar-btn"
                :icon="leftSidebarCollapsed ? ArrowRight : ArrowLeft"
                circle
                @click="toggleLeftSidebar"
              />
            </div>
            <div v-show="!leftSidebarCollapsed" class="document-list">
              <div 
                v-for="doc in documentList"
                :key="doc.id"
                class="document-item"
                :class="{ 'is-selected': selectedDocId === doc.id }"
                @click="selectDocument(doc.id)"
              >
                <div class="document-info">
                  <el-icon class="document-icon"><Document /></el-icon>
                  <span class="document-name">{{ doc.name }}</span>
                </div>
                <el-tag size="small" type="warning" class="status-tag">处理中</el-tag>
              </div>
            </div>
          </div>

          <div class="middle-panel">
            <div class="panel-header">
              <span class="panel-title">原始文档预览</span>
            </div>
            <div class="panel-content">
              <div v-if="selectedDocument" class="preview-text">
                {{ selectedDocument.originalContent }}
              </div>
              <div v-else class="empty-state">
                <el-icon class="empty-icon"><Document /></el-icon>
                <span class="empty-text">请选择文档查看预览</span>
              </div>
            </div>
          </div>

          <div class="right-panel">
            <div class="panel-header">
              <span class="panel-title">分段预览</span>
            </div>
            <div class="panel-content">
              <div v-if="selectedDocument" class="preview-text">
                <div v-if="isProcessing" class="loading-overlay">
                  <div class="loading-spinner"></div>
                  <span class="loading-text">正在处理分段...</span>
                </div>
                <div v-else class="segmented-content">
                  {{ selectedDocument.segmentedContent }}
                </div>
              </div>
              <div v-else class="empty-state">
                <el-icon class="empty-icon"><Document /></el-icon>
                <span class="empty-text">请选择文档查看预览</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 4" class="step-4-content">
        <div class="data-processing-container">
          <div class="processing-status">
            <el-icon class="processing-icon"><Loading /></el-icon>
            <span class="processing-text">数据处理中...</span>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-footer">
      <el-button 
        v-if="currentStep > 1"
        @click="handlePrevStep"
        class="prev-button"
      >
        上一步
      </el-button>
      <el-button 
        type="primary" 
        :disabled="currentStep === 1 && selectedFiles.length === 0"
        :loading="isUploading"
        @click="handleNextStep"
        class="next-button"
      >
        {{ isUploading ? '上传中...' : (currentStep === 4 ? '完成' : '下一步') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, UploadFilled, Document, Close, Check, ArrowDown, QuestionFilled, Loading, ArrowRight, CircleClose, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const steps = ['上传', '创建设置', '分段预览', '数据处理']
const currentStep = ref(1)
const isUploading = ref(false)
const uploadError = ref('')
const knowledgeBaseId = ref<number | null>(null)

interface FileItem {
  file: File
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

const selectedFiles = ref<FileItem[]>([])
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const parsePanelExpanded = ref(true)
const segmentPanelExpanded = ref(true)
const parseStrategy = ref<'precise' | 'fast'>('precise')
const segmentStrategy = ref<'auto' | 'custom' | 'hierarchy'>('auto')
const extractContent = ref<string[]>(['image', 'ocr', 'table'])

const extractItems = [
  { label: '图片元素', value: 'image', tooltip: '提取文档中的图片内容' },
  { label: '扫描件（OCR）', value: 'ocr', tooltip: '对扫描件进行文字识别' },
  { label: '表格元素', value: 'table', tooltip: '提取文档中的表格数据' }
]

const segmentStrategies = [
  { label: '自动分段与清洗', value: 'auto' as const, desc: '自动分段与预处理规则' },
  { label: '自定义', value: 'custom' as const, desc: '自定义分段规则、分段长度及预处理规则' },
  { label: '按层级分段', value: 'hierarchy' as const, desc: '按照文档层级结构分段，将文档转化为有层级信息的树结构' }
]

interface DocumentItem {
  id: number
  name: string
  originalContent: string
  segmentedContent: string
  status: 'processing' | 'completed' | 'failed'
}

const documentList = ref<DocumentItem[]>([
  {
    id: 1,
    name: 'requirements.txt',
    originalContent: `# 项目依赖

## 前端依赖
- vue@3.4.0
- element-plus@2.5.0
- vue-router@4.6.4
- pinia@3.0.4
- axios@1.6.0

## 后端依赖
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- mysql-connector-java
- lombok

## 开发工具
- vite@5.0.0
- typescript@5.3.3
- vitest@1.0.0`,
    segmentedContent: `# 项目依赖

## 前端依赖
- vue@3.4.0
- element-plus@2.5.0
- vue-router@4.6.4
- pinia@3.0.4
- axios@1.6.0

## 后端依赖
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- mysql-connector-java
- lombok

## 开发工具
- vite@5.0.0
- typescript@5.3.3
- vitest@1.0.0`,
    status: 'processing'
  },
  {
    id: 2,
    name: '融合计费系统全量业务文档.md',
    originalContent: `# 融合计费系统业务文档

## 1. 系统概述
融合计费系统是一个综合性的计费管理平台，支持多种计费模式和业务场景。

## 2. 核心功能
- 用户管理
- 套餐管理
- 计费规则配置
- 账单生成
- 充值管理
- 报表统计

## 3. 业务流程
1. 用户注册
2. 选择套餐
3. 充值
4. 使用服务
5. 生成账单
6. 缴费

## 4. 技术架构
- 前端：Vue3 + Element Plus
- 后端：Spring Boot
- 数据库：MySQL
- 缓存：Redis`,
    segmentedContent: `# 融合计费系统业务文档

## 1. 系统概述
融合计费系统是一个综合性的计费管理平台，支持多种计费模式和业务场景。

## 2. 核心功能
- 用户管理
- 套餐管理
- 计费规则配置
- 账单生成
- 充值管理
- 报表统计

## 3. 业务流程
1. 用户注册
2. 选择套餐
3. 充值
4. 使用服务
5. 生成账单
6. 缴费

## 4. 技术架构
- 前端：Vue3 + Element Plus
- 后端：Spring Boot
- 数据库：MySQL
- 缓存：Redis`,
    status: 'processing'
  }
])

const selectedDocId = ref<number | null>(null)
const leftSidebarCollapsed = ref(false)
const isProcessing = ref(false)

const selectedDocument = computed(() => {
  return documentList.value.find(doc => doc.id === selectedDocId.value) || null
})

const handleBack = () => {
  router.back()
}

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addFiles(files)
  target.value = ''
}

const handleDragEnter = () => {
  isDragOver.value = true
}

const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  addFiles(files)
}

const addFiles = (files: File[]) => {
  const maxSize = 100 * 1024 * 1024
  const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.md']
  const maxFiles = 300

  if (selectedFiles.value.length + files.length > maxFiles) {
    ElMessage.warning(`最多只能上传 ${maxFiles} 个文件`)
    return
  }

  files.forEach(file => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      ElMessage.error(`不支持的文件类型：${file.name}`)
      return
    }

    if (file.size > maxSize) {
      ElMessage.error(`文件大小超过限制：${file.name}（最大100MB）`)
      return
    }

    selectedFiles.value.push({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    })
  })
}

const removeFile = (index: number) => {
  if (isUploading.value) return
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
  if (isUploading.value) return
  selectedFiles.value = []
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handlePrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleNextStep = async () => {
  console.log('当前步骤:', currentStep.value)
  console.log('已选择文件数量:', selectedFiles.value.length)
  console.log('知识库ID:', knowledgeBaseId.value)

  if (currentStep.value === 1) {
    if (selectedFiles.value.length === 0) {
      ElMessage.warning('请先选择要上传的文件')
      return
    }

    console.log('开始批量上传...')
    await handleBatchUpload()
  } else if (currentStep.value < 4) {
    currentStep.value++
    if (currentStep.value === 3 && selectedDocId.value === null) {
      selectedDocId.value = documentList.value[0]?.id || null
    }
  } else {
    console.log('完成上传流程')
    router.push({ name: 'Home' })
  }
}

const handleBatchUpload = async () => {
  console.log('handleBatchUpload 开始执行')
  console.log('selectedFiles.value:', selectedFiles.value)
  console.log('selectedFiles.value.length:', selectedFiles.value.length)

  if (selectedFiles.value.length === 0) {
    console.warn('文件列表为空，阻止上传')
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  console.log('knowledgeBaseId.value:', knowledgeBaseId.value)

  if (!knowledgeBaseId.value) {
    console.warn('知识库ID为空，使用默认值')
    ElMessage.warning('未指定知识库，将使用默认知识库')
    knowledgeBaseId.value = 1
  }

  console.log('开始设置上传状态...')
  isUploading.value = true
  uploadError.value = ''

  const formData = new FormData()
  selectedFiles.value.forEach((fileItem) => {
    formData.append('files[]', fileItem.file)
  })
  console.log('FormData 已创建，文件数量:', selectedFiles.value.length)

  const batchConfig = {
    splitStrategy: segmentStrategy.value,
    language: 'zh-CN',
    knowledgeBaseId: knowledgeBaseId.value
  }
  formData.append('batchConfig', JSON.stringify(batchConfig))
  console.log('batchConfig:', JSON.stringify(batchConfig))

  try {
    console.log('开始发送请求到 /api/v1/documents/upload')
    const response = await axios.post('/api/v1/documents/upload', formData, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const overallProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          selectedFiles.value.forEach(fileItem => {
            if (fileItem.status === 'uploading' || fileItem.status === 'pending') {
              fileItem.progress = overallProgress
              fileItem.status = 'uploading'
            }
          })
        }
      }
    })

    console.log('收到响应:', response.data)

    if (response.data.code === 200) {
      selectedFiles.value.forEach(fileItem => {
        fileItem.progress = 100
        fileItem.status = 'success'
      })

      ElMessage.success(`成功上传 ${selectedFiles.value.length} 个文件`)
      currentStep.value = 2
    } else {
      throw new Error(response.data.msg || '上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    uploadError.value = '文件上传失败，请重试'
    selectedFiles.value.forEach(fileItem => {
      if (fileItem.status !== 'success') {
        fileItem.status = 'error'
        fileItem.errorMessage = error.message || '上传失败'
      }
    })
    ElMessage.error(uploadError.value)
  } finally {
    console.log('上传流程结束，重置上传状态')
    isUploading.value = false
  }
}

const toggleParsePanel = () => {
  parsePanelExpanded.value = !parsePanelExpanded.value
}

const toggleSegmentPanel = () => {
  segmentPanelExpanded.value = !segmentPanelExpanded.value
}

const selectParseStrategy = (strategy: 'precise' | 'fast') => {
  parseStrategy.value = strategy
}

const selectSegmentStrategy = (strategy: 'auto' | 'custom' | 'hierarchy') => {
  segmentStrategy.value = strategy
}

const toggleExtractItem = (value: string) => {
  const index = extractContent.value.indexOf(value)
  if (index > -1) {
    extractContent.value.splice(index, 1)
  } else {
    extractContent.value.push(value)
  }
}

const selectDocument = (id: number) => {
  selectedDocId.value = id
  isProcessing.value = true
  
  setTimeout(() => {
    isProcessing.value = false
  }, 2000)
}

const toggleLeftSidebar = () => {
  leftSidebarCollapsed.value = !leftSidebarCollapsed.value
}

const getFileStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return CircleCheck
    case 'error':
      return CircleClose
    case 'uploading':
      return Loading
    default:
      return Document
  }
}

onMounted(() => {
  const kbId = route.params.kbId as string | undefined
  console.log('路由参数 kbId:', kbId)
  if (kbId) {
    knowledgeBaseId.value = parseInt(kbId, 10)
    console.log('解析后的知识库ID:', knowledgeBaseId.value)
  } else {
    console.warn('未提供知识库ID参数')
  }

  const documentId = route.query.documentId as string | undefined
  const step = route.query.step as string | undefined
  const chunkData = route.query.chunkData as string | undefined

  if (documentId && step) {
    console.log('现有文档模式 - 文档ID:', documentId, '步骤:', step)
    
    if (chunkData) {
      try {
        const parsedChunkData = JSON.parse(chunkData)
        console.log('解析的分块数据:', parsedChunkData)
        
        const existingDoc = {
          id: parseInt(documentId),
          name: `文档_${documentId}`,
          originalContent: '已上传文档内容',
          segmentedContent: parsedChunkData.map((chunk: any) => chunk.content).join('\n\n'),
          status: 'completed' as const
        }
        
        documentList.value = [existingDoc]
        selectedDocId.value = existingDoc.id
      } catch (error) {
        console.error('解析分块数据失败:', error)
      }
    }

    const stepNumber = parseInt(step, 10)
    if (stepNumber >= 1 && stepNumber <= 4) {
      currentStep.value = stepNumber
      console.log('设置当前步骤为:', currentStep.value)
    }
  }
})
</script>

<style scoped>
.upload-wizard-container {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  display: flex;
  flex-direction: column;
}

.wizard-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.back-button {
  border: none;
  background: transparent;
  color: #303133;
}

.back-button:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 32px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.step-item.is-active {
  color: #409eff;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.step-item.is-active .step-number {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.step-item.is-completed .step-number {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.check-icon {
  font-size: 14px;
}

.header-right {
  min-width: 200px;
}

.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 80px 24px 80px;
  overflow: hidden;
}

.wizard-content.has-step-3,
.wizard-content.has-step-4 {
  padding: 64px 0 72px;
}

.step-1-content,
.step-2-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-3-content,
.step-4-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.step-1-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-2-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.settings-container {
  width: 100%;
  max-width: 800px;
  padding: 24px 0;
}

.collapse-panel {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.collapse-panel.is-collapsed {
  border-radius: 8px;
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.collapse-header:hover {
  background-color: #f5f7fa;
}

.collapse-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.collapse-icon {
  font-size: 16px;
  color: #909399;
  transition: transform 0.3s;
}

.collapse-icon.is-rotated {
  transform: rotate(-90deg);
}

.collapse-content {
  padding: 0 20px 20px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: white;
}

.option-card:hover {
  border-color: #c0c4cc;
  background-color: #fafafa;
}

.option-card.is-selected {
  border-color: #722ed1;
  background-color: #f9f0ff;
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #d9d9d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.option-radio.is-checked {
  border-color: #722ed1;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #722ed1;
  opacity: 0;
  transition: opacity 0.3s;
}

.option-radio.is-checked .radio-inner {
  opacity: 1;
}

.option-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.option-subsection {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
  background-color: white;
}

.checkbox.is-checked {
  border-color: #722ed1;
  background-color: #722ed1;
}

.check-icon-small {
  font-size: 12px;
  color: white;
}

.checkbox-label {
  font-size: 14px;
  color: #606266;
}

.help-icon {
  font-size: 14px;
  color: #909399;
  cursor: help;
  transition: color 0.2s;
}

.help-icon:hover {
  color: #409eff;
}

.subsection-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 16px 0;
}

.filter-input {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  min-height: 40px;
}

.filter-placeholder {
  font-size: 14px;
  color: #c0c4cc;
}

.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px 80px;
}

.upload-area {
  width: 100%;
  max-width: 640px;
  min-height: 320px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.upload-area.is-dragover {
  border-color: #409eff;
  background-color: #e6f7ff;
}

.upload-icon {
  font-size: 64px;
  color: #409eff;
  margin-bottom: 24px;
}

.upload-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  text-align: center;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
  text-align: center;
  line-height: 1.6;
  max-width: 480px;
}

.selected-files {
  width: 100%;
  max-width: 640px;
  margin-top: 24px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fef0f0;
  color: #f56c6c;
  font-size: 14px;
  border-bottom: 1px solid #fde2e2;
}

.upload-error .el-icon {
  font-size: 16px;
}

.files-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.files-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #f5f7fa;
}

.file-icon {
  font-size: 20px;
  color: #409eff;
  flex-shrink: 0;
  margin-top: 2px;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.file-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.file-progress .el-progress {
  flex: 1;
  min-width: 0;
}

.progress-text {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.file-error {
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: #f56c6c;
}

.wizard-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  gap: 12px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.prev-button {
  min-width: 100px;
  height: 40px;
  font-size: 14px;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
}

.prev-button:hover {
  background-color: #e8eaec;
  border-color: #d3d4d6;
  color: #303133;
}

.next-button {
  min-width: 120px;
  height: 40px;
  font-size: 14px;
}

.next-button:disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

@media (max-width: 768px) {
  .wizard-header {
    padding: 0 16px;
  }

  .header-left,
  .header-right {
    min-width: auto;
  }

  .header-title {
    display: none;
  }

  .step-indicator {
    gap: 16px;
  }

  .step-name {
    display: none;
  }

  .wizard-content {
    padding: 80px 16px 72px;
  }

  .upload-area {
    min-height: 280px;
    padding: 32px 24px;
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .upload-title {
    font-size: 16px;
  }

  .upload-hint {
    font-size: 12px;
  }

  .wizard-footer {
    padding: 0 16px;
  }

  .settings-container {
    max-width: 100%;
    padding: 16px 0;
  }

  .collapse-panel {
    margin-bottom: 12px;
  }

  .collapse-header {
    padding: 14px 16px;
  }

  .collapse-title {
    font-size: 15px;
  }

  .collapse-content {
    padding: 0 16px 16px;
  }

  .option-card {
    padding: 14px;
  }

  .option-title {
    font-size: 14px;
  }

  .option-desc {
    font-size: 12px;
  }

  .subsection-title {
    font-size: 13px;
  }

  .checkbox-label {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .wizard-header {
    height: 56px;
  }

  .step-number {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .wizard-content {
    padding: 72px 12px 64px;
  }

  .upload-area {
    min-height: 240px;
    padding: 24px 16px;
  }

  .upload-icon {
    font-size: 40px;
  }

  .upload-title {
    font-size: 14px;
  }

  .upload-hint {
    font-size: 11px;
  }

  .wizard-footer {
    height: 64px;
    padding: 0 12px;
  }

  .prev-button,
  .next-button {
    min-width: 80px;
    height: 36px;
    font-size: 13px;
  }

  .collapse-header {
    padding: 12px 14px;
  }

  .collapse-title {
    font-size: 14px;
  }

  .option-card {
    padding: 12px;
  }

  .option-title {
    font-size: 13px;
  }

  .option-desc {
    font-size: 12px;
  }

  .checkbox-group {
    gap: 10px;
  }

  .filter-input {
    padding: 10px 12px;
    min-height: 36px;
  }

  .filter-placeholder {
    font-size: 13px;
  }
}

.step-3-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 0;
}

.left-sidebar {
  width: 280px;
  background-color: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.left-sidebar.is-collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.collapse-sidebar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  flex-shrink: 0;
}

.collapse-sidebar-btn:hover {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.document-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.document-item:hover {
  background-color: #f5f7fa;
}

.document-item.is-selected {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.document-icon {
  font-size: 18px;
  color: #409eff;
  flex-shrink: 0;
}

.document-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.status-tag {
  flex-shrink: 0;
  font-size: 12px;
}

.middle-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-right: 1px solid #e4e7ed;
  min-width: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #ffffff;
}

.preview-text {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #909399;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #909399;
}

.segmented-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.step-4-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 24px 80px;
}

.data-processing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.processing-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.processing-icon {
  font-size: 64px;
  color: #409eff;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.processing-text {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

@media (max-width: 768px) {
  .preview-container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .left-sidebar.is-collapsed {
    width: 100%;
    max-height: 48px;
  }

  .document-list {
    max-height: 150px;
  }

  .middle-panel,
  .right-panel {
    min-height: 300px;
  }

  .panel-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .sidebar-header {
    padding: 12px 16px;
  }

  .sidebar-title {
    font-size: 14px;
  }

  .document-item {
    padding: 10px 16px;
  }

  .document-name {
    font-size: 13px;
  }

  .panel-header {
    padding: 12px 16px;
  }

  .panel-title {
    font-size: 14px;
  }

  .panel-content {
    padding: 12px;
  }

  .preview-text {
    font-size: 13px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
  }

  .loading-text {
    font-size: 13px;
  }
}
</style>
