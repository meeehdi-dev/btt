<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    as?: 'div' | 'article'
    contentInteractive?: boolean
  }>(),
  { as: 'div', contentInteractive: false },
)
</script>

<template>
  <component
    :is="as"
    v-bind="$attrs"
    class="group relative rounded-lg border border-default bg-elevated p-4 transition-colors hover:border-primary focus-within:border-primary"
  >
    <slot name="navigation" />
    <div class="relative z-10 space-y-2" :class="{ 'pointer-events-none': !contentInteractive }">
      <div class="flex min-w-0 items-start justify-between gap-3">
        <slot name="heading" />
      </div>
      <div
        v-if="$slots.context"
        data-entity-card-context
        class="flex min-w-0 flex-wrap items-center gap-1"
      >
        <slot name="context" />
      </div>
    </div>
  </component>
</template>
