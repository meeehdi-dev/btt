import { authClient } from '~/lib/auth-client'
import { clientSessionDecision } from '~/utils/client-effect'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { data: session, error } = await authClient.useSession(useApiFetch)

  const decision = clientSessionDecision(session.value, error.value)

  // The dashboard layout renders a fail-closed retry state when session verification fails.
  // Do not redirect to login: a failed read does not establish that the user is unauthenticated.
  if (decision === 'unavailable') return

  if (decision === 'unauthenticated') {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
