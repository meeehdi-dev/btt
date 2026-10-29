<script setup lang="ts">
import { vModalAutofocus } from '~/utils/modal-autofocus'
import CreateEntityPrerequisite from './CreateEntityPrerequisite.vue'
import CreateFormFooter from './CreateFormFooter.vue'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { useEntityCreate } from '~/composables/useEntityCreate'
import { submitModalFormOnShortcut } from '~/composables/modal-form-shortcuts'

const props = withDefaults(defineProps<{ initialProjectId?: string; cancelLabel?: string }>(), {
  initialProjectId: '',
  cancelLabel: 'Cancel',
})
const emit = defineEmits<{
  created: [id: string]
  cancel: []
  createParent: []
  pendingChange: [pending: boolean]
}>()

const {
  data: projectData,
  pending: projectsPending,
  error: projectsError,
  refresh: refreshProjects,
} = await trackAppApiFetch(useApiFetch('/api/projects', { key: 'app-api:projects:list:active' }), {
  key: 'app-api:projects:list:active',
  resources: ['projects', 'hierarchy', 'search'],
})
const projects = computed(() => projectData.value?.projects ?? [])
const projectSearchInput = useSelectSearchInput('Search projects…')
const projectPickerOpen = ref(false)
const projectId = ref(props.initialProjectId)
const name = ref('')
const targetDate = ref('')
watch(
  [projects, projectsPending, () => props.initialProjectId],
  ([available, loading, initialId]) => {
    if (initialId && available.some((project) => project.project.id === initialId)) {
      projectId.value = initialId
      return
    }
    if (!loading && !available.some((project) => project.project.id === projectId.value))
      projectId.value = ''
  },
  { immediate: true },
)

const canSubmit = computed(() =>
  projects.value.some((project) => project.project.id === projectId.value),
)
function selectProject(id: string) {
  projectId.value = id
  projectPickerOpen.value = false
}

const { pending, errorMessage, submit } = useEntityCreate({
  endpoint: '/api/releases',
  body: () => ({
    projectId: projectId.value,
    name: name.value.trim(),
    targetDate: targetDate.value || null,
  }),
  onCreated: (id) => emit('created', id),
})
watch(pending, (value) => emit('pendingChange', value))
</script>

<template>
  <div v-if="projectsError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      title="Could not load projects"
      :description="clientFailureMessage(projectsError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading projects"
      @click="refreshProjects()"
    />
  </div>
  <UCard v-else-if="projectsPending"><p class="text-muted">Loading available projects…</p></UCard>
  <CreateEntityPrerequisite
    v-else-if="!projects.length"
    entity="Release"
    parent="project"
    :cancel-label="props.cancelLabel"
    @cancel="emit('cancel')"
    @create-parent="emit('createParent')"
  />
  <form
    v-else
    v-modal-autofocus
    class="space-y-3"
    @keydown.capture="submitModalFormOnShortcut"
    @submit.prevent="submit"
  >
    <UFormField label="Project" required>
      <USelectMenu
        :model-value="projectId"
        v-model:open="projectPickerOpen"
        value-key="value"
        :items="
          projects.map((project) => ({
            label: `${project.clientName} · ${project.project.name}`,
            value: project.project.id,
          }))
        "
        :search-input="projectSearchInput"
        aria-label="Project"
        class="w-full"
        placeholder="Choose a project"
        :disabled="pending"
        @update:model-value="selectProject"
      />
    </UFormField>
    <UFormField label="Name" required>
      <UInput
        v-model="name"
        data-modal-autofocus
        class="w-full"
        maxlength="200"
        placeholder="Q4 launch"
        required
      />
    </UFormField>
    <UFormField label="Target date" hint="Optional">
      <UInput v-model="targetDate" type="date" class="w-full" :disabled="pending" />
    </UFormField>
    <CreateFormFooter
      entity="release"
      :error-message="errorMessage"
      :pending="pending"
      :can-submit="canSubmit"
      :cancel-label="props.cancelLabel"
      @cancel="emit('cancel')"
    />
  </form>
</template>
