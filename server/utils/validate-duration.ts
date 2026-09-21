import { Effect } from 'effect'

export class InvalidDuration {
  readonly _tag = 'InvalidDuration'

  constructor(readonly value: unknown) {}
}

export const validateDuration = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? Effect.succeed(value)
    : Effect.fail(new InvalidDuration(value))
