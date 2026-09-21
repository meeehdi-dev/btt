export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { isAuthenticated } = useMockSession()

  if (to.query.demo === '1' && isDevelopmentRuntime()) {
    const session = useCookie<boolean>('nxmr-demo-session')
    session.value = true
    return navigateTo('/dashboard', { replace: true })
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})

function isDevelopmentRuntime() {
  return Boolean(useRuntimeConfig().public.demoAuth)
}
