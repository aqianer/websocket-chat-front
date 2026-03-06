<template>
  <div class="document-preview-container">
    <div v-if="loading" class="preview-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span class="loading-text">加载中...</span>
    </div>

    <div v-else-if="error" class="preview-error">
      <el-icon class="error-icon"><CircleClose /></el-icon>
      <span class="error-text">{{ error }}</span>
      <el-button size="small" type="primary" @click="handleRetry">重试</el-button>
    </div>

    <div v-else-if="!previewUrl" class="preview-empty">
      <el-icon class="empty-icon"><Document /></el-icon>
      <span class="empty-text">暂无预览</span>
    </div>

    <div v-else class="preview-content">
      <div v-if="fileType === 'image'" class="image-preview">
        <img :src="previewUrl" :alt="fileName" @load="handleImageLoad" @error="handleImageError" />
      </div>

      <div v-else-if="fileType === 'pdf'" class="pdf-preview">
        <iframe :src="previewUrl" class="pdf-iframe" @load="handlePdfLoad" @error="handlePdfError"></iframe>
      </div>

      <div v-else-if="isTextType" class="text-preview">
        <div v-if="isMarkdown" class="markdown-preview">
          <div class="markdown-content" v-html="markdownHtml"></div>
        </div>
        <pre v-else class="text-content">{{ textContent }}</pre>
      </div>

      <div v-else class="unsupported-preview">
        <el-icon class="unsupported-icon"><WarningFilled /></el-icon>
        <span class="unsupported-text">暂不支持此文件类型的预览</span>
        <el-button size="small" type="primary" @click="handleDownload">下载文件</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Loading, CircleClose, Document, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import documentPreviewManager from '@/utils/documentPreview'
import axios from 'axios'

marked.setOptions({
  breaks: true,
  gfm: true
})

interface Props {
  documentId?: number
  fileName?: string
  fileType?: string
  fileUrl?: string
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

const emit = defineEmits<{
  (e: 'load-success', url: string): void
  (e: 'load-error', error: string): void
}>()

const loading = ref(false)
const error = ref('')
const previewUrl = ref('')
const textContent = ref('')
const markdownHtml = ref('')

const fileType = computed(() => {
  if (props.fileType) {
    return props.fileType
  }
  if (props.fileName) {
    return documentPreviewManager.getFileType(props.fileName)
  }
  return 'unknown'
})

const isTextType = computed(() => {
  return fileType.value === 'text' || fileType.value === 'markdown'
})

const isMarkdown = computed(() => {
  if (props.fileName) {
    const ext = props.fileName.split('.').pop()?.toLowerCase()
    return ext === 'md' || ext === 'markdown'
  }
  return fileType.value === 'markdown'
})

const loadPreview = async () => {
  if (!props.documentId && !props.fileUrl) {
    error.value = '缺少文档信息'
    emit('load-error', error.value)
    return
  }

  loading.value = true
  error.value = ''

  try {
    let url = ''

    if (props.documentId) {
      const cached = await documentPreviewManager.getValidDocumentPreview(props.documentId)
      if (cached) {
        url = cached.blobUrl
        console.log('使用缓存的预览:', cached)
      } else {
        url = await fetchDocumentFromServer(props.documentId)
      }
    } else if (props.fileUrl) {
      url = props.fileUrl
    }

    if (fileType.value === 'text' && url) {
      await loadTextContent(url)
    }

    previewUrl.value = url
    emit('load-success', url)
  } catch (err: any) {
    error.value = err.message || '加载预览失败'
    emit('load-error', error.value)
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const fetchDocumentFromServer = async (documentId: number): Promise<string> => {
  try {
    const response = await axios.get(`/api/v1/documents/${documentId}/preview`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const url = URL.createObjectURL(blob)

    const file = new File([blob], props.fileName || `document_${documentId}`, { type: blob.type })
    documentPreviewManager.cacheDocumentPreview(documentId, file)

    return url
  } catch (err: any) {
    throw new Error(err.response?.data?.msg || '从服务器获取文档失败')
  }
}

const loadTextContent = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url)
    const text = await response.text()
    
    if (isMarkdown.value) {
      const rawHtml = marked.parse(text)
      markdownHtml.value = DOMPurify.sanitize(rawHtml) as string
    } else {
      textContent.value = text
    }
  } catch (err: any) {
    throw new Error('加载文本内容失败')
  }
}

const handleImageLoad = () => {
  console.log('图片加载成功')
}

const handleImageError = () => {
  error.value = '图片加载失败'
  emit('load-error', error.value)
}

const handlePdfLoad = () => {
  console.log('PDF 加载成功')
}

const handlePdfError = () => {
  error.value = 'PDF 加载失败'
  emit('load-error', error.value)
}

const handleRetry = () => {
  loadPreview()
}

const handleDownload = async () => {
  if (!previewUrl.value) {
    ElMessage.warning('没有可下载的文件')
    return
  }

  try {
    const link = document.createElement('a')
    link.href = previewUrl.value
    link.download = props.fileName || 'document'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('开始下载')
  } catch (err) {
    ElMessage.error('下载失败')
  }
}

const cleanup = () => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    documentPreviewManager.revokeBlobUrl(previewUrl.value)
  }
}

watch(() => [props.documentId, props.fileUrl], () => {
  if (props.autoLoad) {
    loadPreview()
  }
}, { deep: true })

onMounted(() => {
  if (props.autoLoad) {
    loadPreview()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.document-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.preview-loading,
.preview-error,
.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 200px;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #606266;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
}

.error-text {
  font-size: 14px;
  color: #f56c6c;
  text-align: center;
  max-width: 300px;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
}

.empty-text {
  font-size: 14px;
  color: #909399;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #ffffff;
  overflow: auto;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pdf-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
}

.text-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: auto;
  padding: 20px;
}

.markdown-preview {
  flex: 1;
  overflow: auto;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  word-wrap: break-word;
}

.markdown-content h1 {
  font-size: 2em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #e4e7ed;
}

.markdown-content h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #e4e7ed;
}

.markdown-content h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
}

.markdown-content h4 {
  font-size: 1em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
}

.markdown-content h5 {
  font-size: 0.875em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
}

.markdown-content h6 {
  font-size: 0.85em;
  font-weight: 600;
  margin: 1.5em 0 0.5em 0;
  color: #606266;
}

.markdown-content p {
  margin: 1em 0;
}

.markdown-content a {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s;
}

.markdown-content a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #f5f7fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e6a23c;
}

.markdown-content pre {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
  color: #303133;
}

.markdown-content blockquote {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 1em 0;
  color: #606266;
  background-color: #ecf5ff;
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-content li {
  margin: 0.5em 0;
}

.markdown-content ul li {
  list-style-type: disc;
}

.markdown-content ol li {
  list-style-type: decimal;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 14px;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #e4e7ed;
  padding: 12px;
  text-align: left;
}

.markdown-content th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.markdown-content tr:nth-child(even) {
  background-color: #fafafa;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 2em 0;
}

.text-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  margin: 0;
}

.unsupported-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background-color: #ffffff;
}

.unsupported-icon {
  font-size: 64px;
  color: #e6a23c;
}

.unsupported-text {
  font-size: 14px;
  color: #909399;
  text-align: center;
  max-width: 300px;
}

@media (max-width: 768px) {
  .image-preview {
    padding: 10px;
  }

  .text-preview {
    padding: 12px;
  }

  .text-content {
    font-size: 12px;
  }

  .loading-icon,
  .error-icon,
  .empty-icon,
  .unsupported-icon {
    font-size: 36px;
  }
}
</style>
