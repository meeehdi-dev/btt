<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <UButton
    square
    :color="model ? 'primary' : 'neutral'"
    :variant="model ? 'soft' : 'ghost'"
    icon="lucide:archive-restore"
    :title="model ? 'Hide archived' : 'Show archived'"
    :aria-label="model ? 'Hide archived' : 'Show archived'"
    :aria-pressed="model"
    @click="model = !model"
  />
</template>
