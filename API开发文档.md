# 知识库管理 API 接口开发文档

## 概述

本文档描述了知识库管理系统的 RESTful API 接口规范，包括接口设计、认证授权机制、数据格式以及安全要求。

## 基础信息

- **Base URL**: `/api/v1/knowledge-base`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8
- **超时时间**: 10000ms

## 认证与授权

### 认证机制

所有 API 请求都需要在 HTTP Header 中携带认证令牌：

```http
Authorization: Bearer {token}
```

Token 从登录接口获取，存储在 localStorage 中，有效期为 24 小时。

### 授权机制

- **超级管理员**: 拥有所有权限
- **管理员**: 可以创建、编辑、删除知识库，上传和管理文档
- **普通用户**: 只能查看知识库和文档

### 错误处理

| 状态码 | 说明             |
| ------ | ---------------- |
| 200    | 请求成功         |
| 400    | 请求参数错误     |
| 401    | 未授权，需要登录 |
| 403    | 无权限访问       |
| 404    | 资源不存在       |
| 500    | 服务器内部错误   |

## 接口列表

### 1. 获取知识库列表

**接口描述**: 获取知识库列表，支持分页和筛选

**请求方式**: `GET`

**请求路径**: `/api/v1/knowledge-base`

**请求参数**:

| 参数名     | 类型   | 必填 | 说明                            |
| ---------- | ------ | ---- | ------------------------------- |
| page       | number | 否   | 页码，默认 1                    |
| pageSize   | number | 否   | 每页数量，默认 10               |
| department | string | 否   | 部门筛选                        |
| owner      | string | 否   | 负责人筛选                      |
| type       | string | 否   | 类型筛选 (tech/business/policy) |

**请求示例**:

```http
GET /api/v1/knowledge-base?page=1&pageSize=10&department=tech
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "技术文档库",
        "owner": "张三",
        "docCount": 1250,
        "vectorDim": 1536,
        "createTime": "2024-01-15",
        "status": "正常",
        "type": "tech",
        "department": "tech"
      }
    ],
    "total": 6
  }
}
```

### 2. 获取知识库详情

**接口描述**: 获取指定知识库的详细信息

**请求方式**: `GET`

**请求路径**: `/api/v1/knowledge-base/{id}`

**路径参数**:

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| id     | number | 是   | 知识库 ID |

**请求示例**:

```http
GET /api/v1/knowledge-base/1
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "name": "技术文档库",
    "owner": "张三",
    "docCount": 1250,
    "vectorDim": 1536,
    "createTime": "2024-01-15",
    "status": "正常",
    "type": "tech",
    "department": "tech"
  }
}
```

### 3. 创建知识库

**接口描述**: 创建新的知识库

**请求方式**: `POST`

**请求路径**: `/api/v1/knowledge-base`

**请求体**:

```json
{
  "name": "技术文档库",
  "type": "tech",
  "owner": "张三",
  "department": "tech",
  "vectorDim": 1536,
  "description": "技术文档知识库"
}
```

**请求参数说明**:

| 参数名      | 类型   | 必填 | 说明                            |
| ----------- | ------ | ---- | ------------------------------- |
| name        | string | 是   | 知识库名称，2-50 字符           |
| type        | string | 是   | 业务类型 (tech/business/policy) |
| owner       | string | 是   | 负责人姓名，2-20 字符           |
| department  | string | 是   | 所属部门                        |
| vectorDim   | number | 是   | 向量维度 (768/1024/1536/2048)   |
| description | string | 否   | 描述，最多 200 字符             |

**响应示例**:

```json
{
  "code": 200,
  "msg": "创建成功"
}
```

### 4. 更新知识库

**接口描述**: 更新知识库信息

**请求方式**: `PUT`

**请求路径**: `/api/v1/knowledge-base/{id}`

**路径参数**:

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| id     | number | 是   | 知识库 ID |

**请求体**:

```json
{
  "name": "技术文档库（更新）",
  "type": "tech",
  "owner": "李四",
  "department": "tech",
  "vectorDim": 1536,
  "description": "更新后的描述"
}
```

**请求参数说明**: 所有参数均为可选，只需提供需要更新的字段

**响应示例**:

```json
{
  "code": 200,
  "msg": "更新成功"
}
```

### 5. 删除知识库

**接口描述**: 删除指定的知识库

**请求方式**: `DELETE`

**请求路径**: `/api/v1/knowledge-base/{id}`

**路径参数**:

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| id     | number | 是   | 知识库 ID |

**请求示例**:

```http
DELETE /api/v1/knowledge-base/1
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "删除成功"
}
```

### 6. 获取知识库文档列表

**接口描述**: 获取指定知识库的文档列表，支持分页和搜索

**请求方式**: `GET`

**请求路径**: `/api/v1/knowledge-base/{kbId}/documents`

**路径参数**:

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| kbId   | number | 是   | 知识库 ID |

**查询参数**:

| 参数名   | 类型   | 必填 | 说明       |
| -------- | ------ | ---- | ---------- |
| page     | number | 是   | 页码       |
| pageSize | number | 是   | 每页数量   |
| keyword  | string | 否   | 搜索关键词 |

**请求示例**:

```http
GET /api/v1/knowledge-base/1/documents?page=1&pageSize=10&keyword=文档
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "fileName": "前端开发规范.pdf",
        "uploader": "张三",
        "uploadTime": "2024-01-15 10:30:00",
        "chunkCount": 125,
        "vectorStatus": "已向量化",
        "fileSize": "2.5 MB",
        "fileType": "PDF"
      }
    ],
    "total": 12
  }
}
```

### 7. 上传文档

**接口描述**: 向指定知识库上传文档

**请求方式**: `POST`

**请求路径**: `/api/v1/knowledge-base/{kbId}/documents/upload`

**路径参数**:

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| kbId   | number | 是   | 知识库 ID |

**请求体**: `multipart/form-data`

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| files  | File[] | 是   | 文件列表  |
| kbId   | number | 是   | 知识库 ID |

**文件限制**:

- 支持格式: .txt, .pdf, .doc, .docx
- 单文件大小: 不超过 10MB
- 批量上传: 最多 20 个文件

**请求示例**:

```http
POST /api/v1/knowledge-base/1/documents/upload
Content-Type: multipart/form-data

files: [file1.pdf, file2.docx]
kbId: 1
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "successCount": 2,
    "failCount": 0
  }
}
```

### 8. 删除文档

**接口描述**: 从知识库中删除指定文档

**请求方式**: `DELETE`

**请求路径**: `/api/v1/knowledge-base/{kbId}/documents/{documentId}`

**路径参数**:

| 参数名     | 类型   | 必填 | 说明      |
| ---------- | ------ | ---- | --------- |
| kbId       | number | 是   | 知识库 ID |
| documentId | number | 是   | 文档 ID   |

**请求示例**:

```http
DELETE /api/v1/knowledge-base/1/documents/1
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "删除成功"
}
```

### 9. 重新向量化文档

**接口描述**: 对指定文档重新进行向量化处理

**请求方式**: `POST`

**请求路径**: `/api/v1/knowledge-base/{kbId}/documents/{documentId}/re-vectorize`

**路径参数**:

| 参数名     | 类型   | 必填 | 说明      |
| ---------- | ------ | ---- | --------- |
| kbId       | number | 是   | 知识库 ID |
| documentId | number | 是   | 文档 ID   |

**请求示例**:

```http
POST /api/v1/knowledge-base/1/documents/1/re-vectorize
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "重新向量化任务已提交"
}
```

### 10. 获取文档分块预览

**接口描述**: 获取指定文档的分块信息和向量化状态

**请求方式**: `GET`

**请求路径**: `/api/v1/knowledge-base/{kbId}/documents/{documentId}/chunks`

**路径参数**:

| 参数名     | 类型   | 必填 | 说明      |
| ---------- | ------ | ---- | --------- |
| kbId       | number | 是   | 知识库 ID |
| documentId | number | 是   | 文档 ID   |

**请求示例**:

```http
GET /api/v1/knowledge-base/1/documents/1/chunks
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "content": "这是第一段分块内容，包含了文档的主要信息...",
      "tokenCount": 256,
      "vectorStatus": "已向量化"
    },
    {
      "content": "这是第二段分块内容，继续描述相关内容...",
      "tokenCount": 198,
      "vectorStatus": "已向量化"
    }
  ]
}
```

### 11. 获取文档上传向导信息

**接口描述**: 获取指定文档的详细信息，用于判断文档处理状态并导航到上传向导的相应步骤

**请求方式**: `POST`

**请求路径**: `/api/v1/knowledge-base/document-upload-wizard/{kbId}/{documentId}`

**路径参数**:

| 参数名     | 类型   | 必填 | 说明      |
| ---------- | ------ | ---- | --------- |
| kbId       | number | 是   | 知识库 ID |
| documentId | number | 是   | 文档 ID   |

**请求体**: 无

**请求示例**:

```http
POST /api/v1/knowledge-base/document-upload-wizard/1/123
```

**响应示例**:

**场景一：文档已上传但未分块**

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "documentId": 123,
    "fileName": "技术文档.pdf",
    "status": "uploaded_not_chunked",
    "chunkData": null,
    "uploadTime": "2024-01-15T10:30:00Z",
    "fileSize": "2.5MB",
    "fileType": "application/pdf"
  }
}
```

**场景二：文档已完成分块**

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "documentId": 123,
    "fileName": "技术文档.pdf",
    "status": "chunked",
    "chunkData": [
      {
        "content": "这是第一段分块内容，包含了文档的主要信息...",
        "tokenCount": 256,
        "vectorStatus": "已向量化"
      },
      {
        "content": "这是第二段分块内容，继续描述相关内容...",
        "tokenCount": 198,
        "vectorStatus": "已向量化"
      }
    ],
    "uploadTime": "2024-01-15T10:30:00Z",
    "fileSize": "2.5MB",
    "fileType": "application/pdf"
  }
}
```

**响应字段说明**:

| 字段名          | 类型   | 说明                                          |
| --------------- | ------ | --------------------------------------------- |
| code            | number | 响应状态码，200 表示成功                      |
| msg             | string | 响应消息                                      |
| data            | object | 文档信息对象                                  |
| data.documentId | number | 文档 ID                                       |
| data.fileName   | string | 文档文件名                                    |
| data.status     | string | 文档处理状态，见下方状态说明                  |
| data.chunkData  | array  | 分块数据数组，仅当 status 为 'chunked' 时存在 |
| data.uploadTime | string | 上传时间（ISO 8601 格式）                     |
| data.fileSize   | string | 文件大小（可选）                              |
| data.fileType   | string | 文件类型/MIME 类型（可选）                    |

**文档状态说明**:

| 状态值                   | 说明                       | 前端行为                                       |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| `uploaded_not_chunked` | 文档已上传但未进行分块处理 | 导航到上传向导第二步（创建设置）               |
| `chunked`              | 文档已完成分块处理         | 导航到上传向导第三步（分块预览）并显示分块数据 |

**错误响应**:

**400 请求参数错误**

```json
{
  "code": 400,
  "msg": "请求参数错误"
}
```

**401 未授权**

```json
{
  "code": 401,
  "msg": "未授权，需要登录"
}
```

**403 无权限访问**

```json
{
  "code": 403,
  "msg": "无权限访问该文档"
}
```

**404 文档不存在**

```json
{
  "code": 404,
  "msg": "文档不存在"
}
```

**500 服务器内部错误**

```json
{
  "code": 500,
  "msg": "服务器内部错误"
}
```

**使用场景**:

1. 用户在知识库详情页面点击"继续上传"按钮
2. 前端发送 POST 请求到该接口
3. 后端返回文档当前处理状态
4. 前端根据状态值导航到上传向导的相应步骤：
   - `uploaded_not_chunked` → 第二步：创建设置
   - `chunked` → 第三步：分块预览（携带分块数据）

**前端调用示例**:

```typescript
import { knowledgeBaseApi } from '@/api/knowledgeBase'

const response = await knowledgeBaseApi.getDocumentUploadWizard({
  kbId: 1,
  documentId: 123
})

if (response.code === 200) {
  const documentData = response.data
  
  if (documentData.status === 'uploaded_not_chunked') {
    // 导航到第二步：创建设置
    router.push({
      path: '/document-upload-wizard/1',
      query: { documentId: documentData.documentId, step: '2' }
    })
  } else if (documentData.status === 'chunked') {
    // 导航到第三步：分块预览
    router.push({
      path: '/document-upload-wizard/1',
      query: {
        documentId: documentData.documentId,
        step: '3',
        chunkData: JSON.stringify(documentData.chunkData)
      }
    })
  }
}
```

### 12. 文件解析分段

**接口描述**: 对已上传的文档进行解析和分段处理，支持批量处理多个文档

**请求方式**: `POST`

**请求路径**: `/api/v1/file/process`

**请求体**:

```json
{
  "kbId": 1,
  "documentIds": [123, 124, 125],
  "parseStrategy": "precise",
  "extractContent": ["image", "ocr", "table"],
  "segmentStrategy": "auto"
}
```

**请求参数说明**:

| 参数名          | 类型     | 必填 | 说明                                                       |
| --------------- | -------- | ---- | ---------------------------------------------------------- |
| kbId            | number   | 是   | 知识库 ID                                                  |
| documentIds     | number[] | 是   | 文档 ID 列表，新上传时为多个文档ID，继续上传时为单个文档ID |
| parseStrategy   | string   | 是   | 文档解析策略（precise/fast）                               |
| extractContent  | string[] | 是   | 提取内容类型（image/ocr/table）                            |
| segmentStrategy | string   | 是   | 分段策略（auto/custom/hierarchy）                          |

**解析策略说明**:

| 策略值      | 说明                           |
| ----------- | ------------------------------ |
| `precise` | 精准解析，提取图片、表格等元素 |
| `fast`    | 快速解析，仅提取文本内容       |

**分段策略说明**:

| 策略值        | 说明                                 |
| ------------- | ------------------------------------ |
| `auto`      | 自动分段与预处理规则                 |
| `custom`    | 自定义分段规则、分段长度及预处理规则 |
| `hierarchy` | 按照文档层级结构分段                 |

**提取内容说明**:

| 内容类型  | 说明                 |
| --------- | -------------------- |
| `image` | 提取文档中的图片内容 |
| `ocr`   | 对扫描件进行文字识别 |
| `table` | 提取文档中的表格数据 |

**请求示例**:

```http
POST /api/v1/file/process
Content-Type: application/json

{
  "kbId": 1,
  "documentIds": [123],
  "parseStrategy": "precise",
  "extractContent": ["image", "ocr", "table"],
  "segmentStrategy": "auto"
}
```

**响应示例**:

```json
{
  "code": 200,
  "msg": "处理成功",
  "data": {
    "processedDocuments": [
      {
        "documentId": 123,
        "fileName": "技术文档.pdf",
        "originalContent": "这是文档的原始内容...",
        "chunkData": [
          {
            "content": "这是第一段分块内容，包含了文档的主要信息...",
            "tokenCount": 256,
            "vectorStatus": "已向量化"
          },
          {
            "content": "这是第二段分块内容，继续描述相关内容...",
            "tokenCount": 198,
            "vectorStatus": "已向量化"
          }
        ]
      }
    ]
  }
}
```

**响应字段说明**:

| 字段名                                             | 类型   | 说明                     |
| -------------------------------------------------- | ------ | ------------------------ |
| code                                               | number | 响应状态码，200 表示成功 |
| msg                                                | string | 响应消息                 |
| data                                               | object | 处理结果对象             |
| data.processedDocuments                            | array  | 已处理文档列表           |
| data.processedDocuments[].documentId               | number | 文档 ID                  |
| data.processedDocuments[].fileName                 | string | 文档文件名               |
| data.processedDocuments[].originalContent          | string | 文档原始内容             |
| data.processedDocuments[].chunkData                | array  | 分块数据数组             |
| data.processedDocuments[].chunkData[].content      | string | 分块内容                 |
| data.processedDocuments[].chunkData[].tokenCount   | number | Token 数量               |
| data.processedDocuments[].chunkData[].vectorStatus | string | 向量化状态               |

**错误响应**:

**400 请求参数错误**

```json
{
  "code": 400,
  "msg": "请求参数错误"
}
```

**401 未授权**

```json
{
  "code": 401,
  "msg": "未授权，需要登录"
}
```

**403 无权限访问**

```json
{
  "code": 403,
  "msg": "无权限访问该文档"
}
```

**404 文档不存在**

```json
{
  "code": 404,
  "msg": "文档不存在"
}
```

**500 服务器内部错误**

```json
{
  "code": 500,
  "msg": "服务器内部错误"
}
```

**使用场景**:

1. 用户在上传向导第二步配置解析和分段策略
2. 点击"下一步"按钮
3. 前端根据上传模式决定文档ID列表：
   - **新上传模式**：传递第一步上传的所有文档ID列表
   - **继续上传模式**：仅传递当前文档ID
4. 后端根据配置策略对文档进行解析和分段
5. 返回处理后的文档信息和分块数据
6. 前端自动跳转到第三步（分段预览）展示结果

**前端调用示例**:

```typescript
import { knowledgeBaseApi } from '@/api/knowledgeBase'

// 新上传模式：处理多个文档
const response = await knowledgeBaseApi.processFiles({
  kbId: 1,
  documentIds: [123, 124, 125],
  parseStrategy: 'precise',
  extractContent: ['image', 'ocr', 'table'],
  segmentStrategy: 'auto'
})

// 继续上传模式：处理单个文档
const response = await knowledgeBaseApi.processFiles({
  kbId: 1,
  documentIds: [123],
  parseStrategy: 'precise',
  extractContent: ['image', 'ocr', 'table'],
  segmentStrategy: 'auto'
})

if (response.code === 200) {
  const processedDocuments = response.data.processedDocuments
  
  // 更新文档列表
  documentList.value = processedDocuments.map(doc => ({
    id: doc.documentId,
    name: doc.fileName,
    originalContent: doc.originalContent,
    segmentedContent: doc.chunkData.map(chunk => chunk.content).join('\n\n'),
    status: 'completed'
  }))
  
  // 跳转到第三步
  currentStep.value = 3
}
```

## 数据模型

### KnowledgeBase (知识库)

```typescript
interface KnowledgeBase {
  id: number
  name: string
  owner: string
  docCount: number
  vectorDim: number
  createTime: string
  status: '正常' | '维护中'
  type: 'tech' | 'business' | 'policy'
  department: string
}
```

### DocumentInKB (知识库文档)

```typescript
interface DocumentInKB {
  id: number
  fileName: string
  uploader: string
  uploadTime: string
  chunkCount: number
  vectorStatus: '未向量化' | '已向量化' | '失败'
  fileSize?: string
  fileType?: string
}
```

### ChunkPreview (分块预览)

```typescript
interface ChunkPreview {
  content: string
  tokenCount: number
  vectorStatus: '未向量化' | '已向量化' | '失败'
}
```

### DocumentUploadWizardResponse (文档上传向导响应)

```typescript
interface DocumentUploadWizardResponse {
  code: number
  msg: string
  data: {
    documentId: number
    fileName: string
    status: 'uploaded_not_chunked' | 'chunked'
    chunkData?: ChunkPreview[]
    uploadTime: string
    fileSize?: string
    fileType?: string
  }
}
```

### FileProcessRequest (文件解析分段请求)

```typescript
interface FileProcessRequest {
  kbId: number
  documentIds: number[]
  parseStrategy: 'precise' | 'fast'
  extractContent: string[]
  segmentStrategy: 'auto' | 'custom' | 'hierarchy'
}
```

### FileProcessResponse (文件解析分段响应)

```typescript
interface FileProcessResponse {
  code: number
  msg: string
  data: {
    processedDocuments: Array<{
      documentId: number
      fileName: string
      originalContent: string
      chunkData: ChunkPreview[]
    }>
  }
}
```

## 安全要求

### 1. 认证安全

- 所有接口必须验证 Token 有效性
- Token 过期后需要重新登录获取
- 敏感操作需要二次确认

### 2. 数据传输安全

- 使用 HTTPS 协议传输
- 文件上传使用 multipart/form-data 格式
- 敏感数据加密传输

### 3. 输入验证

- 所有输入参数必须进行格式验证
- 防止 SQL 注入和 XSS 攻击
- 文件类型和大小严格限制

### 4. 权限控制

- 基于角色的访问控制 (RBAC)
- 资源级别的权限验证
- 操作日志记录

## 缓存策略

为了提高性能，系统实现了以下缓存策略：

| 缓存类型 | TTL   | 说明           |
| -------- | ----- | -------------- |
| 短期缓存 | 60秒  | 频繁变化的数据 |
| 中期缓存 | 300秒 | 相对稳定的数据 |
| 长期缓存 | 600秒 | 很少变化的数据 |

### 缓存键规则

- 知识库列表: `kb:list:{params}`
- 知识库详情: `kb:detail:{id}`
- 文档列表: `kb:{kbId}:documents:{params}`

### 缓存失效

- 创建/更新/删除操作后清除相关缓存
- 使用 `clearByPrefix` 方法批量清除
- 登出时清除所有缓存

## 错误处理

### 统一响应格式

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 错误码说明

| 错误码 | 说明         |
| ------ | ------------ |
| 200    | 成功         |
| 400    | 请求参数错误 |
| 401    | 未授权       |
| 403    | 无权限       |
| 404    | 资源不存在   |
| 500    | 服务器错误   |

### 前端拦截器

请求拦截器：

- 自动添加 Authorization Header
- 添加 Token 到请求头

响应拦截器：

- 401 自动跳转登录
- 统一错误提示
- 清除失效 Token

## 使用示例

### 前端调用示例

```typescript
import { knowledgeBaseApi } from '@/api/knowledgeBase'

// 获取知识库列表
const response = await knowledgeBaseApi.getList({
  page: 1,
  pageSize: 10,
  department: 'tech'
})

// 创建知识库
await knowledgeBaseApi.create({
  name: '技术文档库',
  type: 'tech',
  owner: '张三',
  department: 'tech',
  vectorDim: 1536
})

// 上传文档
await knowledgeBaseApi.uploadDocuments({
  kbId: 1,
  files: [file1, file2]
})
```

## 版本历史

| 版本   | 日期       | 说明                           |
| ------ | ---------- | ------------------------------ |
| v1.2.0 | 2024-03-01 | 新增文件解析分段接口（接口12） |
| v1.1.0 | 2024-03-01 | 新增文档上传向导接口（接口11） |
| v1.0.0 | 2024-02-28 | 初始版本，完成基础 CRUD 功能   |

## 联系方式

如有问题，请联系开发团队。
