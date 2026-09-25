<script setup lang="ts">
import { entityIcons, type EntityKind } from '~/utils/entity-icons'

defineProps<{ kind: EntityKind }>()
</script>

<template>
  <UIcon :name="entityIcons[kind]" class="inline-block size-4 shrink-0" aria-hidden="true" />
</template>
