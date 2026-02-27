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

    <div class="wizard-content">
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
            <el-button size="small" text @click="clearFiles">清空</el-button>
          </div>
          <div class="files-list">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <el-button size="small" text @click="removeFile(index)">
                <el-icon><Close /></el-icon>
              </el-button>
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
        @click="handleNextStep"
        class="next-button"
      >
        {{ currentStep === 4 ? '完成' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, UploadFilled, Document, Close, Check, ArrowDown, QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()

const steps = ['上传', '创建设置', '分段预览', '数据处理']
const currentStep = ref(1)
const selectedFiles = ref<File[]>([])
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
  { label: '自动分段与清洗', value: 'auto', desc: '自动分段与预处理规则' },
  { label: '自定义', value: 'custom', desc: '自定义分段规则、分段长度及预处理规则' },
  { label: '按层级分段', value: 'hierarchy', desc: '按照文档层级结构分段，将文档转化为有层级信息的树结构' }
]

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
    alert(`最多只能上传 ${maxFiles} 个文件`)
    return
  }

  files.forEach(file => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      alert(`不支持的文件类型：${file.name}`)
      return
    }

    if (file.size > maxSize) {
      alert(`文件大小超过限制：${file.name}（最大100MB）`)
      return
    }

    selectedFiles.value.push(file)
  })
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
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

const handleNextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  } else {
    console.log('完成上传流程')
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
  align-items: center;
  padding: 100px 24px 80px;
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
  align-items: center;
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
}

.file-name {
  flex: 1;
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
</style>
