import { Effect } from 'effect'
import { InfrastructureError } from '../domain/errors'

export function promiseEffect<A>(operation: string, attempt: () => PromiseLike<A>) {
  return Effect.tryPromise({
    try: attempt,
    catch: (cause) => new InfrastructureError({ operation, cause }),
  })
}
