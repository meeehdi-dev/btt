import { Effect, Schema } from 'effect'
import { getQuery, getRequestHeaders, getRouterParam, isError, type H3Event } from 'h3'
import {
  NotFoundError,
  ConflictError,
  InfrastructureError,
  ValidationError,
} from '../domain/errors'
import { sessionUserId } from '../domain/session'
import { auth } from './auth'
import { promiseEffect } from './effect'

export function requireUserId(event: H3Event) {
  return promiseEffect('load authenticated session', () =>
    auth.api.getSession({
      headers: new Headers(getRequestHeaders(event) as Record<string, string>),
    }),
  ).pipe(Effect.flatMap(sessionUserId))
}

export function queryOf(event: H3Event) {
  return Effect.try({
    try: () => getQuery(event),
    catch: (cause) =>
      isError(cause) ? cause : new InfrastructureError({ operation: 'parse request query', cause }),
  })
}

export function includeArchived(event: H3Event) {
  return queryOf(event).pipe(
    Effect.map((query) => query.archived === 'true' || query.archived === 'all'),
  )
}

export function idParam(event: H3Event, name: string) {
  const value = getRouterParam(event, name)
  if (!value) return Effect.fail(new ValidationError({ message: `${name} is required` }))
  return Schema.decodeUnknownEffect(Schema.String.check(Schema.isMinLength(1)))(value).pipe(
    Effect.mapError(() => new ValidationError({ message: `${name} is required` })),
  )
}

export function notFound(message = 'Record not found') {
  return Effect.fail(new NotFoundError({ message }))
}

export function conflict(message: string) {
  return Effect.fail(new ConflictError({ message }))
}

export function validation(message: string) {
  return Effect.fail(new ValidationError({ message }))
}

export function now() {
  return new Date()
}
