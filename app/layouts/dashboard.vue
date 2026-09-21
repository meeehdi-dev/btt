<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-muted bg-elevated">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span class="font-semibold text-highlighted">nxmr</span>
        <span class="text-sm text-muted">M0 dashboard</span>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-6 py-10">
      <slot />
    </main>
  </div>
</template>
