import { Cause, Data, Effect, Exit } from 'effect'

export type ClientFailureKind =
  | 'validation'
  | 'unauthenticated'
  | 'not-found'
  | 'conflict'
  | 'unavailable'
  | 'unexpected'

export class ClientApiFailure extends Data.TaggedError('ClientApiFailure')<{
  readonly kind: ClientFailureKind
  readonly statusCode: number | null
  readonly userMessage: string
  readonly cause: unknown
}> {}

export type ClientEffectResult<A> =
  | { readonly _tag: 'Success'; readonly value: A }
  | { readonly _tag: 'Failure'; readonly failure: ClientApiFailure }

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : undefined
}

function responseData(value: unknown): UnknownRecord | undefined {
  const outer = record(value)
  return record(outer?.data)
}

function statusCodeOf(value: unknown): number | null {
  const outer = record(value)
  const data = responseData(value)
  const response = record(outer?.response)
  const status = [outer?.statusCode, outer?.status, data?.statusCode, response?.status].find(
    (candidate): candidate is number =>
      typeof candidate === 'number' && Number.isInteger(candidate),
  )
  return status ?? null
}

function publicStatusMessage(value: unknown): string | undefined {
  const outer = record(value)
  const data = responseData(value)
  const candidates = [outer?.statusMessage, data?.statusMessage]
  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0,
  )
}

function failure(
  kind: ClientFailureKind,
  statusCode: number | null,
  userMessage: string,
  cause: unknown,
) {
  return new ClientApiFailure({ kind, statusCode, userMessage, cause })
}

export function toClientApiFailure(cause: unknown): ClientApiFailure {
  if (cause instanceof ClientApiFailure) return cause

  const statusCode = statusCodeOf(cause)
  const statusMessage = publicStatusMessage(cause)

  switch (statusCode) {
    case 400:
      return failure('validation', statusCode, statusMessage ?? 'The request is invalid.', cause)
    case 401:
      return failure(
        'unauthenticated',
        statusCode,
        'Your session may have expired. Please sign in again.',
        cause,
      )
    case 404:
      return failure(
        'not-found',
        statusCode,
        statusMessage ?? 'The requested item was not found.',
        cause,
      )
    case 409:
      return failure(
        'conflict',
        statusCode,
        statusMessage ?? 'This change conflicts with current data.',
        cause,
      )
    default:
      return failure(
        statusCode !== null && statusCode < 500 ? 'unexpected' : 'unavailable',
        statusCode,
        'The request could not be completed. Please try again.',
        cause,
      )
  }
}

export function clientRequestEffect<A>(
  request: (signal: AbortSignal) => Promise<A>,
): Effect.Effect<A, ClientApiFailure> {
  return Effect.tryPromise({ try: request, catch: toClientApiFailure })
}

export async function runClientRequest<A>(
  request: (signal: AbortSignal) => Promise<A>,
): Promise<ClientEffectResult<A>> {
  return runClientEffect(clientRequestEffect(request))
}

export function refreshEffect(
  refresh: () => Promise<unknown>,
  getError: () => unknown,
): Effect.Effect<void, ClientApiFailure> {
  return clientRequestEffect(async () => {
    await refresh()
    const error = getError()
    if (error) throw error
  })
}

function failureFromCause(cause: Cause.Cause<ClientApiFailure>): ClientApiFailure {
  if (cause.reasons.length === 1) {
    const reason = cause.reasons[0]!
    if (Cause.isFailReason(reason) && reason.error instanceof ClientApiFailure) return reason.error
  }
  return toClientApiFailure(cause)
}

export async function runClientEffect<A>(
  effect: Effect.Effect<A, ClientApiFailure>,
): Promise<ClientEffectResult<A>> {
  try {
    const exit = await Effect.runPromiseExit(effect)
    if (Exit.isSuccess(exit)) return { _tag: 'Success', value: exit.value }
    return { _tag: 'Failure', failure: failureFromCause(exit.cause) }
  } catch (cause) {
    return { _tag: 'Failure', failure: toClientApiFailure(cause) }
  }
}

export function clientFailureMessage(error: unknown, fallback?: string): string {
  return toClientApiFailure(error).userMessage || fallback || 'The request could not be completed.'
}

export function clientFailureStatus(error: unknown): number | null {
  return statusCodeOf(error)
}

export type ClientSessionDecision = 'authenticated' | 'unauthenticated' | 'unavailable'

export function clientSessionDecision(session: unknown, error: unknown): ClientSessionDecision {
  if (error) return 'unavailable'
  return session ? 'authenticated' : 'unauthenticated'
}
