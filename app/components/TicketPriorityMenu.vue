<script setup lang="ts">
import {
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketPriorityOptionValue,
  ticketPriorityOptions,
  type TicketPriorityValue,
} from '#shared/ticket-priority'

const props = defineProps<{
  ticketTitle: string
  priority: TicketPriorityValue
  busy?: boolean
  disabled?: boolean
  compact?: boolean
}>()
const emit = defineEmits<{
  change: [priority: TicketPriorityValue]
}>()
const menuItems = computed(() =>
  ticketPriorityOptions.map(({ label, value, icon }) => {
    const current = ticketPriorityOptionValue(props.priority) === value
    return {
      label,
      icon,
      current,
      disabled: props.busy || props.disabled || current,
      onSelect: () => emit('change', value === 'none' ? null : value),
    }
  }),
)
</script>

<template>
  <div class="shrink-0">
    <UTooltip :text="`Change priority for ${ticketTitle}`">
      <UDropdownMenu
        :items="menuItems"
        :content="{ side: 'top', avoidCollisions: false }"
        size="xs"
      >
        <template #item-trailing="{ item }">
          <UIcon
            v-if="item.current"
            name="lucide:check"
            data-slot="ticketPriorityCurrentIcon"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
        </template>
        <UButton
          size="xs"
          square
          color="neutral"
          variant="ghost"
          :disabled="busy || disabled"
          :aria-busy="busy || undefined"
          :aria-label="`Change priority for ${ticketTitle} from ${ticketPriorityLabel(priority)}`"
          data-ticket-priority-trigger
          :class="[
            '!bg-transparent !text-muted hover:!bg-elevated/40 hover:!text-default active:!bg-elevated/40',
            '!inline-flex !items-center !justify-center !p-0',
            compact ? '!h-5 !min-h-5 !w-5 !min-w-5' : '!h-6 !min-h-6 !w-6 !min-w-6',
          ]"
        >
          <UIcon
            :name="ticketPriorityIcon(priority)"
            :data-ticket-priority-icon="ticketPriorityOptionValue(priority)"
            :data-ticket-priority-icon-name="ticketPriorityIcon(priority)"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
        </UButton>
      </UDropdownMenu>
    </UTooltip>
  </div>
</template>
