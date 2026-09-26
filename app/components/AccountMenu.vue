<script setup lang="ts">
import { entityIcons } from '~/utils/entity-icons'

const props = defineProps<{
  name?: string | null
  image?: string | null
  expanded?: boolean
  mobile?: boolean
}>()
const emit = defineEmits<{ navigate: [] }>()
const open = ref(false)
const route = useRoute()
function openSettings() {
  open.value = false
  emit('navigate')
}
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <UPopover v-model:open="open" :content="{ side: props.mobile ? 'top' : 'right', align: 'end' }">
    <UTooltip :text="props.name ?? 'Account'">
      <button
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left text-sm text-muted hover:bg-accented hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
        :class="props.expanded || props.mobile ? '' : 'justify-center'"
        :aria-label="`Account: ${props.name ?? 'User'}`"
        :aria-expanded="open"
      >
        <UAvatar
          :src="props.image ?? undefined"
          :alt="props.name ?? 'Account'"
          icon="lucide:circle-user-round"
          size="sm"
          class="shrink-0"
        />
        <span v-if="props.expanded || props.mobile" class="truncate">{{ props.name }}</span>
      </button>
    </UTooltip>
    <template #content>
      <div class="min-w-44 space-y-1 p-2">
        <p class="truncate px-2 py-1 text-xs text-muted">{{ props.name }}</p>
        <NuxtLink
          to="/settings"
          class="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-default hover:bg-accented focus-visible:outline-2 focus-visible:outline-primary"
          @click="openSettings"
          ><UIcon
            :name="entityIcons.settings"
            class="size-4"
            aria-hidden="true"
          />Settings</NuxtLink
        >
        <form action="/api/logout" method="post">
          <button
            type="submit"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-default hover:bg-accented focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UIcon name="lucide:log-out" class="size-4" aria-hidden="true" />Sign out
          </button>
        </form>
      </div>
    </template>
  </UPopover>
</template>
