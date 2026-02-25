# WebSocket 连接配置与故障排查指南

## 当前配置

### WebSocket 端点
- **地址**: `ws://localhost:7676/ws/chat`
- **端口**: 7676
- **路径**: `/ws/chat`

### 配置文件位置
- [src/App.vue](file:///e:/JavaProjects/websocket-chat-front/src/App.vue#L12) - WebSocket URL 配置
- [src/components/SmartChatService.vue](file:///e:/JavaProjects/websocket-chat-front/src/components/SmartChatService.vue) - WebSocket 连接逻辑

## 连接故障排查

### 常见问题及解决方案

#### 1. 端口配置错误
**症状**: 浏览器控制台显示 WebSocket 连接错误

**原因**: 前端配置的 WebSocket 端口与后端服务器端口不一致

**解决方案**:
1. 确认后端服务器运行的端口号
2. 在 [src/App.vue](file:///e:/JavaProjects/websocket-chat-front/src/App.vue#L12) 中修改 `wsUrl`:
   ```typescript
   const wsUrl = 'ws://localhost:7676/ws/chat'  // 修改为正确的端口
   ```

#### 2. 后端服务未启动
**症状**: 连接超时或立即断开

**解决方案**:
1. 确认后端 WebSocket 服务已启动
2. 检查后端服务是否在端口 7676 上监听
3. 使用以下命令检查端口占用:
   ```bash
   netstat -ano | findstr :7676
   ```

#### 3. WebSocket 路径不匹配
**症状**: 404 错误或连接被拒绝

**解决方案**:
1. 确认后端 WebSocket 端点路径为 `/ws/chat`
2. 检查后端 `@ServerEndpoint` 注解配置:
   ```java
   @ServerEndpoint("/ws/chat")
   public class ChatEndpoint {
       // ...
   }
   ```

#### 4. CORS 跨域问题
**症状**: 浏览器控制台显示跨域错误

**解决方案**:
1. 在后端配置 CORS 允许前端域名访问
2. 或确保前后端使用相同的协议和域名

#### 5. 防火墙阻止
**症状**: 连接被拒绝或超时

**解决方案**:
1. 检查防火墙设置，允许端口 7676 的入站连接
2. 临时关闭防火墙进行测试

## 连接测试方法

### 方法 1: 浏览器开发者工具
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 点击悬浮球打开聊天窗口
4. 查看控制台输出:
   - 成功: `WebSocket连接已建立`
   - 失败: `WebSocket错误:`

### 方法 2: WebSocket 在线测试工具
使用在线 WebSocket 测试工具连接:
- 地址: `ws://localhost:7676/ws/chat`
- 观察连接状态

### 方法 3: curl 测试
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:7676/ws/chat
```

## 后端服务要求

### Java WebSocket 服务端示例

```java
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/ws/chat")
public class ChatEndpoint {
    
    @OnOpen
    public void onOpen(Session session) {
        System.out.println("WebSocket 连接已建立: " + session.getId());
    }
    
    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("收到消息: " + message);
        
        // 发送普通消息
        try {
            session.getBasicRemote().sendText("AI 回复内容");
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // 或发送流式消息
        try {
            session.getBasicRemote().sendText("这是");
            session.getBasicRemote().sendText("流式");
            session.getBasicRemote().sendText("回复");
            session.getBasicRemote().sendText("[STREAM_END]");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @OnClose
    public void onClose(Session session) {
        System.out.println("WebSocket 连接已关闭: " + session.getId());
    }
    
    @OnError
    public void onError(Session session, Throwable error) {
        System.err.println("WebSocket 错误: " + error.getMessage());
    }
}
```

### 消息格式要求

#### 客户端发送
- 格式: 纯文本字符串
- 示例: `你好，请问有什么可以帮助您的？`

#### 服务端返回
1. **普通消息**: 直接返回文本内容
   ```
   您好！我是智能客服，很高兴为您服务。
   ```

2. **流式消息**: 分块返回文本内容
   ```
   您好！
   我是
   智能
   客服
   [STREAM_END]
   ```

3. **流式结束标识**: 必须发送 `[STREAM_END]` 标识符

## 配置修改指南

### 修改 WebSocket 地址

如果需要修改 WebSocket 连接地址，编辑 [src/App.vue](file:///e:/JavaProjects/websocket-chat-front/src/App.vue#L12):

```typescript
// 本地开发环境
const wsUrl = 'ws://localhost:7676/ws/chat'

// 生产环境（使用实际域名）
const wsUrl = 'wss://your-domain.com/ws/chat'

// 使用环境变量
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:7676/ws/chat'
```

### 使用环境变量

1. 创建 `.env` 文件:
   ```
   VITE_WS_URL=ws://localhost:7676/ws/chat
   ```

2. 修改 [src/App.vue](file:///e:/JavaProjects/websocket-chat-front/src/App.vue):
   ```typescript
   const wsUrl = import.meta.env.VITE_WS_URL
   ```

3. 创建 `.env.production` 文件:
   ```
   VITE_WS_URL=wss://your-production-domain.com/ws/chat
   ```

## 连接状态监控

### 组件状态
- `isConnected`: WebSocket 连接状态
  - `true`: 已连接
  - `false`: 未连接

### 消息状态
- `sending`: 发送中
- `sent`: 已发送
- `received`: 已接收
- `error`: 发送失败

### 自动重连机制
- 连接断开后自动尝试重连
- 重连间隔: 3 秒
- 最大重连次数: 无限制

## 调试技巧

### 启用详细日志
在 [src/components/SmartChatService.vue](file:///e:/JavaProjects/websocket-chat-front/src/components/SmartChatService.vue) 中，所有关键操作都有 console.log 输出：

```typescript
console.log('WebSocket连接已建立')
console.log('WebSocket连接已关闭')
console.error('WebSocket错误:', error)
```

### 网络监控
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 筛选 WS (WebSocket) 类型
4. 查看连接详情和消息帧

## 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| 1000 | 正常关闭 | 无需处理 |
| 1001 | 端点离开 | 检查服务器状态 |
| 1002 | 协议错误 | 检查协议版本 |
| 1003 | 不支持的数据类型 | 检查消息格式 |
| 1006 | 连接异常关闭 | 检查网络和服务器 |
| 1015 | TLS 握手失败 | 检查证书配置 |

## 技术支持

如遇到问题，请检查:
1. 后端服务是否正常运行
2. 端口配置是否正确
3. 防火墙是否阻止连接
4. WebSocket 路径是否匹配
5. 浏览器控制台错误信息

---

**最后更新**: 2026-02-05
**版本**: 1.0.0
