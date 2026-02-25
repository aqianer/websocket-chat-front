# 智能客服系统

基于Vue3 + Element-Plus + WebSocket的智能客服组件，支持流式AI回复。

## 功能特性

- 悬浮球客服入口
- 抽屉式聊天界面
- WebSocket实时通信
- AI流式回复处理
- 消息状态指示
- 自动重连机制
- **Markdown格式支持** (标题、粗体、斜体、链接、代码块、列表、引用等)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 组件使用

```vue
<template>
  <SmartChatService 
    :ws-url="wsUrl" 
    :position="position" 
    :title="title"
  />
</template>

<script setup>
import SmartChatService from './components/SmartChatService.vue'

const wsUrl = 'ws://localhost:7676/ws/chat'
const position = 'right'
const title = '智能客服'
</script>
```

## 配置选项

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| wsUrl | WebSocket服务端地址 | string | - |
| position | 悬浮球位置 | 'left' \| 'right' | 'right' |
| title | 聊天窗口标题 | string | '智能客服' |
| width | 聊天窗口宽度 | string | '400px' |

## WebSocket消息格式

### 客户端发送

纯文本消息

### 服务端返回

- 普通消息：直接返回文本内容
- 流式消息：分块返回文本内容
- 流式结束：返回 `[STREAM_END]` 标识符

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Element Plus
- Vite
