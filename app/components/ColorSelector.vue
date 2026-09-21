<script setup lang="ts">
const model = defineModel<string>({ required: true })

const presets = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
]

function selectPreset(color: string) {
  model.value = color
}
</script>

<template>
  <UPopover>
    <UButton color="neutral" variant="outline" aria-label="Choose color">
      <span class="size-4 rounded-full border border-default" :style="{ backgroundColor: model }" />
      <span class="font-mono text-xs uppercase">{{ model }}</span>
    </UButton>
    <template #content>
      <div class="w-56 space-y-4 p-3">
        <div>
          <p class="mb-2 text-xs font-medium text-muted">Preset colors</p>
          <div class="grid grid-cols-8 gap-2" aria-label="Preset colors">
            <button
              v-for="preset in presets"
              :key="preset"
              type="button"
              class="size-5 rounded-full border border-default ring-offset-2 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary"
              :class="{ 'ring-2 ring-primary': model.toLowerCase() === preset }"
              :style="{ backgroundColor: preset }"
              :aria-label="`Select ${preset}`"
              :aria-pressed="model.toLowerCase() === preset"
              @click="selectPreset(preset)"
            />
          </div>
        </div>
        <div>
          <p class="mb-2 text-xs font-medium text-muted">Custom color</p>
          <UColorPicker v-model="model" format="hex" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
