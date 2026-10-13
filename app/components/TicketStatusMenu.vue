<script setup lang="ts">
import { ticketStatusIcon, ticketStatuses, type TicketStatus } from '#shared/ticket-status'

const props = defineProps<{
  ticketTitle: string
  status: TicketStatus
  busy?: boolean
  disabled?: boolean
  itemDisabled?: boolean
  busyIndicator?: boolean
  loading?: boolean
  compact?: boolean
}>()
const emit = defineEmits<{
  change: [status: TicketStatus]
}>()
const menuItems = computed(() =>
  ticketStatuses.map((status) => ({
    label: status,
    icon: ticketStatusIcon(status),
    current: props.status === status,
    disabled: props.busy || props.itemDisabled || props.status === status,
    onSelect: () => emit('change', status),
  })),
)
</script>

<template>
  <UTooltip :text="`Change status for ${ticketTitle}`">
    <UDropdownMenu :items="menuItems" :content="{ side: 'top', avoidCollisions: false }" size="xs">
      <template #item-trailing="{ item }">
        <UIcon
          v-if="item.current"
          name="lucide:check"
          data-slot="ticketStatusCurrentIcon"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
      </template>
      <UButton
        size="xs"
        square
        color="neutral"
        variant="ghost"
        :loading="loading"
        :disabled="busy || disabled"
        :aria-busy="busyIndicator || undefined"
        :aria-label="`Change status for ${ticketTitle} from ${status}`"
        data-ticket-status-trigger
        :class="[
          '!text-muted hover:!text-default',
          compact ? '!h-5 !min-h-5 !w-5 !min-w-5 !p-0 !justify-center' : '',
        ]"
      >
        <UIcon
          :name="ticketStatusIcon(status)"
          :data-ticket-status-icon="status"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
      </UButton>
    </UDropdownMenu>
  </UTooltip>
</template>
