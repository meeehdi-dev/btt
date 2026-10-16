import type { BrowserContext } from '@playwright/test'
import { testAuth } from '../../../server/utils/auth-test'

export async function createTestOwner(context: BrowserContext, name: string, emailPrefix: string) {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name,
    email: `${emailPrefix}-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
  return { helpers, user }
}
