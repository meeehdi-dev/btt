import { Effect, Schema } from 'effect'
import { createError, readBody, type H3Event } from 'h3'
import { ValidationError } from './errors'

export async function decodeBody<S extends Schema.Top>(
  event: H3Event,
  schema: S,
): Promise<Schema.Schema.Type<S>> {
  const input = await readBody<unknown>(event)
  try {
    return await Effect.runPromise(
      Schema.decodeUnknownEffect(schema)(input) as Effect.Effect<
        Schema.Schema.Type<S>,
        unknown,
        never
      >,
    )
  } catch (error) {
    const failure = new ValidationError({
      message: error instanceof Error ? error.message : 'Request body is invalid',
    })
    throw createError({ status: 400, statusText: failure.message })
  }
}
