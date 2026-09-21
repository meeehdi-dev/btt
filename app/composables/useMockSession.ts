const mockSessionCookie = 'nxmr-demo-session'

export function useMockSession() {
  const cookie = useCookie<boolean>(mockSessionCookie, {
    default: () => false,
    sameSite: 'lax',
    httpOnly: false,
    secure: false,
  })
  const session = useState<boolean>('mock-session', () => cookie.value === true)

  const isDevelopment = Boolean(useRuntimeConfig().public.demoAuth)
  const isAuthenticated = computed(() => isDevelopment && session.value)

  async function signIn() {
    if (isDevelopment) {
      session.value = true
      cookie.value = true
      document.cookie = `${mockSessionCookie}=true; Path=/; SameSite=Lax`
      window.location.assign('/dashboard')
    }
  }

  function signOut() {
    session.value = false
    cookie.value = false
  }

  return { isAuthenticated, isDevelopment, signIn, signOut }
}
