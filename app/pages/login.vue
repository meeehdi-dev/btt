<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const route = useRoute()
const pending = ref(false)
const errorMessage = ref('')
const redirectPath = safeRedirect(route.query.redirect)
const { data: session, error: sessionError } = await authClient.useSession(useApiFetch)

if (!sessionError.value && session.value) {
  await navigateTo(redirectPath)
}

async function signInWithGitHub() {
  pending.value = true
  errorMessage.value = ''

  const result = await runClientRequest(() =>
    authClient.signIn.social({
      provider: 'github',
      callbackURL: redirectPath,
    }),
  )

  if (result._tag === 'Failure') {
    pending.value = false
    errorMessage.value = result.failure.userMessage
    return
  }
  if (result.value.error) {
    pending.value = false
    errorMessage.value = toClientApiFailure({
      statusCode: result.value.error.status,
    }).userMessage
  }
}

function safeRedirect(value: unknown) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  return '/today'
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div>
        <p class="text-sm font-medium text-primary">nxmr</p>
        <h1 class="mt-2 text-2xl font-semibold text-highlighted">Welcome back</h1>
      </div>
    </template>
    <p class="text-muted">Sign in to continue to your workday.</p>
    <UAlert
      v-if="sessionError"
      role="alert"
      class="mt-6"
      color="error"
      title="Could not verify your session"
      :description="clientFailureMessage(sessionError)"
    />
    <UButton
      v-if="sessionError"
      class="mt-3"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry session verification"
      @click="refreshNuxtData()"
    />
    <UAlert v-if="errorMessage" role="alert" class="mt-6" color="error" title="Sign-in failed">
      {{ errorMessage }}
    </UAlert>
    <UButton
      class="mt-6 w-full justify-center"
      :loading="pending"
      :disabled="pending"
      icon="lucide:github"
      label="Continue with GitHub"
      @click="signInWithGitHub"
    />
  </UCard>
</template>
