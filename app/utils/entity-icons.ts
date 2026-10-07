export const entityIcons = {
  agenda: 'lucide:calendar-days',
  clients: 'lucide:building-2',
  projects: 'lucide:folder-kanban',
  releases: 'lucide:flag',
  tickets: 'lucide:ticket',
  settings: 'lucide:settings-2',
  related: 'lucide:link-2',
} as const

export type EntityKind = keyof typeof entityIcons
