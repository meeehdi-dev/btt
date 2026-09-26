<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <UTooltip :text="model ? 'Hide archived' : 'Show archived'">
    <UButton
      square
      :color="model ? 'primary' : 'neutral'"
      :variant="model ? 'soft' : 'ghost'"
      icon="lucide:archive-restore"
      :aria-label="model ? 'Hide archived' : 'Show archived'"
      :aria-pressed="model"
      @click="model = !model"
    />
  </UTooltip>
</template>
