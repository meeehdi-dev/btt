import { Effect, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { ClientCreate, ProjectCreate, ReleaseCreate } from '../../server/domain/schemas'

describe('M2 Effect request schemas', () => {
  it('decodes valid hierarchy payloads', async () => {
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(ClientCreate)({ name: 'Acme', color: '#ABC123' }),
      ),
    ).resolves.toEqual({ name: 'Acme', color: '#ABC123' })
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(ProjectCreate)({
          clientId: 'c1',
          name: 'Site',
          color: '#abcdef',
        }),
      ),
    ).resolves.toEqual({ clientId: 'c1', name: 'Site', color: '#abcdef' })
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(ReleaseCreate)({ projectId: 'p1', name: 'Launch' }),
      ),
    ).resolves.toEqual({ projectId: 'p1', name: 'Launch' })
  })

  it('rejects invalid values with a typed schema failure', async () => {
    await expect(
      Effect.runPromise(Schema.decodeUnknownEffect(ClientCreate)({ name: ' ', color: 'blue' })),
    ).rejects.toThrow()
  })
})
