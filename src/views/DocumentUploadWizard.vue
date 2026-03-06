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
                <div v-if="fileItem.status === 'hashing'" class="file-progress">
                  <el-progress :percentage="fileItem.progress" :stroke-width="4" :show-text="false" />
                  <span class="progress-text">计算哈希 {{ fileItem.progress }}%</span>
                </div>
                <div v-if="fileItem.status === 'checking'" class="file-progress">
                  <el-progress :percentage="fileItem.progress" :stroke-width="4" :show-text="false" />
                  <span class="progress-text">预校验中...</span>
                </div>
                <div v-if="fileItem.status === 'uploading' || fileItem.status === 'pending'" class="file-progress">
                  <el-progress :percentage="fileItem.progress" :stroke-width="4" :show-text="false" />
                  <span class="progress-text">{{ fileItem.progress }}%</span>
                </div>
                <div v-if="fileItem.status === 'error'" class="file-error">
                  <span class="error-message">{{ fileItem.errorMessage }}</span>
                </div>
                <div v-if="fileItem.status === 'exists'" class="file-exists">
                  <span class="exists-message">{{ fileItem.errorMessage }}</span>
                </div>
              </div>
              <el-button 
                size="small" 
                text 
                @click="removeFile(index)"
                :disabled="isUploading"
                v-if="fileItem.status !== 'success' && fileItem.status !== 'exists'"
              >
                <el-icon><Close /></el-icon>
              </el-button>
              <el-tag v-else-if="fileItem.status === 'success'" size="small" type="success">上传成功</el-tag>
              <el-tag v-else-if="fileItem.status === 'exists'" size="small" type="warning">文件已存在</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 2" class="step-2-content">
        <div v-if="isUploading && parseProgress.totalDocuments > 0" class="progress-container">
          <div class="progress-info">
            <el-icon class="progress-icon"><Loading /></el-icon>
            <div class="progress-details">
              <div class="progress-title">正在处理文档...</div>
              <div class="progress-text">
                <span v-if="parseProgress.currentDocumentName">"{{ parseProgress.currentDocumentName }}"</span>
                <span> ({{ parseProgress.processedDocuments }}/{{ parseProgress.totalDocuments }})</span>
              </div>
              <el-progress 
                :percentage="parseProgress.percentage" 
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        
        <div class="settings-container" :class="{ 'is-processing': isUploading && parseProgress.totalDocuments > 0 }">
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
        <div v-if="isUploading && parseProgress.totalDocuments > 0" class="progress-container">
          <div class="progress-info">
            <el-icon class="progress-icon"><Loading /></el-icon>
            <div class="progress-details">
              <div class="progress-title">正在处理文档...</div>
              <div class="progress-text">
                <span v-if="parseProgress.currentDocumentName">"{{ parseProgress.currentDocumentName }}"</span>
                <span> ({{ parseProgress.processedDocuments }}/{{ parseProgress.totalDocuments }})</span>
              </div>
              <el-progress 
                :percentage="parseProgress.percentage" 
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        
        <div class="preview-container" :class="{ 'is-processing': isUploading && parseProgress.totalDocuments > 0 }">
          <div class="left-sidebar" :class="{ 'is-collapsed': leftSidebarCollapsed }">
            <div class="sidebar-header">
              <span class="sidebar-title">自动分段与清洗</span>
              <el-button 
                v-show="!leftSidebarCollapsed"
                class="collapse-sidebar-btn"
                :icon="ArrowLeft"
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
                <el-tag 
                  size="small" 
                  :type="doc.status === 'completed' ? 'success' : 'warning'" 
                  class="status-tag"
                >
                  {{ doc.status === 'completed' ? '已完成' : '处理中' }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-button 
            v-show="leftSidebarCollapsed"
            class="expand-sidebar-btn"
            :icon="ArrowRight"
            circle
            @click="toggleLeftSidebar"
          />

          <div class="middle-panel">
            <div class="panel-header">
              <span class="panel-title">原始文档预览</span>
            </div>
            <div class="panel-content">
              <DocumentPreview
                v-if="selectedDocument"
                :document-id="selectedDocument.id"
                :file-name="selectedDocument.name"
                :auto-load="true"
                @load-success="handlePreviewLoadSuccess"
                @load-error="handlePreviewLoadError"
              />
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
        :disabled="isPrevButtonDisabled"
        class="prev-button"
        :class="{ 'is-disabled': isPrevButtonDisabled }"
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
        {{ getButtonText() }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, UploadFilled, Document, Close, Check, ArrowDown, QuestionFilled, Loading, ArrowRight, CircleClose, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { createFileParseWebSocket, showFileParseError, showFileParseSuccess } from '@/utils/fileParseWebSocket'
import DocumentPreview from '@/components/DocumentPreview.vue'
import documentPreviewManager from '@/utils/documentPreview'
import SparkMD5 from 'spark-md5'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const steps = ['上传', '创建设置', '分段预览', '数据处理']
const currentStep = ref(1)
const isUploading = ref(false)
const uploadError = ref('')
const knowledgeBaseId = ref<number | null>(null)
const isContinueMode = ref(false)
const documentStatus = ref<'uploaded_not_chunked' | 'chunked' | null>(null)

interface FileItem {
  file: File
  name: string
  size: number
  progress: number
  status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'success' | 'error' | 'exists'
  errorMessage?: string
  hash?: string
  token?: string
}

const selectedFiles = ref<FileItem[]>([])
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedDocumentIds = ref<number[]>([])
const fileParseWebSocket = ref<any>(null)
const parseProgress = ref({
  currentDocument: 0,
  totalDocuments: 0,
  processedDocuments: 0,
  percentage: 0,
  currentDocumentName: ''
})

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

const documentList = ref<DocumentItem[]>([])

const selectedDocId = ref<number | null>(null)
const leftSidebarCollapsed = ref(false)
const isProcessing = ref(false)

const selectedDocument = computed(() => {
  return documentList.value.find(doc => doc.id === selectedDocId.value) || null
})

const isPrevButtonDisabled = computed(() => {
  if (!isContinueMode.value) {
    return false
  }
  return documentStatus.value === 'uploaded_not_chunked' || documentStatus.value === 'chunked'
})

const getButtonText = () => {
  if (currentStep.value === 1) {
    if (isUploading.value) {
      return '上传中...'
    }
    const allCompleted = selectedFiles.value.length > 0 && 
      selectedFiles.value.every(f => f.status === 'success' || f.status === 'exists')
    if (allCompleted) {
      return '下一步'
    }
    return '上传'
  }
  if (currentStep.value === 4) {
    return '完成'
  }
  return '下一步'
}

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
  } else if (currentStep.value === 2) {
    console.log('开始文件解析分段...')
    await handleFileProcess()
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

const calculateFileHash = (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    const chunkSize = 2 * 1024 * 1024
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0

    fileReader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer)
      currentChunk++
      
      if (currentChunk < chunks) {
        loadNext()
      } else {
        const hash = spark.end()
        resolve(hash)
      }
    }

    fileReader.onerror = () => {
      reject(new Error('文件哈希计算失败'))
    }

    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const blob = file.slice(start, end)
      fileReader.readAsArrayBuffer(blob)
      
      const progress = Math.round((currentChunk / chunks) * 100)
      onProgress(progress)
    }

    loadNext()
  })
}

const checkFileExists = async (fileHash: string, fileName: string, fileSize: number): Promise<{ exists: boolean, token?: string, message?: string }> => {
  try {
    const response = await axios.post('/api/v1/file/check', {
      hash: fileHash,
      fileName: fileName,
      fileSize: fileSize
    }, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    if (response.data.code === 200) {
      const data = response.data.data
      if (data.exists) {
        return { exists: true, message: '文件已存在' }
      } else {
        return { exists: false, token: data.token }
      }
    } else {
      throw new Error(response.data.msg || '预校验失败')
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || error.message || '预校验失败')
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

  const filesToUpload: FileItem[] = []
  const existingFiles: FileItem[] = []

  try {
    for (const fileItem of selectedFiles.value) {
      if (fileItem.status === 'success' || fileItem.status === 'exists') {
        continue
      }

      try {
        fileItem.status = 'hashing'
        fileItem.progress = 0

        console.log(`开始计算文件哈希: ${fileItem.name}`)
        const hash = await calculateFileHash(fileItem.file, (progress) => {
          fileItem.progress = progress
        })

        fileItem.hash = hash
        console.log(`文件哈希计算完成: ${fileItem.name}, hash: ${hash}`)

        fileItem.status = 'checking'
        fileItem.progress = 0

        console.log(`开始预校验文件: ${fileItem.name}`)
        const checkResult = await checkFileExists(hash, fileItem.name, fileItem.size)

        if (checkResult.exists) {
          console.log(`文件已存在: ${fileItem.name}`)
          fileItem.status = 'exists'
          fileItem.progress = 100
          fileItem.errorMessage = checkResult.message
          existingFiles.push(fileItem)

          await ElMessageBox.confirm(
            `文件 "${fileItem.name}" 已存在，是否跳转到已存在的文档？`,
            '文件已存在',
            {
              confirmButtonText: '跳转',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            console.log(`用户选择跳转到已存在的文档: ${fileItem.name}`)
            router.push({ name: 'DocumentDetail', params: { id: fileItem.hash } })
          }).catch(() => {
            console.log(`用户取消跳转: ${fileItem.name}`)
          })
        } else {
          console.log(`文件允许上传: ${fileItem.name}, token: ${checkResult.token}`)
          fileItem.token = checkResult.token
          filesToUpload.push(fileItem)
        }
      } catch (error: any) {
        console.error(`文件处理失败: ${fileItem.name}`, error)
        fileItem.status = 'error'
        fileItem.errorMessage = error.message || '处理失败'
      }
    }

    if (filesToUpload.length === 0 && existingFiles.length === 0) {
      ElMessage.warning('没有可上传的文件')
      isUploading.value = false
      return
    }

    if (filesToUpload.length > 0) {
      console.log(`开始上传 ${filesToUpload.length} 个文件`)
      let newUploadedDocumentIds: number[] = []
      
      for (const fileItem of filesToUpload) {
        try {
          fileItem.status = 'uploading'
          fileItem.progress = 0

          const formData = new FormData()
          formData.append('file', fileItem.file)
          formData.append('hash', fileItem.hash || '')
          formData.append('token', fileItem.token || '')

          const batchConfig = {
            splitStrategy: segmentStrategy.value,
            language: 'zh-CN',
            knowledgeBaseId: knowledgeBaseId.value
          }
          formData.append('batchConfig', JSON.stringify(batchConfig))

          console.log(`开始上传文件: ${fileItem.name}`)
          const response = await axios.post('/api/v1/documents/upload', formData, {
            headers: {
              'Authorization': `Bearer ${userStore.token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                fileItem.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              }
            }
          })

          console.log(`文件上传完成: ${fileItem.name}`, response.data)

          if (response.data.code === 200) {
            fileItem.progress = 100
            fileItem.status = 'success'
            if (response.data.data.documentIds) {
              newUploadedDocumentIds = [...newUploadedDocumentIds, ...response.data.data.documentIds]
            }
          } else {
            throw new Error(response.data.msg || '上传失败')
          }
        } catch (error: any) {
          console.error(`文件上传失败: ${fileItem.name}`, error)
          fileItem.status = 'error'
          fileItem.errorMessage = error.message || '上传失败'
        }
      }

      const successCount = filesToUpload.filter(f => f.status === 'success').length
      if (successCount > 0) {
        ElMessage.success(`成功上传 ${successCount} 个文件`)
        
        uploadedDocumentIds.value = newUploadedDocumentIds
        console.log('已上传文档ID列表:', uploadedDocumentIds.value)
        
        cacheDocumentPreviews(uploadedDocumentIds.value)
      }
    }

    const allSuccess = selectedFiles.value.every(f => f.status === 'success' || f.status === 'exists')
    if (allSuccess) {
      currentStep.value = 2
    }
  } catch (error: any) {
    console.error('上传流程失败:', error)
    uploadError.value = '文件上传失败，请重试'
    ElMessage.error(uploadError.value)
  } finally {
    console.log('上传流程结束，重置上传状态')
    isUploading.value = false
  }
}

const handleFileProcess = async () => {
  console.log('handleFileProcess 开始执行')
  console.log('knowledgeBaseId.value:', knowledgeBaseId.value)
  console.log('isContinueMode.value:', isContinueMode.value)
  
  if (!knowledgeBaseId.value) {
    ElMessage.warning('知识库ID不存在')
    return
  }

  let documentIds: number[] = []
  
  if (isContinueMode.value) {
    const documentId = route.query.documentId as string | undefined
    if (documentId) {
      documentIds = [parseInt(documentId, 10)]
      console.log('继续上传模式 - 文档ID:', documentIds)
    }
  } else {
    documentIds = uploadedDocumentIds.value
    console.log('新上传模式 - 文档ID列表:', documentIds)
  }

  if (documentIds.length === 0) {
    ElMessage.warning('没有可处理的文档')
    return
  }

  isUploading.value = true

  try {
    const userId = userStore.userInfo?.username || 'anonymous'
    const wsUrl = `ws://localhost:7676/ws/fileParse/${userId}`
    console.log('创建 WebSocket 连接:', wsUrl)
    
    fileParseWebSocket.value = createFileParseWebSocket(userId)
    
    await fileParseWebSocket.value.connect(wsUrl)
    
    // WebSocket 连接成功后立即显示文档列表
    documentList.value = documentIds.map(id => ({
      id: id,
      name: `文档_${id}`,
      originalContent: '',
      segmentedContent: '',
      status: 'processing' as const
    }))
    
    if (documentList.value.length > 0) {
      selectedDocId.value = documentList.value[0].id
    }
    
    fileParseWebSocket.value.onProgress((data) => {
      console.log('收到进度更新:', data)
      parseProgress.value = {
        currentDocument: data.currentDocument,
        totalDocuments: data.totalDocuments,
        processedDocuments: data.processedDocuments,
        percentage: data.percentage,
        currentDocumentName: data.currentDocumentName || ''
      }
    })
    
    fileParseWebSocket.value.onComplete((data) => {
      console.log('收到处理完成消息:', data)
      const processedDocuments = data.processedDocuments
      
      processedDocuments.forEach(processedDoc => {
        const existingDocIndex = documentList.value.findIndex(doc => doc.id === processedDoc.documentId)
        if (existingDocIndex !== -1) {
          documentList.value[existingDocIndex] = {
            id: processedDoc.documentId,
            name: processedDoc.fileName,
            originalContent: processedDoc.originalContent,
            segmentedContent: processedDoc.chunkData.map(chunk => chunk.content).join('\n\n'),
            status: 'completed' as const
          }
        }
      })

      if (documentList.value.length > 0 && !selectedDocId.value) {
        selectedDocId.value = documentList.value[0].id
      }

      showFileParseSuccess(processedDocuments.length)
      isUploading.value = false
      
      fileParseWebSocket.value?.disconnect()
    })
    
    fileParseWebSocket.value.onError((data) => {
      console.error('收到处理错误:', data)
      showFileParseError(data.message)
      isUploading.value = false
      fileParseWebSocket.value?.disconnect()
    })
    
    fileParseWebSocket.value.sendFileParseRequest({
      kbId: knowledgeBaseId.value,
      documentIds: documentIds,
      parseStrategy: parseStrategy.value,
      extractContent: extractContent.value,
      segmentStrategy: segmentStrategy.value
    })
    
    currentStep.value = 3
    
  } catch (error: any) {
    console.error('WebSocket 连接失败:', error)
    showFileParseError('无法建立连接，请检查网络后重试')
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
    case 'hashing':
    case 'checking':
      return Loading
    case 'exists':
      return Check
    default:
      return Document
  }
}

const handlePreviewLoadSuccess = (url: string) => {
  console.log('文档预览加载成功:', url)
}

const handlePreviewLoadError = (error: string) => {
  console.error('文档预览加载失败:', error)
  ElMessage.error('文档预览加载失败')
}

const cacheDocumentPreviews = async (documentIds: number[]) => {
  for (const docId of documentIds) {
    try {
      const cached = documentPreviewManager.getDocumentPreview(docId)
      if (cached) {
        console.log('文档已有缓存:', docId)
        continue
      }

      const response = await axios.get(`/api/v1/documents/${docId}/preview`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      })

      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const file = new File([blob], `document_${docId}`, { type: blob.type })
      documentPreviewManager.cacheDocumentPreview(docId, file)
      console.log('文档预览已缓存:', docId)
    } catch (error) {
      console.error('缓存文档预览失败:', docId, error)
    }
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
  const status = route.query.status as string | undefined

  if (documentId && step) {
    console.log('现有文档模式 - 文档ID:', documentId, '步骤:', step)
    isContinueMode.value = true
    
    if (status === 'uploaded_not_chunked' || status === 'chunked') {
      documentStatus.value = status as 'uploaded_not_chunked' | 'chunked'
    }
    
    const docId = parseInt(documentId, 10)
    
    const cachedPreview = documentPreviewManager.getDocumentPreview(docId)
    if (cachedPreview) {
      console.log('从缓存加载文档预览:', cachedPreview)
    } else {
      console.log('未找到文档预览缓存，将首次加载')
    }
    
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

onUnmounted(() => {
  console.log('组件卸载，清理 WebSocket 连接')
  fileParseWebSocket.value?.disconnect()
  fileParseWebSocket.value = null
  
  console.log('清理文档预览缓存')
  documentPreviewManager.cleanup()
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
  min-height: calc(100vh - 64px - 72px);
}

.wizard-content.has-step-3,
.wizard-content.has-step-4 {
  padding: 64px 0 72px;
  min-height: calc(100vh - 64px - 72px);
}

.step-1-content,
.step-2-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-height: 0;
}

.step-3-content,
.step-4-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.step-3-content .progress-container {
  flex-shrink: 0;
  max-height: 200px;
}

.step-3-content .preview-container.is-processing {
  opacity: 0.5;
  pointer-events: none;
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

.settings-container.is-processing {
  opacity: 0.5;
  pointer-events: none;
}

.progress-container {
  width: 100%;
  max-width: 800px;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.progress-icon {
  font-size: 48px;
  color: #409eff;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
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

.file-exists {
  margin-top: 4px;
}

.exists-message {
  font-size: 12px;
  color: #e6a23c;
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
  transition: all 0.3s;
}

.prev-button:hover {
  background-color: #e8eaec;
  border-color: #d3d4d6;
  color: #303133;
}

.prev-button.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

.prev-button.is-disabled:hover {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
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
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.left-sidebar {
  width: 320px;
  max-width: 25%;
  background-color: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  position: relative;
}

.left-sidebar.is-collapsed {
  width: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
  height: 38px;
  flex-shrink: 0;
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

.expand-sidebar-btn {
  position: absolute;
  left: 16px;
  top: 19px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  z-index: 10;
}

.expand-sidebar-btn:hover {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
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
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
  height: 38px;
  flex-shrink: 0;
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
  min-height: 0;
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
  .wizard-content {
    padding: 80px 16px 72px;
  }

  .preview-container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
    max-width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .left-sidebar.is-collapsed {
    width: 100%;
    max-height: 38px;
  }

  .sidebar-header {
    height: 38px;
    padding: 10px 16px;
  }

  .expand-sidebar-btn {
    left: 8px;
    top: 19px;
    width: 28px;
    height: 28px;
  }

  .panel-header {
    height: 38px;
    padding: 10px 16px;
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
