export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === '/login') return

  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/session')
    if (!session.authenticated) {
      return navigateTo('/login')
    }
  } catch {
    return navigateTo('/login')
  }
})
