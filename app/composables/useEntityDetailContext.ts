export function useEntityDetailContext() {
  const route = useRoute()
  return {
    id: route.params.id as string,
    archived: computed(() => route.query.archived === 'true'),
  }
}
