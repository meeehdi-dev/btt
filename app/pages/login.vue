<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const route = useRoute()
const pending = ref(false)
const errorMessage = ref('')
const redirectPath = safeRedirect(route.query.redirect)
const { data: session } = await authClient.useSession(useFetch)

if (session.value) {
  await navigateTo(redirectPath)
}

async function signInWithGitHub() {
  pending.value = true
  errorMessage.value = ''

  const result = await authClient.signIn.social({
    provider: 'github',
    callbackURL: redirectPath,
  })

  if (result.error) {
    pending.value = false
    errorMessage.value = result.error.message ?? 'Unable to start GitHub sign-in.'
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
    <UAlert v-if="errorMessage" class="mt-6" color="error" title="Sign-in failed">
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
