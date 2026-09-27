import { Cause } from 'effect'
import {
  ConflictError,
  InfrastructureError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from './errors'

export type ServerEffectFailure =
  | ValidationError
  | UnauthenticatedError
  | NotFoundError
  | ConflictError
  | InfrastructureError

export type FailureClassification =
  | {
      readonly status: 400 | 401 | 404 | 409
      readonly statusText: string
    }
  | {
      readonly status: 500
      readonly statusText: 'Internal Server Error'
      readonly cause: Cause.Cause<unknown>
    }

export type PublicFailure = Pick<FailureClassification, 'status' | 'statusText'>
export type UnexpectedFailureLogger = (
  message: string,
  details: { readonly route: string; readonly cause: Cause.Cause<unknown> | unknown },
) => void

export function toPublicFailure(classification: FailureClassification): PublicFailure {
  return { status: classification.status, statusText: classification.statusText }
}

export function logUnexpectedFailure(
  route: string,
  cause: Cause.Cause<unknown> | unknown,
  log: UnexpectedFailureLogger = console.error,
) {
  log('Unexpected server Effect failure', { route, cause })
}

export function classifyEffectFailure(cause: Cause.Cause<unknown>): FailureClassification {
  if (cause.reasons.length === 1) {
    const reason = cause.reasons[0]!
    if (Cause.isFailReason(reason)) {
      const failure = reason.error
      if (failure instanceof ValidationError) return { status: 400, statusText: failure.message }
      if (failure instanceof UnauthenticatedError)
        return { status: 401, statusText: 'UnauthenticatedError' }
      if (failure instanceof NotFoundError) return { status: 404, statusText: failure.message }
      if (failure instanceof ConflictError) return { status: 409, statusText: failure.message }
    }
  }

  return { status: 500, statusText: 'Internal Server Error', cause }
}
