import axios from 'axios'
import type { LoginRequest, LoginResponse } from '@/types'

const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const login = (request: LoginRequest): Promise<LoginResponse> => {
  return api.post('/api/auth/login', request)
    .then(response => response.data)
}
