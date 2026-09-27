import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import {
  ClientApiFailure,
  clientFailureMessage,
  clientFailureStatus,
  clientRequestEffect,
  clientSessionDecision,
  refreshEffect,
  runClientEffect,
  toClientApiFailure,
} from '../../app/utils/client-effect'

describe('client Effect failures', () => {
  it.each([
    [null, null, 'unauthenticated'],
    [{ user: { id: 'user-1' } }, null, 'authenticated'],
    [null, new Error('private session provider detail'), 'unavailable'],
    [{ user: { id: 'stale-user' } }, new Error('session refresh failed'), 'unavailable'],
  ] as const)('makes a distinct session decision', (session, error, decision) => {
    expect(clientSessionDecision(session, error)).toBe(decision)
  })

  it.each([
    [400, 'Invalid request body', 'validation'],
    [404, 'Client not found', 'not-found'],
    [409, 'Time entries cannot overlap', 'conflict'],
  ] as const)(
    'preserves the safe public %i response message',
    (statusCode, statusMessage, kind) => {
      const result = toClientApiFailure({ statusCode, statusMessage })

      expect(result).toBeInstanceOf(ClientApiFailure)
      expect(result).toMatchObject({ kind, statusCode, userMessage: statusMessage })
      expect(clientFailureMessage(result)).toBe(statusMessage)
      expect(clientFailureStatus(result)).toBe(statusCode)
    },
  )

  it('uses a safe session message for 401 without exposing response details', () => {
    const failure = toClientApiFailure({
      statusCode: 401,
      statusMessage: 'private auth provider detail',
    })

    expect(failure.kind).toBe('unauthenticated')
    expect(failure.userMessage).toBe('Your session may have expired. Please sign in again.')
    expect(clientFailureMessage(failure)).not.toContain('private auth provider detail')
  })

  it.each([
    { statusCode: 503, statusMessage: 'database password leaked' },
    new Error('network host secret.internal unavailable'),
  ])('projects infrastructure and network errors to generic safe feedback', (cause) => {
    const failure = toClientApiFailure(cause)

    expect(failure.kind).toBe('unavailable')
    expect(failure.userMessage).toBe('The request could not be completed. Please try again.')
    expect(clientFailureMessage(failure)).not.toContain('secret')
    expect(failure.cause).toBe(cause)
  })

  it('maps rejected promises into a typed failure and preserves the cause internally', async () => {
    const cause = new Error('private implementation detail')
    const exit = await Effect.runPromiseExit(clientRequestEffect(() => Promise.reject(cause)))

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause.reasons).toMatchObject([
        { _tag: 'Fail', error: { _tag: 'ClientApiFailure', cause } },
      ])
    }
  })

  it('returns success and typed failure outcomes without rejecting the UI boundary', async () => {
    await expect(runClientEffect(Effect.succeed('saved'))).resolves.toEqual({
      _tag: 'Success',
      value: 'saved',
    })

    const result = await runClientEffect(
      Effect.fail(toClientApiFailure({ statusCode: 409, statusMessage: 'Conflict' })),
    )
    expect(result).toMatchObject({
      _tag: 'Failure',
      failure: { kind: 'conflict', userMessage: 'Conflict' },
    })
  })

  it('handles defects at the UI boundary with generic feedback', async () => {
    const result = await runClientEffect(Effect.die(new Error('secret defect')))

    expect(result).toMatchObject({
      _tag: 'Failure',
      failure: {
        kind: 'unavailable',
        userMessage: 'The request could not be completed. Please try again.',
      },
    })
    if (result._tag === 'Failure')
      expect(clientFailureMessage(result.failure)).not.toContain('secret')
  })

  it('forwards a cancellation signal to Effect-wrapped requests', async () => {
    let requestSignal: AbortSignal | undefined
    await Effect.runPromise(
      clientRequestEffect((signal) => {
        requestSignal = signal
        return Promise.resolve('ok')
      }),
    )

    expect(requestSignal).toBeInstanceOf(AbortSignal)
  })

  it('treats a failed Nuxt refresh as a typed failure', async () => {
    const result = await runClientEffect(
      refreshEffect(
        async () => undefined,
        () => ({ statusCode: 503, statusMessage: 'Internal Server Error' }),
      ),
    )

    expect(result).toMatchObject({
      _tag: 'Failure',
      failure: { kind: 'unavailable' },
    })
  })
})
