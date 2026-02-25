import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions || []

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = permissions.some(permission => {
        return value.includes(permission)
      })
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    } else if (value) {
      const hasPermission = permissions.includes(value)
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    } else {
      throw new Error('需要指定权限标识！如 v-permission="\'user:manage\'"')
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions || []

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = permissions.some(permission => {
        return value.includes(permission)
      })
      if (!hasPermission && el.parentNode) {
        el.style.display = 'none'
      } else if (hasPermission) {
        el.style.display = ''
      }
    } else if (value) {
      const hasPermission = permissions.includes(value)
      if (!hasPermission && el.parentNode) {
        el.style.display = 'none'
      } else if (hasPermission) {
        el.style.display = ''
      }
    }
  }
}

export default permission
