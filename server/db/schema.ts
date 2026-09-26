import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { ticketStatuses } from '../../shared/ticket-status'

export const user = pgTable('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: uuid('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: uuid('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const client = pgTable(
  'client',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#64748b'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('client_user_id_idx').on(table.userId)],
)

export const project = pgTable(
  'project',
  {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('project_client_id_idx').on(table.clientId)],
)

export const release = pgTable(
  'release',
  {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    targetDate: date('target_date'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('release_project_id_idx').on(table.projectId)],
)

export const ticketStatus = pgEnum('ticket_status', ticketStatuses)

export const ticket = pgTable(
  'ticket',
  {
    id: uuid('id').primaryKey(),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => release.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: ticketStatus('status').notNull().default('Idea'),
    estimateMinutes: integer('estimate_minutes'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('ticket_release_id_idx').on(table.releaseId),
    check(
      'ticket_estimate_positive_check',
      sql`${table.estimateMinutes} is null or ${table.estimateMinutes} > 0`,
    ),
  ],
)

export const ticketLink = pgTable(
  'ticket_link',
  {
    id: uuid('id').primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'restrict' }),
    label: text('label').notNull(),
    url: text('url').notNull(),
  },
  (table) => [index('ticket_link_ticket_id_idx').on(table.ticketId)],
)

export const ticketRelation = pgTable(
  'ticket_relation',
  {
    id: uuid('id').primaryKey(),
    fromTicketId: uuid('from_ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'restrict' }),
    toTicketId: uuid('to_ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('ticket_relation_pair_idx').on(table.fromTicketId, table.toTicketId),
    index('ticket_relation_to_idx').on(table.toTicketId),
    check('ticket_relation_order_check', sql`${table.fromTicketId} < ${table.toTicketId}`),
  ],
)

export const userSettings = pgTable(
  'user_settings',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    visibleStartMinute: integer('visible_start_minute').notNull().default(480),
    visibleEndMinute: integer('visible_end_minute').notNull().default(1200),
    workDayDurationMinutes: integer('work_day_duration_minutes').notNull().default(480),
  },
  (table) => [
    check(
      'user_settings_window_check',
      sql`${table.visibleStartMinute} >= 0 and ${table.visibleStartMinute} < ${table.visibleEndMinute} and ${table.visibleEndMinute} <= 1440 and ${table.visibleStartMinute} % 30 = 0 and ${table.visibleEndMinute} % 30 = 0`,
    ),
    check(
      'user_settings_duration_check',
      sql`${table.workDayDurationMinutes} >= 30 and ${table.workDayDurationMinutes} <= 1440 and ${table.workDayDurationMinutes} % 30 = 0`,
    ),
  ],
)

export const timeEntry = pgTable(
  'time_entry',
  {
    id: uuid('id').primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'restrict' }),
    date: date('date').notNull(),
    startMinute: integer('start_minute').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('time_entry_ticket_date_idx').on(table.ticketId, table.date),
    index('time_entry_date_idx').on(table.date),
    check(
      'time_entry_start_check',
      sql`${table.startMinute} >= 0 and ${table.startMinute} < 1440 and ${table.startMinute} % 30 = 0`,
    ),
    check(
      'time_entry_duration_check',
      sql`${table.durationMinutes} >= 30 and ${table.durationMinutes} % 30 = 0 and ${table.startMinute} + ${table.durationMinutes} <= 1440`,
    ),
  ],
)

export const authSchema = { user, session, account, verification }
export const appSchema = {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
  timeEntry,
  userSettings,
}
export const schema = { ...authSchema, ...appSchema }

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Client = typeof client.$inferSelect
export type Project = typeof project.$inferSelect
export type Release = typeof release.$inferSelect
export type Ticket = typeof ticket.$inferSelect
export type TimeEntry = typeof timeEntry.$inferSelect
export type UserSettings = typeof userSettings.$inferSelect
