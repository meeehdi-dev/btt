type SortableRelease = {
  readonly targetDate: string | null
  readonly name: string
  readonly createdAt: Date | string
  readonly id: string
}

function creationTime(release: SortableRelease) {
  return release.createdAt instanceof Date
    ? release.createdAt.getTime()
    : Date.parse(release.createdAt)
}

function compareCreation(a: SortableRelease, b: SortableRelease) {
  return creationTime(b) - creationTime(a) || a.id.localeCompare(b.id)
}

export function compareReleases(a: SortableRelease, b: SortableRelease) {
  if (!a.targetDate && !b.targetDate) return a.name.localeCompare(b.name) || compareCreation(a, b)
  if (!a.targetDate) return -1
  if (!b.targetDate) return 1
  return (
    a.targetDate.localeCompare(b.targetDate) ||
    a.name.localeCompare(b.name) ||
    compareCreation(a, b)
  )
}
