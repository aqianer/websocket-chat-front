import axios from 'axios'
import cache from '@/utils/cache'
import type {
  DashboardResponse,
  UserListResponse,
  ConsumptionListResponse,
  PackageListResponse,
  QueryUserRequest,
  QueryUserResponse,
  RechargeListResponse,
  AuditRechargeRequest,
  AuditRechargeResponse
} from '@/types'

const BASE_URL = '/api'

const CACHE_TTL = {
  SHORT: 60000,
  MEDIUM: 300000,
  LONG: 600000
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          cache.clear()
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error('请求失败:', error.response.data?.msg || '未知错误')
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  getStats: async (useCache: boolean = true): Promise<DashboardResponse> => {
    const cacheKey = 'dashboard:stats'
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<DashboardResponse>('/dashboard/stats')
    cache.set(cacheKey, response.data, CACHE_TTL.MEDIUM)
    return response.data
  }
}

export const userApi = {
  getList: async (params?: { page?: number; pageSize?: number }, useCache: boolean = false): Promise<UserListResponse> => {
    const cacheKey = `users:list:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<UserListResponse>('/users', { params })
    cache.set(cacheKey, response.data, CACHE_TTL.SHORT)
    return response.data
  },

  getConsumption: async (params?: { page?: number; pageSize?: number }, useCache: boolean = false): Promise<ConsumptionListResponse> => {
    const cacheKey = `users:consumption:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<ConsumptionListResponse>('/users/consumption', { params })
    cache.set(cacheKey, response.data, CACHE_TTL.SHORT)
    return response.data
  },

  getPackageUsage: async (params?: { page?: number; pageSize?: number }, useCache: boolean = false): Promise<PackageListResponse> => {
    const cacheKey = `users:package:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<PackageListResponse>('/users/package', { params })
    cache.set(cacheKey, response.data, CACHE_TTL.MEDIUM)
    return response.data
  },

  query: async (data: QueryUserRequest): Promise<QueryUserResponse> => {
    const response = await api.post<QueryUserResponse>('/users/query', data)
    return response.data
  }
}

export const rechargeApi = {
  getList: async (params?: { page?: number; pageSize?: number }, useCache: boolean = false): Promise<RechargeListResponse> => {
    const cacheKey = `recharge:list:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<RechargeListResponse>('/recharge', { params })
    cache.set(cacheKey, response.data, CACHE_TTL.SHORT)
    return response.data
  },

  audit: async (data: AuditRechargeRequest): Promise<AuditRechargeResponse> => {
    const response = await api.post<AuditRechargeResponse>('/recharge/audit', data)
    cache.clearByPrefix('recharge')
    cache.clearByPrefix('dashboard')
    return response.data
  }
}

export default api
