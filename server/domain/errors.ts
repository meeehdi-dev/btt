import { Data } from 'effect'

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string
}> {}

export class UnauthenticatedError extends Data.TaggedError('UnauthenticatedError')<{}> {}

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  readonly message: string
}> {}

export class ConflictError extends Data.TaggedError('ConflictError')<{
  readonly message: string
}> {}
