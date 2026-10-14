<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
throw createError({ statusCode: 404, statusMessage: 'Page not found' })
</script>
