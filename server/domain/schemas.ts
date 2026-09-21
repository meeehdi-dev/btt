import { Schema } from 'effect'

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

export type ClientCreateInput = Schema.Schema.Type<typeof ClientCreate>
export type ClientUpdateInput = Schema.Schema.Type<typeof ClientUpdate>
export type ProjectCreateInput = Schema.Schema.Type<typeof ProjectCreate>
export type ProjectUpdateInput = Schema.Schema.Type<typeof ProjectUpdate>
export type ReleaseCreateInput = Schema.Schema.Type<typeof ReleaseCreate>
export type ReleaseUpdateInput = Schema.Schema.Type<typeof ReleaseUpdate>
