import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'

config.global.stubs = {
  transition: false,
  'transition-group': false
}

config.global.plugins = [ElementPlus]

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      currentRoute: { value: { path: '/' } }
    }),
    useRoute: () => ({ params: {}, query: {} })
  }
})
