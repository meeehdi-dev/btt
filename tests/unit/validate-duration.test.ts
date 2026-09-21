import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'
import { InvalidDuration, validateDuration } from '../../server/utils/validate-duration'

describe('validateDuration', () => {
  it('returns positive safe integer minutes', async () => {
    await expect(Effect.runPromise(validateDuration(30))).resolves.toBe(30)
  })

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
    '30',
    null,
  ])('rejects %s', async (value) => {
    const result = await Effect.runPromise(validateDuration(value)).catch((error) => error)
    expect(result).toBeInstanceOf(InvalidDuration)
  })
})
