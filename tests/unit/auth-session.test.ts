import { beforeAll, describe, expect, it } from 'vitest'
import { testAuth } from '../../server/utils/auth-test'

describe('Better Auth test session', () => {
  let helpers: Awaited<typeof testAuth.$context>['test']

  beforeAll(async () => {
    helpers = (await testAuth.$context).test
  })

  it('creates headers that authenticate a protected request', async () => {
    const user = helpers.createUser({
      name: 'Nxmr Test User',
      email: `nxmr-${crypto.randomUUID()}@example.com`,
    })
    await helpers.saveUser(user)

    try {
      const headers = await helpers.getAuthHeaders({ userId: user.id })
      const session = await testAuth.api.getSession({ headers })

      expect(session?.user.id).toBe(user.id)
      expect(session?.user.email).toBe(user.email)
    } finally {
      await helpers.deleteUser(user.id)
    }
  })
})
