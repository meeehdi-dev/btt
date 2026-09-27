import { Effect } from 'effect'
import { clientRequestEffect } from '~/utils/client-effect'

type EffectFetchOptions = RequestInit & Record<string, unknown>
type EffectFetch = (
  request: string | Request | URL,
  options?: EffectFetchOptions,
) => Promise<unknown>

function createEffectFetch(rawFetch: EffectFetch): typeof $fetch {
  return ((request: string | Request | URL, options?: EffectFetchOptions) =>
    Effect.runPromise(
      clientRequestEffect((signal) =>
        rawFetch(request, { ...options, signal: options?.signal ?? signal }),
      ),
    )) as unknown as typeof $fetch
}

export const useApiFetch = createUseFetch(() => {
  // Keep Nuxt's server-side request context so cookies and forwarded headers survive SSR,
  // especially for Better Auth's `useSession(useApiFetch)` integration.
  let rawFetch: EffectFetch
  if (import.meta.server) rawFetch = useRequestFetch() as unknown as EffectFetch
  else rawFetch = $fetch as unknown as EffectFetch
  return { $fetch: createEffectFetch(rawFetch) }
}) as unknown as typeof useFetch
