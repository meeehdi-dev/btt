<script setup lang="ts">
import TicketHierarchyTransition from './TicketHierarchyTransition.vue'
import { modalFormShortcutContent } from '~/composables/modal-form-shortcuts'
import { useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { useAppToast } from '~/composables/useAppToast'

type Step = 'ticket' | 'client' | 'project' | 'release' | 'loading' | 'refresh'
type HierarchyCreation = {
  resource: 'client' | 'project' | 'release'
  id: string
  next: 'project' | 'release' | 'ticket'
  title: string
  open: { label: string; to: string }
}

const open = ref(false)
const props = withDefaults(defineProps<{ initialReleaseId?: string }>(), { initialReleaseId: '' })
const { invalidateMutation } = useAppDataInvalidation()
const { reportWrite } = useAppToast()
const step = ref<Step>('ticket')
const releaseId = ref(props.initialReleaseId)
const clientId = ref('')
const projectId = ref('')
const hierarchyBusy = ref(false)
const formPending = ref(false)
const hierarchyError = ref('')
const pendingHierarchy = ref<HierarchyCreation | null>(null)
const ticketFormKey = ref(0)
const canDismiss = computed(() => !hierarchyBusy.value && !formPending.value)

function preventOutsideDismiss(event: Event) {
  event.preventDefault()
}

watch(
  () => props.initialReleaseId,
  (value) => {
    if (step.value === 'ticket') releaseId.value = value
  },
)
watch(open, (value) => {
  if (!value) return
  step.value = 'ticket'
  releaseId.value = props.initialReleaseId
  clientId.value = ''
  projectId.value = ''
  hierarchyError.value = ''
  pendingHierarchy.value = null
  formPending.value = false
  ticketFormKey.value += 1
})

const modalTitle = computed(
  () =>
    ({
      ticket: 'New ticket',
      client: 'Create a client',
      project: 'Create a project',
      release: 'Create a release',
      loading: 'Preparing ticket setup',
      refresh: 'Refreshing ticket setup',
    })[step.value],
)
const modalDescription = computed(
  () =>
    ({
      ticket: 'Create a ticket without leaving this page.',
      client: 'Create the first level of the ticket hierarchy.',
      project: 'Create a project for the ticket hierarchy.',
      release: 'Create the release required by your ticket.',
      loading: 'Checking which hierarchy items need to be created.',
      refresh: 'The item was saved. Refresh its hierarchy before continuing.',
    })[step.value],
)

async function startHierarchy() {
  if (hierarchyBusy.value) return
  hierarchyBusy.value = true
  hierarchyError.value = ''
  step.value = 'loading'
  try {
    const result = await runClientRequest(async (signal) => {
      const [clientResult, projectResult] = await Promise.all([
        $fetch<{ clients: { id: string }[] }>('/api/clients', { signal }),
        $fetch<{ projects: { project: { id: string } }[] }>('/api/projects', { signal }),
      ])
      return { clients: clientResult.clients, projects: projectResult.projects }
    })
    if (result._tag === 'Failure') {
      hierarchyError.value = result.failure.userMessage
      step.value = 'loading'
      return
    }
    if (!result.value.clients.length) step.value = 'client'
    else if (!result.value.projects.length) step.value = 'project'
    else step.value = 'release'
  } finally {
    hierarchyBusy.value = false
  }
}

function advanceHierarchy(creation: HierarchyCreation) {
  pendingHierarchy.value = creation
  formPending.value = false
  step.value = 'refresh'
  hierarchyError.value = ''
  void refreshHierarchy()
}

function completeHierarchyCreation(creation: HierarchyCreation) {
  if (creation.resource === 'client') clientId.value = creation.id
  if (creation.resource === 'project') projectId.value = creation.id
  if (creation.resource === 'release') releaseId.value = creation.id
  step.value = creation.next
  pendingHierarchy.value = null
}

async function refreshHierarchy() {
  const creation = pendingHierarchy.value
  if (!creation || hierarchyBusy.value) return
  hierarchyBusy.value = true
  hierarchyError.value = ''
  try {
    const refreshed = await invalidateMutation(creation.resource)
    reportWrite(refreshed, {
      title: creation.title,
      duration: 10_000,
      open: creation.open,
    })
    if (refreshed._tag === 'Failure') {
      hierarchyError.value = refreshed.failure.userMessage
      return
    }
    completeHierarchyCreation(creation)
  } finally {
    hierarchyBusy.value = false
  }
}

async function retryHierarchyRefresh() {
  const creation = pendingHierarchy.value
  if (!creation || hierarchyBusy.value) return
  hierarchyBusy.value = true
  hierarchyError.value = ''
  try {
    const refreshed = await invalidateMutation(creation.resource)
    if (refreshed._tag === 'Failure') {
      hierarchyError.value = refreshed.failure.userMessage
      return
    }
    completeHierarchyCreation(creation)
  } finally {
    hierarchyBusy.value = false
  }
}

function onClientCreated(id: string) {
  advanceHierarchy({
    resource: 'client',
    id,
    next: 'project',
    title: 'Client created.',
    open: { label: 'Open client', to: `/clients/${id}` },
  })
}
function onProjectCreated(id: string) {
  advanceHierarchy({
    resource: 'project',
    id,
    next: 'release',
    title: 'Project created.',
    open: { label: 'Open project', to: `/projects/${id}` },
  })
}
function onReleaseCreated(id: string) {
  advanceHierarchy({
    resource: 'release',
    id,
    next: 'ticket',
    title: 'Release created.',
    open: { label: 'Open release', to: `/releases/${id}` },
  })
}

async function onTicketCreated(id: string) {
  open.value = false
  const refreshed = await invalidateMutation('ticket')
  reportWrite(refreshed, {
    title: 'Ticket created.',
    duration: 10_000,
    open: { label: 'Open ticket', to: `/tickets/${id}` },
  })
}

function cancelStep() {
  if (step.value === 'ticket') {
    open.value = false
    return
  }
  if (step.value === 'refresh' || step.value === 'loading') {
    step.value = 'ticket'
    pendingHierarchy.value = null
    hierarchyError.value = ''
    return
  }
  step.value = 'ticket'
}
function createProjectParent() {
  step.value = 'client'
}
function createReleaseParent() {
  step.value = 'project'
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="modalDescription"
    :dismissible="canDismiss"
    :content="modalFormShortcutContent({ onPointerDownOutside: preventOutsideDismiss })"
    :close="false"
    scrollable
  >
    <UButton icon="lucide:plus" label="New ticket" />
    <template #body>
      <div v-show="step === 'ticket'">
        <TicketCreateForm
          :key="ticketFormKey"
          :initial-release-id="releaseId"
          @created="onTicketCreated"
          @cancel="cancelStep"
          @pending-change="formPending = $event"
          @create-prerequisite="startHierarchy"
        />
      </div>
      <ClientCreateForm
        v-if="step === 'client'"
        cancel-label="Back to ticket"
        @created="onClientCreated"
        @cancel="cancelStep"
        @pending-change="formPending = $event"
      />
      <ProjectCreateForm
        v-if="step === 'project'"
        :initial-client-id="clientId"
        cancel-label="Back to ticket"
        @created="onProjectCreated"
        @cancel="cancelStep"
        @create-parent="createProjectParent"
        @pending-change="formPending = $event"
      />
      <ReleaseCreateForm
        v-if="step === 'release'"
        :initial-project-id="projectId"
        cancel-label="Back to ticket"
        @created="onReleaseCreated"
        @cancel="cancelStep"
        @create-parent="createReleaseParent"
        @pending-change="formPending = $event"
      />
      <TicketHierarchyTransition
        v-if="step === 'loading' || step === 'refresh'"
        :kind="step"
        :error="hierarchyError"
        :pending="hierarchyBusy"
        @cancel="cancelStep"
        @retry="step === 'loading' ? startHierarchy() : retryHierarchyRefresh()"
      />
    </template>
  </UModal>
</template>
