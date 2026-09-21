import { auth } from '../utils/auth'

export default defineEventHandler(async (event) => {
  await auth.api.signOut({ headers: event.headers })
  return sendRedirect(event, '/login')
})
