<script setup lang="ts">
import { entityIcons } from '~/utils/entity-icons'

const props = defineProps<{
  name?: string | null
  image?: string | null
}>()
</script>

<template>
  <div class="flex min-w-0 items-center justify-end gap-2">
    <div
      role="group"
      :aria-label="`Signed in as ${props.name ?? 'User'}`"
      class="flex min-w-0 items-center gap-2"
    >
      <UAvatar
        :src="props.image ?? undefined"
        :alt="props.name ?? 'Account'"
        icon="lucide:circle-user-round"
        size="sm"
        class="shrink-0"
      />
      <span class="max-w-36 truncate text-sm font-medium text-highlighted">{{
        props.name ?? 'User'
      }}</span>
    </div>
    <UTooltip text="Settings">
      <UButton
        to="/settings"
        color="neutral"
        variant="ghost"
        size="md"
        :icon="entityIcons.settings"
        aria-label="Settings"
        class="shrink-0 cursor-pointer px-2 py-2 hover:bg-accented hover:text-highlighted"
      >
        <span>Settings</span>
      </UButton>
    </UTooltip>
    <form action="/api/logout" method="post" class="shrink-0">
      <UTooltip text="Sign out">
        <UButton
          type="submit"
          color="neutral"
          variant="ghost"
          size="md"
          icon="lucide:log-out"
          aria-label="Sign out"
          class="shrink-0 cursor-pointer px-2 py-2 hover:bg-accented hover:text-highlighted"
        >
          <span>Sign out</span>
        </UButton>
      </UTooltip>
    </form>
  </div>
</template>
