<template>
  <div class="smart-chat-service">
    <el-button
      class="chat-float-button"
      :class="`position-${position}`"
      type="primary"
      circle
      size="large"
      @click="toggleDrawer"
    >
      <el-icon><ChatDotRound /></el-icon>
    </el-button>

    <el-drawer
      v-model="drawerVisible"
      :title="title"
      :size="width"
      direction="rtl"
      :with-header="true"
      class="chat-drawer"
    >
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', message.type]"
          >
            <div class="message-content">
              <div class="message-text" v-html="parseMarkdown(message.content)"></div>
              <div class="message-status">
                <span v-if="message.status === 'sending'" class="status-sending">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  发送中...
                </span>
                <span v-else-if="message.status === 'error'" class="status-error">
                  <el-icon><Warning /></el-icon>
                  发送失败
                </span>
                <span v-else-if="message.status === 'received'" class="status-received">
                  <el-icon><CircleCheck /></el-icon>
                </span>
                <span v-else class="status-sent">
                  <el-icon><CircleCheck /></el-icon>
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
          <div v-if="isAiTyping" class="message-item ai typing">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keydown.enter.prevent="handleEnter"
            :disabled="!isConnected"
          />
          <el-button
            type="primary"
            :loading="isSending"
            :disabled="!inputMessage.trim() || !isConnected"
            @click="sendMessage"
            class="send-button"
          >
            发送
          </el-button>
        </div>

        <div class="connection-status">
          <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Loading, Warning, CircleCheck } from '@element-plus/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Message, ChatServiceProps } from '../types'

const props = withDefaults(defineProps<ChatServiceProps>(), {
  position: 'right',
  title: '智能客服',
  width: '400px',
  height: '600px'
})

const drawerVisible = ref(false)
const inputMessage = ref('')
const messages = ref<Message[]>([])
const isSending = ref(false)
const isAiTyping = ref(false)
const isConnected = ref(false)
const messagesContainer = ref<HTMLElement>()

let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let currentAiMessageId: string | null = null
let currentAiContent = ref('')
let messageIdCounter = 0

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

const parseMarkdown = (content: string): string => {
  if (!content) return ''
  
  const html = marked.parse(content, {
    breaks: true,
    gfm: true
  }) as string
  
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'class'],
    ALLOW_DATA_ATTR: false
  })
  
  return cleanHtml
}

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
  if (drawerVisible.value && !isConnected.value) {
    connectWebSocket()
  }
}

const connectWebSocket = () => {
  if (ws?.readyState === WebSocket.OPEN) return

  try {
    ws = new WebSocket(props.wsUrl)

    ws.onopen = () => {
      isConnected.value = true
      console.log('WebSocket连接已建立')
      ElMessage.success('客服系统已连接')
    }

    ws.onmessage = (event) => {
      handleIncomingMessage(event.data)
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      isConnected.value = false
      ElMessage.error('连接发生错误')
    }

    ws.onclose = () => {
      isConnected.value = false
      console.log('WebSocket连接已关闭')
      handleReconnect()
    }
  } catch (error) {
    console.error('WebSocket连接失败:', error)
    isConnected.value = false
    ElMessage.error('连接失败，请检查服务端是否启动')
  }
}

const handleReconnect = () => {
  if (reconnectTimer) return
  
  reconnectTimer = window.setTimeout(() => {
    console.log('尝试重新连接...')
    reconnectTimer = null
    connectWebSocket()
  }, 3000)
}

const handleIncomingMessage = (data: string) => {
  console.log('[WebSocket] 收到数据:', JSON.stringify(data))
  
  if (data === '[STREAM_END]') {
    console.log('[WebSocket] 收到流式结束标识')
    if (currentAiMessageId) {
      const message = messages.value.find(m => m.id === currentAiMessageId)
      if (message) {
        message.status = 'received'
        message.content = currentAiContent.value
        console.log('[WebSocket] 消息完成:', {
          id: currentAiMessageId,
          content: currentAiContent.value
        })
      }
      currentAiMessageId = null
      currentAiContent.value = ''
      isAiTyping.value = false
    }
    return
  }

  if (currentAiMessageId) {
    currentAiContent.value += data
    const message = messages.value.find(m => m.id === currentAiMessageId)
    if (message) {
      message.content = currentAiContent.value
      console.log('[WebSocket] 追加内容到消息:', {
        id: currentAiMessageId,
        chunk: data,
        totalContent: currentAiContent.value
      })
    }
    scrollToBottom()
  } else {
    const aiMessage: Message = {
      id: generateMessageId(),
      type: 'ai',
      content: data,
      status: 'received',
      timestamp: Date.now()
    }
    messages.value.push(aiMessage)
    currentAiMessageId = aiMessage.id
    currentAiContent.value = data
    isAiTyping.value = true
    console.log('[WebSocket] 创建新AI消息:', {
      id: aiMessage.id,
      content: data
    })
    scrollToBottom()
  }
}

const sendMessage = () => {
  const content = inputMessage.value.trim()
  if (!content || isSending.value || !isConnected.value) return

  isSending.value = true

  const userMessage: Message = {
    id: generateMessageId(),
    type: 'user',
    content,
    status: 'sending',
    timestamp: Date.now()
  }

  console.log('[WebSocket] 发送用户消息:', {
    id: userMessage.id,
    content: content
  })

  messages.value.push(userMessage)
  scrollToBottom()

  try {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(content)
      userMessage.status = 'sent'
      inputMessage.value = ''
      
      isAiTyping.value = true
      
      console.log('[WebSocket] 重置当前AI消息状态，准备接收新回复')
      currentAiMessageId = null
      currentAiContent.value = ''
    } else {
      userMessage.status = 'error'
      ElMessage.error('连接已断开，正在重新连接...')
      connectWebSocket()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    userMessage.status = 'error'
    ElMessage.error('发送消息失败')
  } finally {
    isSending.value = false
  }
}

const handleEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    return
  }
  sendMessage()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const disconnectWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  if (ws) {
    ws.close()
    ws = null
  }
  isConnected.value = false
}

watch(drawerVisible, (newVal) => {
  if (!newVal) {
    disconnectWebSocket()
  }
})

onMounted(() => {
  console.log('智能客服组件已加载')
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
.smart-chat-service {
  position: fixed;
  z-index: 9999;
}

.chat-float-button {
  position: fixed;
  bottom: 80px;
  width: 60px;
  height: 60px;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 9999;
}

.chat-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.position-left {
  left: 30px;
}

.position-right {
  right: 30px;
}

.chat-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user,
.message-item.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.user .message-content,
.message-item.ai .message-content {
  align-items: flex-start;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.6;
  overflow-wrap: break-word;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin-top: 0;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.3;
}

.message-item.user .message-text :deep(h1),
.message-item.user .message-text :deep(h2),
.message-item.user .message-text :deep(h3),
.message-item.user .message-text :deep(h4),
.message-item.user .message-text :deep(h5),
.message-item.user .message-text :deep(h6) {
  color: #ffffff;
}

.message-text :deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 4px;
}

.message-text :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 3px;
}

.message-text :deep(h3) {
  font-size: 1.2em;
}

.message-text :deep(h4) {
  font-size: 1.1em;
}

.message-text :deep(h5) {
  font-size: 1em;
}

.message-text :deep(h6) {
  font-size: 0.9em;
  color: #4a4a4a;
}

.message-text :deep(p) {
  margin: 8px 0;
}

.message-item.user .message-text :deep(p) {
  color: #ffffff;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(strong) {
  font-weight: 700;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(a) {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px dotted #409eff;
  transition: all 0.2s ease;
}

.message-text :deep(a:hover) {
  color: #66b1ff;
  border-bottom-style: solid;
}

.message-item.user .message-text :deep(a) {
  color: #fff;
  border-bottom-color: rgba(255, 255, 255, 0.7);
}

.message-item.user .message-text :deep(a:hover) {
  color: #f0f0f0;
  border-bottom-style: solid;
}

.message-text :deep(code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  color: #e83e8c;
}

.message-item.user .message-text :deep(code) {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-text :deep(pre) {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  font-size: 0.9em;
}

.message-item.user .message-text :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.message-text :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.message-item.user .message-text :deep(li) {
  color: #ffffff;
}

.message-text :deep(ul) {
  list-style-type: disc;
}

.message-text :deep(ol) {
  list-style-type: decimal;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #d0d0d0;
  padding-left: 12px;
  margin: 8px 0;
  color: #4a4a4a;
  font-style: italic;
}

.message-item.user .message-text :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.9);
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 16px 0;
}

.message-item.user .message-text :deep(hr) {
  border-top-color: rgba(255, 255, 255, 0.3);
}

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.9em;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid #dfe2e5;
  padding: 6px 12px;
  text-align: left;
}

.message-text :deep(th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.message-item.user .message-text :deep(table) {
  border-color: rgba(255, 255, 255, 0.3);
}

.message-item.user .message-text :deep(th),
.message-item.user .message-text :deep(td) {
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.message-item.user .message-text :deep(th) {
  background-color: rgba(255, 255, 255, 0.15);
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #4c51bf 100%);
  color: #ffffff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 4px;
}

.message-item.ai .message-text {
  background: #ffffff;
  color: #1a1a1a;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.message-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #666666;
}

.message-item.user .message-status,
.message-item.ai .message-status {
  justify-content: flex-start;
}

.status-sending {
  color: #409eff;
}

.status-error {
  color: #f56c6c;
}

.status-received {
  color: #67c23a;
}

.status-sent {
  color: #909399;
}

.message-time {
  margin-left: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #666666;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

.chat-input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input-area :deep(.el-textarea__inner) {
  resize: none;
  border-radius: 8px;
}

.send-button {
  height: 74px;
  min-width: 80px;
  border-radius: 8px;
}

.connection-status {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
