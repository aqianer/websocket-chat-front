# 文档预览功能实现说明

## 功能概述

本文档说明了一个完整的文档上传和预览前端功能的实现，包括 Blob URL 生成、localStorage 缓存管理、缓存过期控制、Blob URL 释放管理，以及针对不同文件类型（图片、PDF、文本）的预览适配。

## 核心功能

### 1. Blob URL 管理和缓存

**文件位置**: `src/utils/documentPreview.ts`

`DocumentPreviewManager` 类提供了完整的文档预览管理功能：

#### 主要特性

- **Blob URL 生成**: 使用 `URL.createObjectURL()` 生成本地预览链接
- **localStorage 缓存**: 将文件 ID 和 Blob URL 缓存到 localStorage
- **缓存过期控制**: 支持自定义 TTL（默认 30 分钟）
- **自动清理**: 自动清理过期缓存和限制缓存大小
- **Blob URL 释放**: 自动释放不再使用的 Blob URL，防止内存泄漏

#### 核心方法

```typescript
// 创建 Blob URL
createBlobUrl(file: File): string

// 缓存文档预览
cacheDocumentPreview(documentId: number, file: File, ttl?: number): string

// 获取文档预览
getDocumentPreview(documentId: number): DocumentPreviewCacheItem | null

// 获取有效的文档预览（验证 Blob URL 是否有效）
getValidDocumentPreview(documentId: number): Promise<DocumentPreviewCacheItem | null>

// 移除文档预览
removeDocumentPreview(documentId: number): void

// 清理所有预览
clearAllPreviews(): void
```

### 2. 文档预览组件

**文件位置**: `src/components/DocumentPreview.vue`

`DocumentPreview` 组件提供了统一的文档预览界面：

#### 支持的文件类型

- **图片**: JPG, PNG, GIF, BMP, WEBP, SVG
- **PDF**: 直接在 iframe 中预览
- **文本**: TXT 等纯文本文件
- **Markdown**: MD, MARKDOWN 文件，支持完整的 Markdown 语法渲染
- **其他**: 显示不支持提示并提供下载功能

#### Markdown 渲染特性

项目使用 `marked` 和 `DOMPurify` 库实现 Markdown 渲染：

- **完整语法支持**: 支持标题、列表、代码块、表格、引用、链接、图片等
- **GFM 支持**: 启用 GitHub Flavored Markdown 扩展语法
- **安全防护**: 使用 `DOMPurify` 清理 HTML，防止 XSS 攻击
- **自动换行**: 启用 `breaks` 选项，支持自动换行
- **精美样式**: 提供完整的 Markdown 样式，包括代码高亮、表格样式等

##### Markdown 配置

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true,  // 启用换行符转换为 <br>
  gfm: true      // 启用 GitHub Flavored Markdown
})

// 渲染并清理 HTML
const rawHtml = marked.parse(markdownText)
const safeHtml = DOMPurify.sanitize(rawHtml)
```

#### 组件属性

```typescript
interface Props {
  documentId?: number      // 文档 ID
  fileName?: string        // 文件名
  fileType?: string        // 文件类型
  fileUrl?: string         // 文件 URL（可选）
  autoLoad?: boolean      // 是否自动加载（默认 true）
}
```

#### 组件事件

```typescript
@load-success="handlePreviewLoadSuccess"  // 预览加载成功
@load-error="handlePreviewLoadError"      // 预览加载失败
```

### 3. 集成到上传向导

**文件位置**: `src/views/DocumentUploadWizard.vue`

在文档上传向导中集成了预览功能：

#### 实现的功能

1. **上传后自动缓存**: 文件上传成功后，自动获取并缓存文档预览
2. **页面刷新恢复**: 页面刷新时从 localStorage 读取缓存
3. **Blob URL 验证**: 使用缓存的 Blob URL 前先验证其有效性
4. **自动重试**: Blob URL 失效时自动从服务器重新获取
5. **资源清理**: 组件卸载时自动清理 Blob URL 和缓存

#### 关键代码

```typescript
// 缓存文档预览
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

// 页面刷新时从缓存加载
onMounted(() => {
  const documentId = route.query.documentId as string | undefined
  
  if (documentId) {
    const docId = parseInt(documentId, 10)
    
    const cachedPreview = documentPreviewManager.getDocumentPreview(docId)
    if (cachedPreview) {
      console.log('从缓存加载文档预览:', cachedPreview)
    } else {
      console.log('未找到文档预览缓存，将首次加载')
    }
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  fileParseWebSocket.value?.disconnect()
  documentPreviewManager.cleanup()
})
```

## 使用示例

### 基本使用

```vue
<template>
  <DocumentPreview
    :document-id="123"
    :file-name="document.pdf"
    :auto-load="true"
    @load-success="handleSuccess"
    @load-error="handleError"
  />
</template>

<script setup lang="ts">
import DocumentPreview from '@/components/DocumentPreview.vue'

const handleSuccess = (url: string) => {
  console.log('预览加载成功:', url)
}

const handleError = (error: string) => {
  console.error('预览加载失败:', error)
}
</script>
```

### Markdown 文件预览

```vue
<template>
  <DocumentPreview
    :document-id="456"
    :file-name="readme.md"
    :auto-load="true"
  />
</template>
```

Markdown 文件会自动识别并渲染，支持以下特性：
- 标题（H1-H6）
- 列表（有序和无序）
- 代码块和行内代码
- 表格
- 引用
- 链接和图片
- 粗体和斜体
- 分隔线

### 直接使用 Blob URL

```vue
<template>
  <DocumentPreview
    :file-url="blobUrl"
    :file-name="image.png"
    :file-type="image"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import documentPreviewManager from '@/utils/documentPreview'

const blobUrl = ref('')

const handleFileUpload = (file: File) => {
  blobUrl.value = documentPreviewManager.createBlobUrl(file)
}
</script>
```

### 手动管理缓存

```typescript
import documentPreviewManager from '@/utils/documentPreview'

// 缓存文档（30分钟过期）
const blobUrl = documentPreviewManager.cacheDocumentPreview(
  documentId,
  file,
  30 * 60 * 1000
)

// 获取缓存的文档
const cached = documentPreviewManager.getDocumentPreview(documentId)

// 获取有效的文档（验证 Blob URL）
const valid = await documentPreviewManager.getValidDocumentPreview(documentId)

// 移除单个文档缓存
documentPreviewManager.removeDocumentPreview(documentId)

// 清理所有缓存
documentPreviewManager.clearAllPreviews()

// 获取缓存统计
const stats = documentPreviewManager.getCacheStats()
console.log('缓存数量:', stats.count)
console.log('缓存大小:', stats.totalSize)
```

## 配置选项

### DocumentPreviewManager 配置

```typescript
const config = {
  cacheKeyPrefix: 'doc_preview',  // localStorage 键前缀
  defaultTTL: 30 * 60 * 1000,    // 默认缓存时间（30分钟）
  maxCacheSize: 50                 // 最大缓存数量
}

const manager = DocumentPreviewManager.getInstance(config)
```

## 后端接口要求

### 获取文档预览接口

```
GET /api/v1/documents/{documentId}/preview
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
- Content-Type: 文件的实际 MIME 类型
- Body: 文件的二进制数据

## 性能优化

1. **缓存策略**: 使用 localStorage 缓存 Blob URL，避免重复请求
2. **过期控制**: 自动清理过期缓存，防止内存泄漏
3. **大小限制**: 限制最大缓存数量，防止 localStorage 溢出
4. **按需加载**: 只在需要时才加载预览，减少初始加载时间
5. **资源释放**: 组件卸载时自动释放 Blob URL，防止内存泄漏

## 注意事项

1. **Blob URL 生命周期**: Blob URL 只在当前会话有效，页面刷新后会失效
2. **localStorage 限制**: localStorage 有大小限制（通常 5-10MB），需要控制缓存大小
3. **安全性**: Blob URL 是临时的，不应长期存储或分享
4. **浏览器兼容性**: 确保目标浏览器支持 Blob URL 和 localStorage
5. **内存管理**: 及时释放不再使用的 Blob URL，防止内存泄漏

## 故障排查

### 问题：预览加载失败

**可能原因**:
- Blob URL 已失效
- localStorage 缓存损坏
- 网络请求失败

**解决方案**:
```typescript
// 验证 Blob URL 是否有效
const isValid = await documentPreviewManager.verifyBlobUrl(blobUrl)
if (!isValid) {
  // 重新获取文档
  await loadDocumentFromServer(documentId)
}
```

### 问题：缓存占用过多空间

**解决方案**:
```typescript
// 清理所有缓存
documentPreviewManager.clearAllPreviews()

// 或调整配置减少缓存时间
const config = {
  defaultTTL: 10 * 60 * 1000  // 10分钟
}
```

### 问题：内存泄漏

**解决方案**:
```typescript
// 确保在组件卸载时清理
onUnmounted(() => {
  documentPreviewManager.cleanup()
})
```

## 扩展功能

可以根据需要扩展以下功能：

1. **支持更多文件类型**: 如视频、音频、Office 文档等
2. **缩略图生成**: 为图片生成缩略图以减少内存占用
3. **分片加载**: 对大文件进行分片加载和预览
4. **离线支持**: 使用 Service Worker 实现离线预览
5. **批量操作**: 支持批量缓存和清理
6. **Markdown 扩展**:
   - 代码语法高亮（使用 Prism.js 或 Highlight.js）
   - 数学公式渲染（使用 KaTeX 或 MathJax）
   - Mermaid 图表支持
   - 自定义 CSS 主题
   - 目录导航生成

## 总结

本文档实现了一个完整的文档上传和预览功能，具有以下特点：

- ✅ Blob URL 生成和管理
- ✅ localStorage 缓存和过期控制
- ✅ 页面刷新时的缓存恢复
- ✅ Blob URL 失效时的自动重试
- ✅ 资源自动释放和内存管理
- ✅ 多种文件类型的预览支持（图片、PDF、文本、Markdown）
- ✅ Markdown 完整语法渲染和 XSS 防护
- ✅ 精美的 Markdown 样式
- ✅ 良好的性能和用户体验

通过合理使用缓存和资源管理，可以显著提升文档预览的性能和用户体验。Markdown 支持使得技术文档、README 文件等常见文档类型能够得到良好的展示效果。
