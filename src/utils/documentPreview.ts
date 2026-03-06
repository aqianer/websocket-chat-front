interface DocumentPreviewCacheItem {
  documentId: number
  fileName: string
  fileType: string
  blobUrl: string
  timestamp: number
  expiresAt: number
}

interface DocumentPreviewConfig {
  cacheKeyPrefix: string
  defaultTTL: number
  maxCacheSize: number
}

class DocumentPreviewManager {
  private config: DocumentPreviewConfig
  private activeBlobUrls: Map<string, string>
  private static instance: DocumentPreviewManager

  private constructor(config?: Partial<DocumentPreviewConfig>) {
    this.config = {
      cacheKeyPrefix: 'doc_preview',
      defaultTTL: 30 * 60 * 1000,
      maxCacheSize: 50,
      ...config
    }
    this.activeBlobUrls = new Map()
    this.cleanupExpiredCache()
  }

  static getInstance(config?: Partial<DocumentPreviewConfig>): DocumentPreviewManager {
    if (!DocumentPreviewManager.instance) {
      DocumentPreviewManager.instance = new DocumentPreviewManager(config)
    }
    return DocumentPreviewManager.instance
  }

  private getCacheKey(documentId: number): string {
    return `${this.config.cacheKeyPrefix}:${documentId}`
  }

  private isExpired(item: DocumentPreviewCacheItem): boolean {
    return Date.now() > item.expiresAt
  }

  private cleanupExpiredCache(): void {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.config.cacheKeyPrefix)) {
          keys.push(key)
        }
      }

      keys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (item.expiresAt && Date.now() > item.expiresAt) {
            localStorage.removeItem(key)
            if (item.blobUrl) {
              this.revokeBlobUrl(item.blobUrl)
            }
          }
        } catch (error) {
          console.error('清理缓存失败:', key, error)
        }
      })
    } catch (error) {
      console.error('清理过期缓存失败:', error)
    }
  }

  private enforceCacheLimit(): void {
    try {
      const items: Array<{ key: string; timestamp: number }> = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.config.cacheKeyPrefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}')
            items.push({ key, timestamp: item.timestamp || 0 })
          } catch (error) {
            console.error('解析缓存项失败:', key, error)
          }
        }
      }

      items.sort((a, b) => a.timestamp - b.timestamp)

      while (items.length >= this.config.maxCacheSize) {
        const oldest = items.shift()
        if (oldest) {
          try {
            const item = JSON.parse(localStorage.getItem(oldest.key) || '{}')
            if (item.blobUrl) {
              this.revokeBlobUrl(item.blobUrl)
            }
            localStorage.removeItem(oldest.key)
          } catch (error) {
            console.error('删除缓存项失败:', oldest.key, error)
          }
        }
      }
    } catch (error) {
      console.error('强制限制缓存大小失败:', error)
    }
  }

  createBlobUrl(file: File): string {
    const blobUrl = URL.createObjectURL(file)
    this.activeBlobUrls.set(blobUrl, Date.now().toString())
    return blobUrl
  }

  revokeBlobUrl(blobUrl: string): void {
    try {
      if (this.activeBlobUrls.has(blobUrl)) {
        URL.revokeObjectURL(blobUrl)
        this.activeBlobUrls.delete(blobUrl)
      }
    } catch (error) {
      console.error('释放 Blob URL 失败:', blobUrl, error)
    }
  }

  cacheDocumentPreview(documentId: number, file: File, ttl?: number): string {
    const blobUrl = this.createBlobUrl(file)
    const cacheItem: DocumentPreviewCacheItem = {
      documentId,
      fileName: file.name,
      fileType: file.type,
      blobUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.config.defaultTTL)
    }

    try {
      this.enforceCacheLimit()
      localStorage.setItem(this.getCacheKey(documentId), JSON.stringify(cacheItem))
      return blobUrl
    } catch (error) {
      console.error('缓存文档预览失败:', error)
      this.revokeBlobUrl(blobUrl)
      throw error
    }
  }

  getDocumentPreview(documentId: number): DocumentPreviewCacheItem | null {
    try {
      const cacheKey = this.getCacheKey(documentId)
      const cached = localStorage.getItem(cacheKey)
      if (!cached) {
        return null
      }

      const item: DocumentPreviewCacheItem = JSON.parse(cached)

      if (this.isExpired(item)) {
        this.removeDocumentPreview(documentId)
        return null
      }

      return item
    } catch (error) {
      console.error('获取文档预览失败:', error)
      return null
    }
  }

  async verifyBlobUrl(blobUrl: string): Promise<boolean> {
    try {
      const response = await fetch(blobUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error('验证 Blob URL 失败:', blobUrl, error)
      return false
    }
  }

  async getValidDocumentPreview(documentId: number): Promise<DocumentPreviewCacheItem | null> {
    const cached = this.getDocumentPreview(documentId)
    if (!cached) {
      return null
    }

    const isValid = await this.verifyBlobUrl(cached.blobUrl)
    if (!isValid) {
      this.removeDocumentPreview(documentId)
      return null
    }

    return cached
  }

  removeDocumentPreview(documentId: number): void {
    try {
      const cacheKey = this.getCacheKey(documentId)
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const item: DocumentPreviewCacheItem = JSON.parse(cached)
        if (item.blobUrl) {
          this.revokeBlobUrl(item.blobUrl)
        }
        localStorage.removeItem(cacheKey)
      }
    } catch (error) {
      console.error('删除文档预览缓存失败:', error)
    }
  }

  clearAllPreviews(): void {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.config.cacheKeyPrefix)) {
          keys.push(key)
        }
      }

      keys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (item.blobUrl) {
            this.revokeBlobUrl(item.blobUrl)
          }
          localStorage.removeItem(key)
        } catch (error) {
          console.error('清理缓存项失败:', key, error)
        }
      })

      this.activeBlobUrls.forEach((_, blobUrl) => {
        this.revokeBlobUrl(blobUrl)
      })
      this.activeBlobUrls.clear()
    } catch (error) {
      console.error('清理所有预览缓存失败:', error)
    }
  }

  getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, string> = {
      'pdf': 'pdf',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'webp': 'image',
      'svg': 'image',
      'txt': 'text',
      'md': 'markdown',
      'markdown': 'markdown',
      'doc': 'document',
      'docx': 'document'
    }
    return typeMap[ext] || 'unknown'
  }

  getPreviewComponent(fileType: string): string {
    const componentMap: Record<string, string> = {
      'image': 'image-preview',
      'pdf': 'pdf-preview',
      'text': 'text-preview',
      'document': 'document-preview',
      'unknown': 'unknown-preview'
    }
    return componentMap[fileType] || 'unknown-preview'
  }

  getCacheStats(): { count: number; totalSize: number } {
    let count = 0
    let totalSize = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.config.cacheKeyPrefix)) {
          count++
          totalSize += (localStorage.getItem(key) || '').length
        }
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error)
    }

    return { count, totalSize }
  }

  cleanup(): void {
    this.clearAllPreviews()
  }
}

export default DocumentPreviewManager.getInstance()
export type { DocumentPreviewCacheItem, DocumentPreviewConfig }
