import {
  createError,
  getQuery,
  getRequestHeaders,
  getRouterParam,
  readBody,
  type H3Event,
} from 'h3'
import { auth } from './auth'
import { ConflictError, NotFoundError, UnauthenticatedError } from '../domain/errors'
import {
  validateHexColor,
  validateOptionalArchived,
  validateOptionalName,
  validateOptionalTargetDate,
  validateRequiredName,
} from './domain-validation'

export async function requireUserId(event: H3Event) {
  const session = await auth.api.getSession({
    headers: new Headers(getRequestHeaders(event) as Record<string, string>),
  })

  if (!session) {
    const failure = new UnauthenticatedError()
    throw createError({ status: 401, statusText: failure.constructor.name })
  }

  return session.user.id
}

export async function bodyOf<T>(event: H3Event) {
  const body = await readBody<unknown>(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ status: 400, statusText: 'A JSON object is required' })
  }
  return body as T
}

function asBadRequest<T>(validate: () => T) {
  try {
    return validate()
  } catch (error) {
    throw createError({
      status: 400,
      statusText: error instanceof Error ? error.message : 'Invalid request',
    })
  }
}

export function requiredName(value: unknown) {
  return asBadRequest(() => validateRequiredName(value))
}

export function optionalName(value: unknown) {
  return asBadRequest(() => validateOptionalName(value))
}

export function hexColor(value: unknown) {
  return asBadRequest(() => validateHexColor(value))
}

export function optionalArchived(value: unknown) {
  return asBadRequest(() => validateOptionalArchived(value))
}

export function optionalTargetDate(value: unknown) {
  return asBadRequest(() => validateOptionalTargetDate(value))
}

export function includeArchived(event: H3Event) {
  const value = getQuery(event).archived
  return value === 'true' || value === 'all'
}

export function idParam(event: H3Event, name: string) {
  const value = getRouterParam(event, name)
  if (!value) throw createError({ status: 400, statusText: `${name} is required` })
  return value
}

export function notFound(message = 'Record not found'): never {
  const failure = new NotFoundError({ message })
  throw createError({ status: 404, statusText: failure.message })
}

export function conflict(message: string): never {
  const failure = new ConflictError({ message })
  throw createError({ status: 409, statusText: failure.message })
}

export function now() {
  return new Date()
}
