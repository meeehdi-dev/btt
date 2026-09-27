import { Schema } from 'effect'

export class ValidationError extends Schema.TaggedError<ValidationError>()('ValidationError', {
  message: Schema.String,
}) {}

export class UnauthenticatedError extends Schema.TaggedError<UnauthenticatedError>()(
  'UnauthenticatedError',
  {},
) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>()('NotFoundError', {
  message: Schema.String,
}) {}

export class ConflictError extends Schema.TaggedError<ConflictError>()('ConflictError', {
  message: Schema.String,
}) {}

export class InfrastructureError extends Schema.TaggedError<InfrastructureError>()(
  'InfrastructureError',
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}
