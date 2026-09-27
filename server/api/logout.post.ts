import { Effect } from 'effect'
import { sendRedirect } from 'h3'
import { auth } from '../utils/auth'
import { promiseEffect } from '../utils/effect'
import { defineEffectHandler } from '../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    yield* promiseEffect('sign out', () => auth.api.signOut({ headers: event.headers }))
    return yield* promiseEffect('redirect after sign out', () => sendRedirect(event, '/login'))
  }),
)
