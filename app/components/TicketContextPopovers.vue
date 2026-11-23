<script setup lang="ts">
import { ticketLinkLabel } from '~/utils/ticket-link-label'

type ExternalLink = { id: string; label: string | null; url: string }

withDefaults(
  defineProps<{
    externalLinks?: ExternalLink[]
    compact?: boolean
  }>(),
  { externalLinks: () => [], compact: false },
)
const externalOpen = ref(false)
</script>

<template>
  <div class="inline-flex shrink-0 items-center gap-1" aria-label="Ticket links">
    <UTooltip v-if="externalLinks.length" text="External links">
      <UPopover
        v-model:open="externalOpen"
        mode="hover"
        :close-delay="500"
        :content="{ side: 'bottom', align: 'end' }"
      >
        <UButton
          size="xs"
          square
          color="neutral"
          variant="soft"
          :class="[
            '!bg-default !text-muted hover:!text-default',
            compact ? '!h-5 !min-h-5 !w-5 !min-w-5 !p-0 !justify-center' : '',
          ]"
          aria-label="External links"
          @focus="externalOpen = true"
          @click="externalOpen = true"
        >
          <UIcon
            name="lucide:external-link"
            :class="compact ? 'size-3' : 'size-4'"
            aria-hidden="true"
          />
        </UButton>
        <template #content>
          <div class="max-h-64 min-w-40 max-w-72 overflow-y-auto p-1" aria-label="External links">
            <a
              v-for="link in externalLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-default hover:bg-accented hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <UIcon name="lucide:external-link" class="size-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0 truncate">{{ ticketLinkLabel(link.label, link.url) }}</span>
            </a>
          </div>
        </template>
      </UPopover>
    </UTooltip>
  </div>
</template>
