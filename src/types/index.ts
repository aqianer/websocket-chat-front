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
