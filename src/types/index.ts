export interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  status: 'sending' | 'sent' | 'received' | 'error'
  timestamp: number
}

export interface ChatServiceProps {
  wsUrl: string
  position?: 'left' | 'right'
  title?: string
  width?: string
  height?: string
}

export interface WebSocketMessage {
  type: string
  content?: string
  data?: any
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  code: number
  msg: string
  data: {
    token: string
    userInfo: UserInfo
  }
}

export interface UserInfo {
  username: string
  role: string
  permissions: string[]
}

export interface LoginForm {
  username: string
  password: string
}

export const UserRole = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  VIP_USER: 'VIP用户',
  NORMAL_USER: '普通用户'
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export interface UserManageData {
  id: number
  username: string
  role: string
  status: string
  phone?: string
  packageName?: string
  accountStatus?: string
  lastRechargeTime?: string
  phones?: PhoneInfo[]
}

export interface PhoneInfo {
  phone: string
  phoneId: string
}

export interface ConsumptionRecord {
  id: number
  username?: string
  phone: string
  amount: number
  type: string
  time: string
  description: string
}

export interface PackageUsage {
  packageName: string
  totalData: number
  usedData: number
  totalVoice: number
  usedVoice: number
  totalSms: number
  usedSms: number
}

export interface RechargeRecord {
  id: number
  phone: string
  amount: number
  time: string
  status: string
  method: string
}

export interface FileInfo {
  id: number
  fileName: string
  uploadTime: string
  updateTime: string
  fileSize?: number
  fileType?: string
}

export interface UploadResponse {
  code: number
  msg: string
  data: FileInfo[]
}

export interface FileListResponse {
  code: number
  msg: string
  data: FileInfo[]
}

export interface DeleteResponse {
  code: number
  msg: string
}

export interface DashboardStats {
  totalUsers: number
  todayRecharge: number
  pendingAudit: number
}

export interface DashboardResponse {
  code: number
  msg: string
  data: DashboardStats
}

export interface UserListResponse {
  code: number
  msg: string
  data: {
    list: UserManageData[]
    total: number
  }
}

export interface ConsumptionListResponse {
  code: number
  msg: string
  data: {
    list: ConsumptionRecord[]
    total: number
  }
}

export interface PackageListResponse {
  code: number
  msg: string
  data: {
    list: PackageUsage[]
    total: number
  }
}

export interface QueryUserRequest {
  username: string
}

export interface QueryUserResponse {
  code: number
  msg: string
  data: {
    id: number
    username: string
    balance: number
  }[]
}

export interface RechargeListResponse {
  code: number
  msg: string
  data: {
    list: RechargeRecord[]
    total: number
  }
}

export interface AuditRechargeRequest {
  id: number
  status: 'approved' | 'rejected'
  remark?: string
}

export interface AuditRechargeResponse {
  code: number
  msg: string
}

export interface KnowledgeBase {
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

export interface DocumentRecord {
  id: number
  filename: string
  uploadTime: string
  status: '已向量化' | '失败' | '处理中' | '未向量化'
  currentStep: number
}

export interface DocumentListData {
  total: number
  pages: number
  current: number
  size: number
  records: DocumentRecord[]
}

export interface DocumentListResponse {
  code: number
  message: string
  data: DocumentListData
}

export interface DocumentListRequest {
  page: number
  size: number
  keyword?: string
  sort?: string
}

export interface KnowledgeBaseListRequest {
  page?: number
  pageSize?: number
  department?: string
  owner?: string
  type?: string
}

export interface KnowledgeBaseListResponse {
  code: number
  msg: string
  data: {
    list: KnowledgeBase[]
    total: number
  }
}

export interface CreateKnowledgeBaseRequest {
  name: string
  type: 'tech' | 'business' | 'policy'
  owner: string
  department: string
  vectorDim: number
  description?: string
}

export interface UpdateKnowledgeBaseRequest {
  id: number
  name?: string
  type?: 'tech' | 'business' | 'policy'
  owner?: string
  department?: string
  vectorDim?: number
  description?: string
}

export interface DeleteKnowledgeBaseRequest {
  id: number
}

export interface KnowledgeBaseDetailResponse {
  code: number
  msg: string
  data: KnowledgeBase
}

export interface DocumentInKB {
  id: number
  fileName: string
  uploader: string
  uploadTime: string
  chunkCount: number
  vectorStatus: '未向量化' | '已向量化' | '失败'
  fileSize?: string
  fileType?: string
}

export interface DocumentListInKBRequest {
  kbId: number
  page: number
  pageSize: number
  keyword?: string
}

export interface DocumentListInKBResponse {
  code: number
  msg: string
  data: {
    list: DocumentInKB[]
    total: number
  }
}

export interface UploadDocumentRequest {
  kbId: number
  files: File[]
}

export interface UploadDocumentResponse {
  code: number
  msg: string
  data: {
    successCount: number
    failCount: number
  }
}

export interface DeleteDocumentRequest {
  kbId: number
  documentId: number
}

export interface ReVectorizeRequest {
  kbId: number
  documentId: number
}

export interface ChunkPreview {
  content: string
  tokenCount: number
  vectorStatus: '未向量化' | '已向量化' | '失败'
}

export interface ChunkPreviewResponse {
  code: number
  msg: string
  data: ChunkPreview[]
}

export interface DocumentUploadWizardRequest {
  kbId: number
  documentId: number
}

export interface DocumentUploadWizardResponse {
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
