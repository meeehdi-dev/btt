import { Cause, Effect, Exit } from 'effect'
import { describe, expect, it, vi } from 'vitest'
import {
  ConflictError,
  InfrastructureError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../server/domain/errors'
import {
  classifyEffectFailure,
  logUnexpectedFailure,
  toPublicFailure,
} from '../../server/domain/effect-failure'
import { sessionUserId } from '../../server/domain/session'
import { promiseEffect } from '../../server/utils/effect'

describe('server Effect error classification', () => {
  it.each([
    [new ValidationError({ message: 'Invalid input' }), 400, 'Invalid input'],
    [new UnauthenticatedError(), 401, 'UnauthenticatedError'],
    [new NotFoundError({ message: 'Ticket not found' }), 404, 'Ticket not found'],
    [
      new ConflictError({ message: 'Time entries cannot overlap' }),
      409,
      'Time entries cannot overlap',
    ],
  ])('maps %s to HTTP %i', (failure, status, statusText) => {
    expect(classifyEffectFailure(Cause.fail(failure))).toEqual({ status, statusText })
  })

  it('distinguishes an absent session from a failed session lookup', async () => {
    const exit = await Effect.runPromiseExit(sessionUserId(null))

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit))
      expect(classifyEffectFailure(exit.cause)).toEqual({
        status: 401,
        statusText: 'UnauthenticatedError',
      })
    await expect(Effect.runPromise(sessionUserId({ user: { id: 'user-1' } }))).resolves.toBe(
      'user-1',
    )

    const lookupCause = new Error('session provider unavailable')
    const rejectedLookup = await Effect.runPromiseExit(
      promiseEffect('load authenticated session', () => Promise.reject(lookupCause)).pipe(
        Effect.flatMap(sessionUserId),
      ),
    )
    expect(Exit.isFailure(rejectedLookup)).toBe(true)
    if (Exit.isFailure(rejectedLookup)) {
      const classification = classifyEffectFailure(rejectedLookup.cause)
      expect(toPublicFailure(classification)).toEqual({
        status: 500,
        statusText: 'Internal Server Error',
      })
      expect(rejectedLookup.cause.reasons).toMatchObject([
        {
          error: {
            _tag: 'InfrastructureError',
            operation: 'load authenticated session',
            cause: lookupCause,
          },
        },
      ])
    }
  })

  it('wraps rejected promises in a typed infrastructure error with the original cause', async () => {
    const originalCause = new Error('database failure')
    const exit = await Effect.runPromiseExit(
      promiseEffect('load clients', () => Promise.reject(originalCause)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause.reasons).toMatchObject([
        {
          _tag: 'Fail',
          error: { _tag: 'InfrastructureError', operation: 'load clients', cause: originalCause },
        },
      ])
      const classification = classifyEffectFailure(exit.cause)
      expect(classification).toMatchObject({
        status: 500,
        statusText: 'Internal Server Error',
      })
      expect(toPublicFailure(classification)).toEqual({
        status: 500,
        statusText: 'Internal Server Error',
      })
      expect(toPublicFailure(classification)).not.toHaveProperty('cause')
    }
  })

  it('classifies infrastructure failures as a safe 500 while preserving the original cause', () => {
    const originalCause = new Error('database connection string must not be exposed')
    const failure = new InfrastructureError({ operation: 'load clients', cause: originalCause })
    const cause = Cause.fail(failure)
    const classification = classifyEffectFailure(cause)

    expect(classification).toMatchObject({
      status: 500,
      statusText: 'Internal Server Error',
      cause,
    })
    expect(classification.statusText).not.toContain(originalCause.message)
    const publicFailure = toPublicFailure(classification)
    expect(publicFailure).toEqual({ status: 500, statusText: 'Internal Server Error' })
    expect(publicFailure).not.toHaveProperty('cause')

    const log = vi.fn()
    logUnexpectedFailure('/api/clients', cause, log)
    expect(log).toHaveBeenCalledWith('Unexpected server Effect failure', {
      route: '/api/clients',
      cause,
    })

    if ('cause' in classification) {
      expect(classification.cause.reasons).toMatchObject([
        { error: { cause: originalCause, operation: 'load clients' } },
      ])
    }
  })

  it('does not classify defects or mixed failures as client errors', () => {
    const cause = Cause.combine(
      Cause.fail(new ValidationError({ message: 'Bad input' })),
      Cause.die(new Error('unexpected defect')),
    )
    const classification = classifyEffectFailure(cause)

    expect(classification.status).toBe(500)
    expect(classification.statusText).toBe('Internal Server Error')
    expect(classification).toHaveProperty('cause', cause)
  })

  it('maps unrecognized typed failures to a safe 500', () => {
    const classification = classifyEffectFailure(Cause.fail(new Error('private detail')))

    expect(classification.status).toBe(500)
    expect(classification.statusText).toBe('Internal Server Error')
  })
})
