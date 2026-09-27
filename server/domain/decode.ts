import { Effect, Schema } from 'effect'
import { isError, readBody, type H3Event } from 'h3'
import { InfrastructureError, ValidationError } from './errors'

export function decodeBody<S extends Schema.Top>(event: H3Event, schema: S) {
  const body = Effect.tryPromise({
    try: () => readBody<unknown>(event),
    catch: (cause) =>
      isError(cause) ? cause : new InfrastructureError({ operation: 'read request body', cause }),
  })

  return body.pipe(
    Effect.flatMap((input) =>
      Schema.decodeUnknownEffect(schema)(input).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              message: error instanceof Error ? error.message : 'Request body is invalid',
            }),
        ),
      ),
    ),
  )
}
