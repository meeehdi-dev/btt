import { Effect } from 'effect'
import { UnauthenticatedError } from './errors'

export function sessionUserId(session: { readonly user: { readonly id: string } } | null) {
  return session ? Effect.succeed(session.user.id) : Effect.fail(new UnauthenticatedError())
}
