import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig> {
  scrollBehavior(to, from, savedPosition) {
    // If only hash changed on same path, don't scroll (handled by component or browser)
    if (to.path === from.path && to.hash !== from.hash) {
      return false
    }

    if (savedPosition) {
      return savedPosition
    }

    return { top: 0 }
  }
}
