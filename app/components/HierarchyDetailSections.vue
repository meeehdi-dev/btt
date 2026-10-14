<template>
  <div data-hierarchy-detail-sections class="space-y-4">
    <div class="grid max-w-2xl grid-cols-2 gap-2">
      <slot name="fields" />
    </div>
    <slot name="feedback" />
    <slot name="actions" />
    <hr class="border-default" />
    <slot name="items" />
  </div>
</template>
