import { ElNotification } from 'element-plus'

export interface FileParseProgressMessage {
  type: 'progress'
  data: {
    currentDocument: number
    totalDocuments: number
    processedDocuments: number
    percentage: number
    currentDocumentName?: string
  }
}

export interface FileParseCompleteMessage {
  type: 'complete'
  data: {
    processedDocuments: Array<{
      documentId: number
      fileName: string
      originalContent: string
      chunkData: Array<{
        content: string
        tokenCount: number
        vectorStatus: string
      }>
    }>
  }
}

export interface FileParseErrorMessage {
  type: 'error'
  data: {
    message: string
    code?: number
  }
}

export type FileParseMessage = FileParseProgressMessage | FileParseCompleteMessage | FileParseErrorMessage

export class FileParseWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 3000
  private messageHandlers: Map<string, (data: any) => void> = new Map()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('连接 WebSocket:', url)
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket 连接成功')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: FileParseMessage = JSON.parse(event.data)
            console.log('收到 WebSocket 消息:', message)
            this.handleMessage(message)
          } catch (error) {
            console.error('解析 WebSocket 消息失败:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket 错误:', error)
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket 连接关闭:', event.code, event.reason)
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => {
              this.connect(url)
            }, this.reconnectDelay)
          }
        }
      } catch (error) {
        console.error('创建 WebSocket 连接失败:', error)
        reject(error)
      }
    })
  }

  sendFileParseRequest(data: {
    kbId: number
    documentIds: number[]
    parseStrategy: string
    extractContent: string[]
    segmentStrategy: string
  }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket 未连接，无法发送消息')
      return
    }

    const message = {
      type: 'parse',
      data
    }

    console.log('发送文件解析请求:', message)
    this.ws.send(JSON.stringify(message))
  }

  onProgress(callback: (data: FileParseProgressMessage['data']) => void): void {
    this.messageHandlers.set('progress', callback)
  }

  onComplete(callback: (data: FileParseCompleteMessage['data']) => void): void {
    this.messageHandlers.set('complete', callback)
  }

  onError(callback: (data: FileParseErrorMessage['data']) => void): void {
    this.messageHandlers.set('error', callback)
  }

  private handleMessage(message: FileParseMessage): void {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message.data)
    } else {
      console.warn('未找到消息处理器:', message.type)
    }
  }

  disconnect(): void {
    if (this.ws) {
      console.log('断开 WebSocket 连接')
      this.ws.close(1000, 'User disconnected')
      this.ws = null
      this.messageHandlers.clear()
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export function createFileParseWebSocket(userId: string): FileParseWebSocket {
  return new FileParseWebSocket(userId)
}

export function showFileParseError(message: string): void {
  ElNotification({
    title: '文件解析失败',
    message,
    type: 'error',
    duration: 5000
  })
}

export function showFileParseSuccess(count: number): void {
  ElNotification({
    title: '解析成功',
    message: `成功处理 ${count} 个文档`,
    type: 'success',
    duration: 3000
  })
}
