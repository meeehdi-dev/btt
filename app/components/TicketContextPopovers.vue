<script setup lang="ts">
type RelatedTicket = { id: string; title: string; archived?: boolean }
type ExternalLink = { id: string; label: string; url: string }

withDefaults(
  defineProps<{
    relatedTickets?: RelatedTicket[]
    externalLinks?: ExternalLink[]
  }>(),
  { relatedTickets: () => [], externalLinks: () => [] },
)
const relatedOpen = ref(false)
const externalOpen = ref(false)
const countChipUi = {
  base: 'h-4 min-w-4 px-1 text-[10px] -translate-y-1/4 translate-x-1/4',
}
const emit = defineEmits<{
  'related-hover': [id: string | null]
  'related-click': [event: MouseEvent, id: string]
}>()
</script>

<template>
  <div class="inline-flex shrink-0 items-center gap-1" aria-label="Ticket links">
    <UTooltip v-if="relatedTickets.length" text="Related tickets">
      <UPopover
        v-model:open="relatedOpen"
        mode="hover"
        enable-touch
        :close-delay="500"
        :content="{ side: 'bottom', align: 'start' }"
      >
        <UButton
          size="xs"
          square
          color="neutral"
          variant="ghost"
          aria-label="Related tickets"
          @focus="relatedOpen = true"
          @click="relatedOpen = true"
        >
          <UChip
            :show="relatedTickets.length > 1"
            :text="relatedTickets.length > 1 ? relatedTickets.length : undefined"
            color="neutral"
            size="lg"
            :ui="countChipUi"
          >
            <EntityIcon kind="related" />
          </UChip>
        </UButton>
        <template #content>
          <div class="max-h-64 min-w-48 max-w-72 overflow-y-auto p-2" aria-label="Related tickets">
            <NuxtLink
              v-for="related in relatedTickets"
              :key="related.id"
              :data-related-ticket-id="related.id"
              :to="`/tickets/${related.id}${related.archived ? '?archived=true' : ''}`"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-default hover:bg-accented hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              @mouseenter="emit('related-hover', related.id)"
              @mouseleave="emit('related-hover', null)"
              @focus="emit('related-hover', related.id)"
              @blur="emit('related-hover', null)"
              @click.capture="emit('related-click', $event, related.id)"
            >
              <EntityIcon kind="related" />
              <span class="min-w-0 truncate">{{ related.title }}</span>
            </NuxtLink>
          </div>
        </template>
      </UPopover>
    </UTooltip>
    <UTooltip v-if="externalLinks.length" text="External links">
      <UPopover
        v-model:open="externalOpen"
        mode="hover"
        enable-touch
        :close-delay="500"
        :content="{ side: 'bottom', align: 'end' }"
      >
        <UButton
          size="xs"
          square
          color="neutral"
          variant="ghost"
          aria-label="External links"
          @focus="externalOpen = true"
          @click="externalOpen = true"
        >
          <UChip
            :show="externalLinks.length > 1"
            :text="externalLinks.length > 1 ? externalLinks.length : undefined"
            color="neutral"
            size="lg"
            :ui="countChipUi"
          >
            <UIcon name="lucide:external-link" class="size-4" aria-hidden="true" />
          </UChip>
        </UButton>
        <template #content>
          <div class="max-h-64 min-w-40 max-w-72 overflow-y-auto p-2" aria-label="External links">
            <a
              v-for="link in externalLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-default hover:bg-accented hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <UIcon name="lucide:external-link" class="size-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0 truncate">{{ link.label }}</span>
            </a>
          </div>
        </template>
      </UPopover>
    </UTooltip>
  </div>
</template>
