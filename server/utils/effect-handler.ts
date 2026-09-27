import { Cause, Effect, Exit } from 'effect'
import { createError, defineEventHandler, isError, type H3Error, type H3Event } from 'h3'
import {
  classifyEffectFailure,
  logUnexpectedFailure,
  toPublicFailure,
  type ServerEffectFailure,
  type UnexpectedFailureLogger,
} from '../domain/effect-failure'

export type ServerFailure = ServerEffectFailure | H3Error

function unexpectedError() {
  return createError({ status: 500, statusText: 'Internal Server Error' })
}

export function effectFailureToHttpError(
  cause: Cause.Cause<ServerFailure>,
  route: string,
  log: UnexpectedFailureLogger = console.error,
): H3Error {
  if (cause.reasons.length === 1) {
    const reason = cause.reasons[0]!
    if (Cause.isFailReason(reason) && isError(reason.error)) return reason.error
  }

  const classification = classifyEffectFailure(cause)
  if ('cause' in classification) logUnexpectedFailure(route, classification.cause, log)
  return createError(toPublicFailure(classification))
}

export function defineEffectHandler<A>(
  handler: (event: H3Event) => Effect.Effect<A, ServerFailure>,
) {
  return defineEventHandler(async (event) => {
    let exit: Exit.Exit<A, ServerFailure>
    try {
      exit = await Effect.runPromiseExit(handler(event))
    } catch (cause) {
      console.error('Unexpected server Effect runner failure', { route: event.path, cause })
      throw unexpectedError()
    }

    if (Exit.isFailure(exit)) throw effectFailureToHttpError(exit.cause, event.path)

    return exit.value
  })
}
