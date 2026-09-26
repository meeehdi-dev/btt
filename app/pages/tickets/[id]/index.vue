<script setup lang="ts">
import { nextStatus } from '#shared/ticket-status'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/tickets/' + id
const showArchived = route.query.archived === 'true'
const { data, error, refresh } = await useFetch(`/api/tickets/${id}`, {
  query: { archived: showArchived ? 'true' : undefined },
})
if (error.value || !data.value) throw createError({ status: 404, statusText: 'Ticket not found' })
const record = computed(() => data.value!.ticket)
const { data: choices } = await useFetch('/api/tickets')
const relatedId = ref('')
const label = ref('')
const url = ref('')
const pending = ref(false)
const actionError = ref('')
async function action(run: () => Promise<unknown>) {
  pending.value = true
  actionError.value = ''
  try {
    await run()
    await refresh()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Unable to update ticket.'
  } finally {
    pending.value = false
  }
}
async function advance() {
  const status = nextStatus(record.value.status)
  if (status) await action(() => $fetch<unknown>(endpoint, { method: 'PATCH', body: { status } }))
}
async function addLink() {
  await action(async () => {
    await $fetch<unknown>(endpoint + '/links', {
      method: 'POST',
      body: { label: label.value, url: url.value },
    })
    label.value = ''
    url.value = ''
  })
}
async function addRelation() {
  if (!relatedId.value) return
  await action(async () => {
    await $fetch<unknown>(endpoint + '/relations', {
      method: 'POST',
      body: { ticketId: relatedId.value },
    })
    relatedId.value = ''
  })
}
</script>
<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <NuxtLink to="/tickets" class="inline-flex items-center gap-1 text-sm text-primary"
          >← <EntityIcon kind="tickets" />Tickets</NuxtLink
        >
        <div class="mt-3 flex items-center gap-3">
          <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
            <EntityIcon kind="tickets" />{{ record.title }}
          </h1>
          <UBadge v-if="record.archivedAt" color="neutral">Archived</UBadge>
        </div>
        <p class="mt-2 text-muted">
          <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <NuxtLink
              :to="`/clients/${data?.hierarchy.clientId}`"
              class="inline-flex items-center gap-1 text-primary"
              ><EntityIcon kind="clients" />{{ data?.hierarchy.clientName }}</NuxtLink
            >
            <NuxtLink
              :to="`/projects/${data?.hierarchy.projectId}`"
              class="inline-flex items-center gap-1 text-primary"
              ><EntityIcon kind="projects" />{{ data?.hierarchy.projectName }}</NuxtLink
            >
            <NuxtLink
              :to="`/releases/${record.releaseId}`"
              class="inline-flex items-center gap-1 text-primary"
              ><EntityIcon kind="releases" />{{ data?.hierarchy.releaseName }}</NuxtLink
            >
          </span>
          · {{ record.status
          }}<template v-if="record.estimateMinutes">
            · <TicketEstimate :minutes="record.estimateMinutes" />
          </template>
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          v-if="!record.archivedAt && nextStatus(record.status)"
          :loading="pending"
          color="neutral"
          variant="outline"
          :label="`Move to ${nextStatus(record.status)}`"
          @click="advance"
        /><UButton
          :to="`/tickets/${id}/edit${record.archivedAt ? '?archived=true' : ''}`"
          label="Edit"
        />
      </div>
    </div>
    <UAlert v-if="actionError" color="error" title="Could not update ticket">{{
      actionError
    }}</UAlert>
    <UCard
      ><h2 class="font-medium text-highlighted">Description</h2>
      <p class="mt-2 whitespace-pre-wrap text-muted">
        {{ record.description || 'No description yet.' }}
      </p></UCard
    >
    <div class="grid gap-6 md:grid-cols-2">
      <UCard
        ><h2 class="font-medium text-highlighted">External links</h2>
        <ul v-if="data?.links.length" class="mt-3 space-y-2">
          <li
            v-for="link in data.links"
            :key="link.id"
            class="flex items-center justify-between gap-2"
          >
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="break-all text-primary underline"
              >{{ link.label }}</a
            ><UButton
              :disabled="pending"
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Remove ${link.label}`"
              @click="
                action(() => $fetch<unknown>(endpoint + '/links/' + link.id, { method: 'DELETE' }))
              "
            />
          </li>
        </ul>
        <p v-else class="mt-2 text-muted">No external links.</p>
        <form class="mt-4 space-y-2" @submit.prevent="addLink">
          <UFormField label="Link label" required
            ><UInput v-model="label" class="w-full" /></UFormField
          ><UFormField label="URL" required
            ><UInput
              v-model="url"
              type="url"
              class="w-full"
              placeholder="https://example.com" /></UFormField
          ><UButton type="submit" :loading="pending" label="Add link" /></form
      ></UCard>
      <UCard
        ><h2 class="font-medium text-highlighted">Related tickets</h2>
        <ul v-if="data?.related.length" class="mt-3 space-y-2">
          <li
            v-for="other in data.related"
            :key="other.id"
            class="flex items-center justify-between gap-2"
          >
            <NuxtLink
              :to="`/tickets/${other.id}`"
              class="inline-flex items-center gap-1 text-primary underline"
              ><EntityIcon kind="tickets" />{{ other.title }}</NuxtLink
            >
            <UButton
              :disabled="pending"
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Unlink ${other.title}`"
              @click="
                action(() =>
                  $fetch<unknown>(endpoint + '/relations/' + other.relationId, {
                    method: 'DELETE',
                  }),
                )
              "
            />
          </li>
        </ul>
        <p v-else class="mt-2 text-muted">No related tickets.</p>
        <form class="mt-4 space-y-2" @submit.prevent="addRelation">
          <UFormField label="Link a ticket"
            ><USelect
              v-model="relatedId"
              :items="
                (choices?.tickets ?? [])
                  .filter(
                    (item) =>
                      item.ticket.id !== id &&
                      !data?.related.some((other) => other.id === item.ticket.id),
                  )
                  .map((item) => ({
                    label: `${item.ticket.title} · ${item.releaseName}`,
                    value: item.ticket.id,
                  }))
              "
              class="w-full"
              placeholder="Choose ticket" /></UFormField
          ><UButton
            type="submit"
            :disabled="!relatedId"
            :loading="pending"
            label="Link ticket"
          /></form
      ></UCard>
    </div>
  </div>
</template>
