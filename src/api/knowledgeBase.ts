import axios from 'axios'
import cache from '@/utils/cache'
import type {
  KnowledgeBaseListRequest,
  KnowledgeBaseListResponse,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  DeleteKnowledgeBaseRequest,
  KnowledgeBaseDetailResponse,
  DocumentListInKBRequest,
  DocumentListInKBResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  DeleteDocumentRequest,
  ReVectorizeRequest,
  ChunkPreviewResponse
} from '@/types'

const BASE_URL = '/api/v1/knowledge-base'

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

export const knowledgeBaseApi = {
  getList: async (params?: KnowledgeBaseListRequest, useCache: boolean = false): Promise<KnowledgeBaseListResponse> => {
    const cacheKey = `kb:list:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<KnowledgeBaseListResponse>('', { params })
    cache.set(cacheKey, response.data, CACHE_TTL.MEDIUM)
    return response.data
  },

  getDetail: async (id: number, useCache: boolean = false): Promise<KnowledgeBaseDetailResponse> => {
    const cacheKey = `kb:detail:${id}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<KnowledgeBaseDetailResponse>(`/${id}`)
    cache.set(cacheKey, response.data, CACHE_TTL.MEDIUM)
    return response.data
  },

  create: async (data: CreateKnowledgeBaseRequest): Promise<{ code: number; msg: string }> => {
    const response = await api.post<{ code: number; msg: string }>('', data)
    cache.clearByPrefix('kb')
    return response.data
  },

  update: async (data: UpdateKnowledgeBaseRequest): Promise<{ code: number; msg: string }> => {
    const response = await api.put<{ code: number; msg: string }>(`/${data.id}`, data)
    cache.clearByPrefix('kb')
    return response.data
  },

  delete: async (data: DeleteKnowledgeBaseRequest): Promise<{ code: number; msg: string }> => {
    const response = await api.delete<{ code: number; msg: string }>(`/${data.id}`)
    cache.clearByPrefix('kb')
    return response.data
  },

  getDocuments: async (params: DocumentListInKBRequest, useCache: boolean = false): Promise<DocumentListInKBResponse> => {
    const cacheKey = `kb:${params.kbId}:documents:${JSON.stringify(params)}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const response = await api.get<DocumentListInKBResponse>(`/${params.kbId}/documents`, { params })
    cache.set(cacheKey, response.data, CACHE_TTL.SHORT)
    return response.data
  },

  uploadDocuments: async (data: UploadDocumentRequest): Promise<UploadDocumentResponse> => {
    const formData = new FormData()
    data.files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('kbId', data.kbId.toString())

    const response = await api.post<UploadDocumentResponse>(`/${data.kbId}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    cache.clearByPrefix(`kb:${data.kbId}`)
    return response.data
  },

  deleteDocument: async (data: DeleteDocumentRequest): Promise<{ code: number; msg: string }> => {
    const response = await api.delete<{ code: number; msg: string }>(`/${data.kbId}/documents/${data.documentId}`)
    cache.clearByPrefix(`kb:${data.kbId}`)
    return response.data
  },

  reVectorize: async (data: ReVectorizeRequest): Promise<{ code: number; msg: string }> => {
    const response = await api.post<{ code: number; msg: string }>(`/${data.kbId}/documents/${data.documentId}/re-vectorize`)
    cache.clearByPrefix(`kb:${data.kbId}`)
    return response.data
  },

  getChunkPreview: async (kbId: number, documentId: number): Promise<ChunkPreviewResponse> => {
    const response = await api.get<ChunkPreviewResponse>(`/${kbId}/documents/${documentId}/chunks`)
    return response.data
  }
}

export default api
