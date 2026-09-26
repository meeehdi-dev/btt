<script setup lang="ts">
import { parseTicketEstimate } from '~/utils/ticket-estimate'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const { data, pending: releasesPending, error: releasesError } = await useFetch('/api/releases')
const releases = computed(() => data.value?.releases ?? [])
const { data: ticketsData, error: ticketsError } = await useFetch('/api/tickets')
const tickets = computed(() => ticketsData.value?.tickets ?? [])
const releaseId = ref(typeof route.query.release === 'string' ? route.query.release : '')
watch(
  releases,
  (available) => {
    if (!available.some((item) => item.release.id === releaseId.value)) releaseId.value = ''
  },
  { immediate: true },
)
const title = ref('')
const description = ref('')
const estimate = ref('')
const links = ref<{ label: string; url: string }[]>([])
const relatedTicketIds = ref<string[]>([])
const selectedRelation = ref('')
const availableRelations = computed(() =>
  tickets.value.filter((item) => !relatedTicketIds.value.includes(item.ticket.id)),
)
function addRelation() {
  if (
    selectedRelation.value &&
    availableRelations.value.some((item) => item.ticket.id === selectedRelation.value)
  )
    relatedTicketIds.value.push(selectedRelation.value)
  selectedRelation.value = ''
}
const pending = ref(false)
const errorMessage = ref('')
const canSubmit = computed(
  () =>
    releases.value.some((item) => item.release.id === releaseId.value) &&
    title.value.trim().length > 0,
)
async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const created = await $fetch<{ id: string }>('/api/tickets', {
      method: 'POST',
      body: {
        releaseId: releaseId.value,
        title: title.value,
        description: description.value,
        estimateMinutes: parseTicketEstimate(estimate.value),
        links: links.value,
        relatedTicketIds: relatedTicketIds.value,
      },
    })
    await navigateTo(`/tickets/${created.id}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to create ticket.'
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div class="w-full space-y-6">
    <div>
      <NuxtLink to="/tickets" class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="tickets" />Tickets</NuxtLink
      >
      <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="tickets" />New ticket
      </h1>
    </div>
    <UAlert v-if="releasesError" color="error" title="Could not load releases"
      >Try again before creating a ticket.</UAlert
    >
    <UCard v-else-if="releasesPending"><p class="text-muted">Loading releases…</p></UCard>
    <UCard v-else-if="!releases.length"
      ><h2 class="font-medium text-highlighted">Create a release first</h2>
      <p class="mt-2 text-muted">Tickets must belong to an active release.</p>
      <UButton to="/releases/new" class="mt-4" icon="lucide:plus" label="Create release"
    /></UCard>
    <UCard v-else
      ><form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Release" required
          ><USelect
            v-model="releaseId"
            :items="
              releases.map((item) => ({
                label: `${item.projectName} · ${item.release.name}`,
                value: item.release.id,
              }))
            "
            class="w-full"
            placeholder="Choose a release"
        /></UFormField>
        <UFormField label="Title" required
          ><UInput v-model="title" class="w-full" placeholder="Implement feature"
        /></UFormField>
        <UFormField label="Description" hint="Optional"
          ><UTextarea v-model="description" class="w-full"
        /></UFormField>
        <UFormField label="Estimate" hint="Optional · try 1hr 30m or 90 (minutes)"
          ><UInput v-model="estimate" type="text" class="w-full" placeholder="1hr 30m"
        /></UFormField>
        <div class="space-y-3 border-t border-muted pt-5">
          <h2 class="font-medium text-highlighted">External links</h2>
          <div
            v-for="(link, index) in links"
            :key="index"
            class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/50 p-3 sm:flex-row sm:items-end"
          >
            <UFormField :label="`Link ${index + 1} label`" required class="flex-1"
              ><UInput v-model="link.label" class="w-full" placeholder="PR"
            /></UFormField>
            <UFormField :label="`Link ${index + 1} URL`" required class="flex-[2]"
              ><UInput
                v-model="link.url"
                type="url"
                class="w-full"
                placeholder="https://example.com"
            /></UFormField>
            <UButton
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Remove link ${index + 1}`"
              label="Remove"
              @click="links.splice(index, 1)"
            />
          </div>
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:plus"
            label="Add link"
            @click="links.push({ label: '', url: '' })"
          />
        </div>
        <div class="space-y-3 border-t border-muted pt-5">
          <h2 class="font-medium text-highlighted">Related tickets</h2>
          <UAlert v-if="ticketsError" color="error" title="Could not load related tickets"
            >You can still create this ticket without a relation.</UAlert
          >
          <div
            v-for="relatedId in relatedTicketIds"
            :key="relatedId"
            class="flex flex-col items-start gap-2 rounded-lg border border-muted bg-elevated/50 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{{ tickets.find((item) => item.ticket.id === relatedId)?.ticket.title }}</span>
            <UButton
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Unlink ${tickets.find((item) => item.ticket.id === relatedId)?.ticket.title}`"
              label="Remove"
              @click="relatedTicketIds = relatedTicketIds.filter((id) => id !== relatedId)"
            />
          </div>
          <div
            v-if="availableRelations.length"
            class="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <UFormField label="Choose related ticket" class="flex-1"
              ><USelect
                v-model="selectedRelation"
                :items="
                  availableRelations.map((item) => ({
                    label: `${item.ticket.title} · ${item.releaseName}`,
                    value: item.ticket.id,
                  }))
                "
                class="w-full"
                placeholder="Choose ticket"
            /></UFormField>
            <UButton
              color="neutral"
              variant="outline"
              :disabled="!selectedRelation"
              icon="lucide:link-2"
              label="Add related ticket"
              @click="addRelation"
            />
          </div>
          <p v-else-if="!ticketsError" class="text-sm text-muted">
            No other active tickets available.
          </p>
        </div>
        <UAlert v-if="errorMessage" color="error" title="Could not create ticket">{{
          errorMessage
        }}</UAlert>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <UButton
            to="/tickets"
            color="neutral"
            variant="ghost"
            icon="lucide:x"
            label="Cancel"
          /><UButton
            type="submit"
            :disabled="!canSubmit"
            :loading="pending"
            icon="lucide:plus"
            label="Create ticket"
          />
        </div></form
    ></UCard>
  </div>
</template>
