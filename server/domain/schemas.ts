import { Schema } from 'effect'
import { ticketStatuses } from '../../shared/ticket-status'

const HexColor = Schema.String.check(Schema.isPattern(/^#[0-9a-f]{6}$/i))
const Name = Schema.String.check(Schema.isTrimmed(), Schema.isPattern(/^\S(?:.{0,198}\S)?$/))
const Id = Schema.String.check(Schema.isMinLength(1))
const TargetDate = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/))

export const ClientCreate = Schema.Struct({ name: Name, color: Schema.optional(HexColor) })
export const ClientUpdate = Schema.Struct({
  name: Schema.optional(Name),
  color: Schema.optional(HexColor),
  archived: Schema.optional(Schema.Boolean),
})

export const ProjectCreate = Schema.Struct({ clientId: Id, name: Name, color: HexColor })
export const ProjectUpdate = Schema.Struct({
  name: Schema.optional(Name),
  color: Schema.optional(HexColor),
  archived: Schema.optional(Schema.Boolean),
})

export const ReleaseCreate = Schema.Struct({
  projectId: Id,
  name: Name,
  targetDate: Schema.optional(Schema.NullOr(TargetDate)),
})
export const ReleaseUpdate = Schema.Struct({
  name: Schema.optional(Name),
  targetDate: Schema.optional(Schema.NullOr(TargetDate)),
  archived: Schema.optional(Schema.Boolean),
})

const TicketTitle = Schema.String.check(Schema.isTrimmed(), Schema.isPattern(/^\S(?:.{0,198}\S)?$/))
const TicketStatus = Schema.Literals(ticketStatuses)
const Estimate = Schema.NullOr(Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)))
const Description = Schema.String.check(Schema.isMaxLength(10000))
const LinkLabel = Schema.String.check(Schema.isTrimmed(), Schema.isPattern(/^\S(?:.{0,198}\S)?$/))

export const TicketLinkCreate = Schema.Struct({
  label: Schema.optional(Schema.NullOr(LinkLabel)),
  url: Schema.String,
})
export const TicketLinkUpdate = Schema.Struct({
  label: Schema.optional(Schema.NullOr(LinkLabel)),
  url: Schema.optional(Schema.String),
})
export const TicketRelationCreate = Schema.Struct({ ticketId: Id })

export const TicketCreate = Schema.Struct({
  releaseId: Id,
  title: TicketTitle,
  description: Schema.optional(Description),
  status: Schema.optional(TicketStatus),
  estimateMinutes: Schema.optional(Estimate),
  links: Schema.optional(Schema.Array(TicketLinkCreate)),
  relatedTicketIds: Schema.optional(Schema.Array(Id)),
})
export const TicketUpdate = Schema.Struct({
  releaseId: Schema.optional(Id),
  title: Schema.optional(TicketTitle),
  description: Schema.optional(Description),
  status: Schema.optional(TicketStatus),
  estimateMinutes: Schema.optional(Estimate),
  archived: Schema.optional(Schema.Boolean),
})
const EntryMinute = Schema.Number.check(Schema.isInt())
const Weekday = Schema.Literals([0, 1, 2, 3, 4, 5, 6] as const)
export const AgendaSettingsUpdate = Schema.Struct({
  visibleStartMinute: EntryMinute,
  visibleEndMinute: EntryMinute,
  workDayDurationMinutes: EntryMinute,
  startOfWeekDay: Weekday,
})
export const TimeEntryCreate = Schema.Struct({
  ticketId: Id,
  date: TargetDate,
  startMinute: EntryMinute,
  durationMinutes: EntryMinute,
  description: Schema.optional(Description),
})
export const TimeEntryUpdate = Schema.Struct({
  ticketId: Schema.optional(Id),
  date: Schema.optional(TargetDate),
  startMinute: Schema.optional(EntryMinute),
  durationMinutes: Schema.optional(EntryMinute),
  description: Schema.optional(Description),
})
